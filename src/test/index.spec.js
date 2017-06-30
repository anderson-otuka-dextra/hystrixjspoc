const cluster = require('cluster'),
    minimist = require('minimist'),
    fork = require('child_process').fork;

let server;

function exitHandler(options, err) {
    console.log(`[TEST] Stopping ServersLauncher`);
    server.kill();
    process.exit();
}

describe('Tests', () => {
    before(runTest => {
        console.log('[TEST] Starting ServersLauncher')
        server = fork('src/index.js');
        process.stdin.resume(); // avoid program closing instantly
        process.on('exit', exitHandler.bind() ); // normal exit
        process.on('SIGINT', exitHandler.bind() ); // catches ctrl+c event
        process.on('uncaughtException', exitHandler.bind() ); // catches uncaught exceptions
        setTimeout(runTest, 1000);
    })

    it('test', done => {
        setTimeout(() => {
            done();
        }, 1500);
    })
})
