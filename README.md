# HystrixJS POC

## Run with
```
npm install
npm start
```

## Run LOG mode with
```
npm start -- -L
```

## Example output
```
$ npm start

> otuka-hystrixjs-poc@0.1.0 start /home/otuka/dextra/nextel/git/otuka-hystrixjs-poc
> node src/index.js

Run with "npm start -- -L" to enable LOG mode

[20642] ExternalServices listening on 3002. Available endpoints:
- http://localhost:3002/date
- http://localhost:3002/count

[20649] RequestGenerator will start dispatching requests in 500ms
[20648] InvokerServices listening on 3001. Available endpoints:
- http://localhost:3001/getDateFromAPI
- http://localhost:3001/getCountFromAPI
- http://localhost:3001/getDateAndCountFromAPI
- http://localhost:3001/api/hystrix.stream

You can plug hystrix-dashboard on http://localhost:3001/api/hystrix.stream
See: https://github.com/Netflix/Hystrix/tree/master/hystrix-dashboard

[20649] RequestGenerator: Started dispatching requests.
```