module.exports = {
    start: (cfg) => {
        var reqGen = new RequestGenerator(JSON.parse(cfg.ports), JSON.parse(cfg.verbose));
        process.on('message', function(msg) {
            if (msg == 'start') {
                reqGen.start();
            }
        });
    }
};

const request = require('request');

function RequestGenerator (ports, verbose) {
    function doRequest(ctx) {
        let url = `http://localhost:${ctx.port}/getDateAndCountFromAPI`;
        if (verbose) console.log(`[${process.pid}] RequestGenerator: Requesting... ${url}`)
        request(`${url}`, function(error, response, body) {
            if (error) {
                console.log("[USER] Got error: ", error);
            }
        });
        setTimeout(() => doRequest(ctx), 1000);
    }
    
    this.start = function(options) {
        console.log(`[${process.pid}] RequestGenerator will start dispatching requests in 500ms to all InvokerServices.\n`);
        ports.forEach(port => {
            setTimeout(() => {
                console.log(`[${process.pid}] RequestGenerator dispatching requests every second to http://localhost:${port}/getDateAndCountFromAPI`);
                doRequest({port: port});
            }, 500);
        });
    };
};
