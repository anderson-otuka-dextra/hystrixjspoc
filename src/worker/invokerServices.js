const express = require('express'),
    Promise = require('q'),
    request = require('request'),
    http = require('request-promise-json'),
    _ = require("lodash"),
    hystrixStream = require('../lib/hystrixStream'),
    CommandsFactory = require("hystrixjs/lib/command/CommandFactory");

const CONFIG = {
    timeout: 7000,
    resetTime: 10000,
    concurrency: 6,
    errorThreshold: 10
};

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
    var app = express(),
        cbs = [],
        commands = [],
        reqs = 0;

    const createHttpRequestCommandPromise = (name) =>
        CommandsFactory.getOrCreate(`${name}`)
            .circuitBreakerErrorThresholdPercentage(CONFIG.errorThreshold)
            .timeout(CONFIG.timeout)
            .circuitBreakerRequestVolumeThreshold(CONFIG.concurrency)
            .circuitBreakerSleepWindowInMilliseconds(CONFIG.timeout)
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
        const getDateFromAPI = createHttpRequestCommandPromise(`Service ${EXT_DATE_SERVICE}`);
        app.get('/getDateFromAPI', (req, res) => {
            if (verbose) console.log("[%d] InvokerServices: getDateFromAPI", process.pid);
            
            const promises = [];
            promises.push(getDateFromAPI.execute({
                method: "GET",
                url: EXT_DATE_SERVICE
            }));

            Promise.all(promises).then(function(results) {
                results.forEach(function(result) {
                    res.send(results.join("\n"));
                    res.set('Content-Type', 'text/plain');
                });
            }).catch(function(error) {
                res.send("Error: " + error);
            });
        });

        const EXT_COUNT_SERVICE = `http://localhost:${externalServicesPort}/count`;
        const getCountFromAPI = createHttpRequestCommandPromise(`Service ${EXT_COUNT_SERVICE}`);
        app.get('/getCountFromAPI', (req, res) => {
            if (verbose) console.log("[%d] InvokerServices: getCountFromAPI", process.pid);

            const promises = [];
            promises.push(getCountFromAPI.execute({
                method: "GET",
                url: EXT_COUNT_SERVICE
            }));

            Promise.all(promises).then(function(results) {
                results.forEach(function(result) {
                    res.send(results.join("\n"));
                    res.set('Content-Type', 'text/plain');
                });
            }).catch(function(error) {
                res.send("Error: " + error);
            });
        });

        app.get('/getDateAndCountFromAPI', (req, res) => {
            if (verbose) console.log("[%d] InvokerServices: getDateAndCountFromAPI", process.pid);

            const promises = [];
            promises.push(getDateFromAPI.execute({
                method: "GET",
                url: EXT_DATE_SERVICE
            }));
            promises.push(getCountFromAPI.execute({
                method: "GET",
                url: EXT_COUNT_SERVICE
            }));
            Promise.all(promises).then(function(results) {
                results.forEach(function(result) {
                    res.send(results.join("\n"));
                    res.set('Content-Type', 'text/plain');
                });
            }).catch(function(error) {
                res.send("Error: " + error);
            });
        });        
    };

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
    };
};
