const cluster = require('cluster'),
    minimist = require('minimist');

const opts = {
    INVOKER_SERVICES_PORTS: [3010], // 3011],
    EXTERNAL_SERVICES_PORT: 3020,
    STATS_IO_PORT: 3005,
    STATS_WEBUI_PORT: 3000,
    GLOBALAGENT_MAXSOCKETS: 1000,
    VERBOSE_LOGGING: false
};

require('http').globalAgent.maxSockets = opts.GLOBALAGENT_MAXSOCKETS;

if (cluster.isMaster) {
    cluster.fork({
        workerPath: './ext/index',
        port: parseInt(opts.EXTERNAL_SERVICES_PORT),
        verbose: opts.VERBOSE_LOGGING
    }).send('start');

    opts.INVOKER_SERVICES_PORTS.forEach(port => 
        cluster.fork({
            workerPath: './app/index',
            port: parseInt(port),
            externalServicesPort: parseInt(opts.EXTERNAL_SERVICES_PORT),
            verbose: opts.VERBOSE_LOGGING
        }).send('start')
    )

    cluster.fork({
        workerPath: './requestGenerator',
        ports: JSON.stringify(opts.INVOKER_SERVICES_PORTS),
        externalServicePort: parseInt(opts.EXTERNAL_SERVICES_PORT),
        verbose: opts.VERBOSE_LOGGING
    }).send('start');

} else {
    require(process.env.workerPath).start(process.env);
}
