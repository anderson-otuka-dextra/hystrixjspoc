module.exports = {
    start: (cfg) => {
        var reqGen = new RequestGenerator(cfg.port, JSON.parse(cfg.verbose));
        process.on('message', function(msg) {
            if (msg == 'start') {
                reqGen.start();
            }
        });
    }
};

const request = require('request');

function RequestGenerator (port, verbose) {
    function doRequest(ctx) {
        if (!ctx) {
            ctx = {'nRequest': 0};
        }
        let url = `http://localhost:${port}/getDateAndCountFromAPI`;
        if (verbose) console.log(`[${process.pid}] RequestGenerator: Requesting... ${url}`)
        request(`${url}`, function(error, response, body) {
            if (error) {
                console.log("[USER] Got error: ", error);
            }
        });
        ctx = {'nRequest': ctx.nRequest + 1};
        setTimeout(() => doRequest(ctx), 1000);
    }
    
    this.start = function(options) {
        console.log("[%d] RequestGenerator will start dispatching requests in 500ms", process.pid);
        setTimeout(() => {
            console.log("[%d] RequestGenerator: Started dispatching requests.", process.pid);
            doRequest();
        }, 500);
    };
};
