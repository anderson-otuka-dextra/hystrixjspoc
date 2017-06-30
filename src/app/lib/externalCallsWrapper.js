const http = require('request-promise-json'),
    CommandsFactory = require("hystrixjs/lib/command/CommandFactory")
    
const defaultHystrixConfig = {
    timeout: 2500,
    resetTime: 5000,
    concurrency: 10,
    errorThreshold: 5,
    windowLength: 10000,
    windowNumberOfBuckets: 10,
    defaultErrorHandler: (error) => error ?
        error.statusCode == 503 ?
            (() => {
                var unavailableError = new Error();
                unavailableError.name = "ServiceUnavailableError";
                return unavailableError;
            })()
            : error
        : null
}

module.exports = {
    getInstance: (extPort) => ({
        get: (id) =>
            requestPromise('/get',
                'GET', `http://localhost:${extPort}/get/${id}`)
        ,
        load: (id) =>
            requestPromise('/load',
                'GET', `http://localhost:${extPort}/load/${id}`)
        ,
        update: (id, value) =>
            requestPromise('/update',
                'POST', `http://localhost:${extPort}/update/${id}/${value}`)
    })
}

function getDefaultCommandBuilder (commandName, hystrixConfig = defaultHystrixConfig) {
    return CommandsFactory
        .getOrCreate(commandName)
        .circuitBreakerErrorThresholdPercentage(hystrixConfig.errorThreshold)
        .timeout(hystrixConfig.timeout)
        .circuitBreakerRequestVolumeThreshold(hystrixConfig.concurrency)
        .circuitBreakerSleepWindowInMilliseconds(hystrixConfig.resetTime)
        .statisticalWindowLength(hystrixConfig.windowLength)
        .statisticalWindowNumberOfBuckets(hystrixConfig.windowNumberOfBuckets)
        .errorHandler(hystrixConfig.defaultErrorHandler);
}

function getHttpRequestCommand (commandName, hystrixConfig) {
    return getDefaultCommandBuilder(commandName, hystrixConfig)
        .run(options => http.request(Object.assign(options)) )
}

function requestPromise (commandName, method, url, hystrixConfig) {
    return getHttpRequestCommand(commandName, hystrixConfig).build()
        .execute({ method: method, url: url })
        .then(r => ({ source: url, value: r.value }) )
}