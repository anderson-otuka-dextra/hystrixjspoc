const express = require('express'),
    Promise = require('q'),
    request = require('request'),
    http = require('request-promise-json'),
    _ = require("lodash"),
    hystrixStream = require('../lib/hystrixStream'),
    CommandsFactory = require("hystrixjs/lib/command/CommandFactory"),
    fs = require('fs'),
    path = require('path');

const CONFIG = {
    timeout: 4000,
    resetTime: 5000,
    concurrency: 20,
    errorThreshold: 10
};

const indexHtml = path.join(__dirname, '..', 'web', 'index.html');

module.exports = {
    start: (cfg) => {
        const invokerServices = new InvokerServices(cfg.port, cfg.externalServicesPort, JSON.parse(cfg.verbose));
        process.on('message', function (msg) {
            if (msg == 'start') {
                invokerServices.configure();
                invokerServices.start();
            }
        });
    }
};


function InvokerServices (port, externalServicesPort, verbose) {

    let timeout = 0;
    let openCircuit = 0;
    let unknownError = 0;
    let success = 0;
    let opened = 0;
    let closed = 0;
    let lastClosed = 0;

    var app = express(),
        cbs = [],
        commands = [],
        reqs = 0;

    const createHttpRequestCommandPromise = (name) =>
        CommandsFactory.getOrCreate(`${name}`)
            .circuitBreakerErrorThresholdPercentage(CONFIG.errorThreshold)
            .timeout(CONFIG.timeout)
            .circuitBreakerRequestVolumeThreshold(CONFIG.concurrency)
            .circuitBreakerSleepWindowInMilliseconds(CONFIG.resetTime)
            .statisticalWindowLength(10000)
            .statisticalWindowNumberOfBuckets(10)
            .run(options => {
                let req = _.assign(options);
                return http.request(req);
            })
            .errorHandler(error => {
                if (error) {
                    return error;
                }
                if (error.statusCode == 503) {
                    var unavailableError = new Error();
                    unavailableError.name = "ServiceUnavailableError";
                    return unavailableError;
                }
                return null;
            })
            .build();        

    this.configure = function() {
        const EXT_DATE_SERVICE = `http://localhost:${externalServicesPort}/date`;
        const getDateFromAPI = createHttpRequestCommandPromise(`/date`);

        const EXT_COUNT_SERVICE = `http://localhost:${externalServicesPort}/count`;
        const getCountFromAPI = createHttpRequestCommandPromise(`/count`);

        let nConnectionsPerSec = 1;

        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        app.get('/setNumberConnectionsPerSecond/:n', (req, res) => {
            const param = req.params.n
            if (param.charAt(0) === '=') {
                nConnectionsPerSec = parseInt(param.substring(1));
            } else if (param.charAt(0) === '+') {
                nConnectionsPerSec += parseInt(param.substring(1));
            } else if (param.charAt(0) === '-') {
                nConnectionsPerSec -= parseInt(param.substring(1));
                if (nConnectionsPerSec < 0) {
                    nConnectionsPerSec = 0
                }
            }
            console.log("[%d] InvokerServices: Connections Per Second = %d", process.pid, nConnectionsPerSec);
            res.set('Content-Type', 'text/plain');
            res.write('' + nConnectionsPerSec);
            res.end();
        });

        app.get('/getDateAndCountFromAPI', (req, res) => {
            if (verbose) console.log("[%d] InvokerServices: getDateAndCountFromAPI [%d]", process.pid, nConnectionsPerSec);

            const promises = [];
            for (let i = 0; i <= nConnectionsPerSec; i++) {
                setTimeout(() => {
                    if (i < nConnectionsPerSec) {
                        opened++;
                        promises.push(getDateFromAPI.execute({
                            method: "GET",
                            url: EXT_DATE_SERVICE
                        }).then(() => {
                            success++;
                        }).catch(error => {
                            if (error.message === 'CommandTimeOut') {
                                timeout++;
                            } else if (error.message === 'OpenCircuitError') {
                                openCircuit++;
                            } else {
                                unknownError++;
                            }
                        }).then(() => {
                            closed++;
                        }));
                        promises.push(getCountFromAPI.execute({
                            method: "GET",
                            url: EXT_COUNT_SERVICE
                        }).catch(error => {
                        }));
                    } else {
                        Promise.all(promises).then(function(results) {
                            results.forEach(function(result) {
                                res.send(results.join("\n"));
                                res.set('Content-Type', 'text/plain');
                            });
                        }).catch(function(error) {
                            res.send("Error: " + error);
                        });
                    }
                }, 1000 * (i / nConnectionsPerSec))
            }
        });        
    };

    app.get('/', (request, response) => {
        response.append('Content-Type', 'text/html;charset=UTF-8');
        response.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        response.append('Pragma', 'no-cache');
        response.write(fs.readFileSync(indexHtml).toString('utf8'));
    });

    app.get('/api/hystrix.stream', hystrixStream);

    this.start = function() {
        process.title = `invokerServices:${port}`;
        app.listen(port, function() {
            var start = Date.now();
            console.log(`[${process.pid}] InvokerServices listening on port [${port}]. Available endpoints:
- http://localhost:${port}/getDateFromAPI
- http://localhost:${port}/getCountFromAPI
- http://localhost:${port}/getDateAndCountFromAPI
- http://localhost:${port}/api/hystrix.stream (Hystrix Dashboard)
`);
        });
        setInterval(() => {
            let waiting = opened - closed;
            console.log(`[${process.pid}] ${success}/${closed-lastClosed} success`
                + `${waiting ? ' | ' + waiting + ' waiting' : ''}`
                + `${timeout ? ' | ' + timeout + ' timeout' : ''}`
                + `${openCircuit ? ' | ' + openCircuit + ' openCircuit' : ''}`
                + `${unknownError ? ' | ' + unknownError + ' unknownError' : ''}`);
            timeout = 0;
            openCircuit = 0;
            unknownError = 0;
            success = 0;
            lastClosed = closed;
        }, 1000);
    };
};
