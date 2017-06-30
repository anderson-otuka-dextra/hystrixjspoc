const express = require('express'),
    hystrixStream = require('./lib/hystrixStream'),
    externalCallsWrapper = require('./lib/externalCallsWrapper')
    fs = require('fs'),
    path = require('path');

module.exports = {
    start: (cfg) => {
        const application = new Application(cfg.port, cfg.externalServicesPort, JSON.parse(cfg.verbose));
        process.on('message', (msg) => {
            if (msg == 'start') {
                application.start();
            }
        });
    }
};

function Application (port, extPort, verbose) {
    this.start = () => {
        process.title = `Application-${port}`;
        init();
    };

    function init () {
        const app = express(),
            ext = externalCallsWrapper.getInstance(extPort);

        app.get ('/info/:id',           (req, res) => implGet(res, req.params.id) );
        app.post('/info/:id/:value',    (req, res) => implUpdate(res, req.params.id, req.params.value) );
        app.get ('/',                   (req, res) => implHome(res) );
        app.get ('/api/hystrix.stream', (req, res) => hystrixStream(res) );

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
 
        app.listen(port, () => logInit(port));

        function implGet (res, id) {
            ext.get(id)
                .then(r => writeResponse(res, r))
                .catch(err => fallbackGet(res, err, id));
        }

        function fallbackGet (res, err, id) {
            ext.load(id)
                .then(r => writeResponse(res, r))
                .catch(err => writeResponse(res, err.message
                    ? { source: `GET /info/${id}`, error: 'External Fallback service error', cause: err.message }
                    : { source: `GET /info/${id}`, error: 'External service error', cause: 'Unknown' }
                ))
        }

        function implUpdate (res, id, value) {
            implGet(res, id)
                .then(r => r.error ? r : ext.update(id, value))
                .catch(err => writeResponse(res, err.message
                    ? { source: `POST /info/${id}/${value}`, error: 'Update service error', cause: err.message }
                    : { source: `POST /info/${id}/${value}`, error: 'Internal server error', cause: 'Unknown' }
                ))
        }

        const indexHtml = path.join(__dirname, '..', 'web', 'index.html');
        function implHome (res) {
            res.append('Content-Type', 'text/html;charset=UTF-8');
            res.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
            res.append('Pragma', 'no-cache');
            res.write(fs.readFileSync(indexHtml).toString('utf8'));
        };

        function writeResponse (res, msg) {
            res.set('Content-Type', 'text/plain');
            res.send(msg);
            res.end();
        }

        function logInit (port) {
            console.log(`- pid=${process.pid} >> Application listening on port [${port}]`);
        }
    };
};
