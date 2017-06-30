const cluster = require('cluster'),
    minimist = require('minimist');

const opts = {
    INVOKER_SERVICES_PORTS: [3010], // 3011],
    EXTERNAL_SERVICES_PORT: 3020,
    STATS_IO_PORT: 3005,
    STATS_WEBUI_PORT: 3000,
    GLOBALAGENT_MAXSOCKETS: 1000
};

const STATS_SERVER = {
    webPort: opts.STATS_WEBUI_PORT,
    ioPort: opts.STATS_S2S_PORT
};

var argv = minimist(process.argv.slice(2));

const verbose = (argv.L || argv.l) ? true : false;

if (cluster.isMaster) {
    if (verbose) {
        console.log('"-L" LOG mode on.\n')
    } else {
        console.log('Run with "npm start -- -L" to enable LOG mode.\n')
    }
    console.log('You can plug the Hystrix Dashboard on all hystrix.streams once they\'re up.')
    console.log('More information: [https://github.com/Netflix/Hystrix/tree/master/hystrix-dashboard]\n')
}

for (var capsK in opts) {
    var k = capsK.toLowerCase().replace(/_/g, '-');
    if (!(k in argv)) {
        continue;
    }
    var num = parseInt(argv[k]);
    if (isNaN(num)) {
        console.log("Option --%s should be a number! (%s given)", k, argv[k]);
        process.exit(1);
    }
    opts[capsK] = num;
}

require('http').globalAgent.maxSockets = opts.GLOBALAGENT_MAXSOCKETS;

if (cluster.isMaster) {
    cluster.fork({
        workerName: 'ext',
        port: parseInt(opts.EXTERNAL_SERVICES_PORT),
        verbose: verbose
    }).send('start');

    opts.INVOKER_SERVICES_PORTS.forEach(port => 
        cluster.fork({
            workerName: 'app',
            port: parseInt(port),
            externalServicesPort: parseInt(opts.EXTERNAL_SERVICES_PORT),
            verbose: verbose
        }).send('start')
    )

    cluster.fork({
        workerName: 'requestGenerator',
        ports: JSON.stringify(opts.INVOKER_SERVICES_PORTS),
        externalServicePort: parseInt(opts.EXTERNAL_SERVICES_PORT),
        verbose: verbose
    }).send('start');

} else {
    let worker;
    switch (process.env.workerName) {
        case 'ext': worker = './ext/index'; break
        case 'app': worker = './app/index'; break
        case 'requestGenerator': worker = './requestGenerator'; break
    }
    require(worker).start(process.env);
}
