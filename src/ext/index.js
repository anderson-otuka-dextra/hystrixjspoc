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
    this.start = () => {
        process.title = 'externalServices'
        app.listen(port, () => logInit(port))
    };

    const app = express();
    const serviceDelay = { get: 100, load: 500, update: 1000 }

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    })

    app.get('/get/:id', (req, res) =>
        getInfoImpl(res, 'get', req.params.id)
    )
    app.get('/load/:id', (req, res) =>
        getInfoImpl(res, 'load', req.params.id)
    )
    app.post('/update/:id/:newValue', (req, res) =>
        updateInfoImpl(res, req.params.id, req.params.newValue)
    )
    app.post('/_META/delay/:service/:delay', (req, res) =>
        updateDelayImpl(res, req.params.service, Math.floor(req.params.delay))
    )

    function getInfoImpl (res, service, id) {
        setTimeout(
            () => writeResponse(
                res,
                { "value": id },
                `[${process.pid}] [ExternalServices] << [GET ${service}/${id}] OK`
            ), serviceDelay[service]
        )
    }

    function updateInfoImpl (res, id, newValue) {
        setTimeout(
            () => writeResponse(
                res,
                result,
                `[${process.pid}] [ExternalServices] << [POST /update/${id}/${newValue}] OK`
            ), serviceDelay.update
        )
    }

    function updateDelayImpl (res, service, delay) {
        if (typeof serviceDelay[service] == 'undefined') {
            return writeResponse(res, false, `[${process.pid}] [ExternalServices] << [POST /_META/delay/${service}/${delay}] ERROR`)
        }
        serviceDelay[service] = delay;
        writeResponse(res, true, `[${process.pid}] [ExternalServices] << [POST /_META/delay/${service}/${delay}] OK`)
    }

    function writeResponse (res, msg) {
        res.set('Content-Type', 'text/plain');
        res.send(msg);
        res.end();
    }

    function logInit (port) {
        console.log(`- pid=${process.pid} >> ExternalServices listening on port [${port}]`)
    }
}