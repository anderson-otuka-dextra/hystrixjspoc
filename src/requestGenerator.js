module.exports = {
    start: (cfg) => {
        var reqGen = new RequestGenerator(JSON.parse(cfg.ports), JSON.parse(cfg.verbose), JSON.parse(cfg.externalServicePort));
        process.on('message', function(msg) {
            if (msg == 'start') {
                reqGen.start();
            }
        });
    }
};

const http = require('request-promise-json')

function RequestGenerator (ports, verbose, extPort) {
    const SERV_NAME = '[RequestGenerator]';

    function doRequest(ctx) {
        let url;
/*
        setTimeout(() => {
            url = `http://localhost:${ctx.port}/info/1`;
            console.log(`[${process.pid}] ${SERV_NAME} >> GET ${url}`)
            http.request({ method: "GET", url: url })
                .then(r => console.log(`[${process.pid}] ${SERV_NAME} == ${JSON.stringify(r)}`))
                .catch(error => console.log("[${process.pid}] ${SERV_NAME} ERROR: ", JSON.stringify(error)))
        }, 1);

        setTimeout(() => {
            url = `http://localhost:${ctx.port}/info/1/9001`;
            console.log(`[${process.pid}] ${SERV_NAME} >> POST ${url}`)
            http.request({ method: "POST", url: url })
                .then(r => console.log(`[${process.pid}] ${SERV_NAME} == ${JSON.stringify(r)}`))
                .catch(error => console.log("[${process.pid}] ${SERV_NAME} ERROR: ", JSON.stringify(error)))
        }, 2001);

        setTimeout(() => {
            url = `http://localhost:${ctx.port}/info/1`;
            console.log(`[${process.pid}] ${SERV_NAME} >> GET ${url}`)
            http.request({ method: "GET", url: url })
                .then(r => console.log(`[${process.pid}] ${SERV_NAME} == ${JSON.stringify(r)}`))
                .catch(error => console.log("[${process.pid}] ${SERV_NAME} ERROR: ", JSON.stringify(error)))
        }, 4001);

        setTimeout(() => {
            url = `http://localhost:${ctx.port}/info/2`;
            console.log(`[${process.pid}] ${SERV_NAME} >> GET ${url}`)
            http.request({ method: "GET", url: url })
                .then(r => console.log(`[${process.pid}] ${SERV_NAME} == ${JSON.stringify(r)}`))
                .catch(error => console.log("[${process.pid}] ${SERV_NAME} ERROR: ", JSON.stringify(error)))
        }, 6001);
*/

        const delayedCall = (delay, method, url) =>
            setTimeout(() => {
                console.log(`${method} ${url} ->`)
                http.request({ method: method, url: url })
                    .then(r => console.log(`${method} ${url} == ${JSON.stringify(r)}`))
                    .catch(error => console.log(`${method} ${url} ERROR:`, JSON.stringify(error)))
            }, delay);

        delayedCall(1, 'POST', `http://localhost:${ctx.extPort}/_META/delay/get/100`);
        delayedCall(3400, 'POST', `http://localhost:${ctx.extPort}/_META/delay/get/6000`);
        delayedCall(8400, 'POST', `http://localhost:${ctx.extPort}/_META/delay/load/6000`);
        delayedCall(13400, 'POST', `http://localhost:${ctx.extPort}/_META/delay/get/100`);
        delayedCall(18400, 'POST', `http://localhost:${ctx.extPort}/_META/delay/load/100`);

        for (let i = 1000; i <= 20000; i += 500) {
            delayedCall(i, 'GET', `http://localhost:${ctx.port}/info/${i}`);
        }
    }
    
    this.start = function(options) {
        setTimeout(() =>
            ports.forEach( port => doRequest({port: port, extPort: extPort}) )
            , 500
        );
    };
};
