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
    let minLatency = {
        'date': 900,
        'count': 50
    }
    let latency = {
        'date': 900,
        'count': 50
    }
    let openConnections = {
        'date': 0,
        'count': 0
    }

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get('/date', function(req, res) {
        const delay = latency.date;
        let connNumber = ++openConnections.date;
        setTimeout(() => {
            if (verbose) {
                console.log(port, new Date(), 'Returning connection', connNumber, 'Connections open = ', openConnections.date - connNumber);
                console.log("[%d] ExternalServices: getDate", process.pid);
            }
            res.send(new Date());
            latency.date -= 200;
            if (latency.date < minLatency.date) {
                latency.date = minLatency.date;
            }
        }, delay)
        latency.date += 200;
        /*if (verbose)*/ console.log(port, new Date(), 'Opening connection', connNumber, '- Will close in:', delay);
    });

    let count = 0;
    app.get('/count', function(req, res) {
        const delay = latency.count;
        setTimeout(() => {
            if (verbose) console.log("[%d] ExternalServices: getCount", process.pid);
            res.send('' + ++count);
        }, delay)
    });

    app.get('/latency/:endpoint/:amount', function(req, res) {
        const endpoint = req.params.endpoint;
        const amount = req.params.amount;
        if (amount.charAt(0) === '=') {
            minLatency[endpoint] = parseInt(amount.substring(1));
        } else if (amount.charAt(0) === '+') {
            minLatency[endpoint] += parseInt(amount.substring(1));
        } else if (amount.charAt(0) === '-') {
            minLatency[endpoint] -= parseInt(amount.substring(1));
            if (minLatency[endpoint] < 0) {
                minLatency[endpoint] = 0
            }
        }
        if (verbose) console.log(`${process.pid} ExternalServices: minLatency for [${endpoint}] set to [${minLatency[endpoint]}]`);
        res.write(amount);
        res.end();
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
