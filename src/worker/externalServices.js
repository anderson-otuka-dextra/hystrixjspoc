const express = require('express');

module.exports = {
    start: (cfg) => {
        const externalServices = new ExternalServices(cfg.port, JSON.parse(cfg.verbose));
        process.on('message', function(msg) {
            if (msg == 'start') {
                externalServices.start();
            }
        });
    }
};

function ExternalServices (port, verbose) {
    const app = express();

    app.get('/date', function(req, res) {
        setTimeout(() => {
            if (verbose) console.log("[%d] ExternalServices: getDate", process.pid);
            res.send(new Date());
        }, 500)
    });

    let count = 0;
    app.get('/count', function(req, res) {
        setTimeout(() => {
            if (verbose) console.log("[%d] ExternalServices: getCount", process.pid);
            res.send('' + ++count);
        }, 100)
    });

    this.start = function() {
        process.title = 'externalServices';
        app.listen(port, function() {
            var start = Date.now();
            console.log(`[${process.pid}] ExternalServices listening on port [${port}]. Available endpoints:
- http://localhost:${port}/date
- http://localhost:${port}/count
`);
        });
    };
};
