const hystrixStream = require('hystrixjs/lib/http/HystrixSSEStream');

module.exports = (request, response) => {
    response.append('Content-Type', 'text/event-stream;charset=UTF-8');
    response.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    response.append('Pragma', 'no-cache');
    const onNext = (sseData) => response.write(`data: ${sseData}\n\n`);
    const onError = (error) => console.log(error);
    const onComplete = () => response.end();
    return hystrixStream.toObservable().subscribe(onNext, onError, onComplete);
};