# HystrixJS POC

## Setup
Pre-requisites: `git` and `npm` installed on your environment.
```
git clone https://github.com/anderson-otuka-dextra/otuka-hystrixjs-poc.git
npm install
```

## Running
```
npm start
```

## Running with LOG mode enabled
```
npm start -- -L
```

## Example execution output
```console
$ npm start

> otuka-hystrixjs-poc@0.1.0 start /home/otuka/dextra/nextel/git/otuka-hystrixjs-poc
> node src/index.js

Run with "npm start -- -L" to enable LOG mode.

You can plug the Hystrix Dashboard on all hystrix.streams once they're up.
More information: [https://github.com/Netflix/Hystrix/tree/master/hystrix-dashboard]

[6060] ExternalServices listening on port [3020]. Available endpoints:
- http://localhost:3020/date
- http://localhost:3020/count

[6073] RequestGenerator will start dispatching requests in 500ms to all InvokerServices.

[6066] InvokerServices listening on port [3010]. Available endpoints:
- http://localhost:3010/getDateFromAPI
- http://localhost:3010/getCountFromAPI
- http://localhost:3010/getDateAndCountFromAPI
- http://localhost:3010/api/hystrix.stream (Hystrix Dashboard)

[6072] InvokerServices listening on port [3011]. Available endpoints:
- http://localhost:3011/getDateFromAPI
- http://localhost:3011/getCountFromAPI
- http://localhost:3011/getDateAndCountFromAPI
- http://localhost:3011/api/hystrix.stream (Hystrix Dashboard)

[6073] RequestGenerator dispatching requests every second to http://localhost:3010/getDateAndCountFromAPI
[6073] RequestGenerator dispatching requests every second to http://localhost:3011/getDateAndCountFromAPI
```

## Integrating Hystrix Dashboard
One can view Hystrix Dashboard metrics by following the steps described on
<https://github.com/Netflix/Hystrix/tree/master/hystrix-dashboard#run-via-gradle> (Oracle Java SDK 8 required).
```
$ git clone https://github.com/Netflix/Hystrix.git
$ cd Hystrix/hystrix-dashboard
$ ../gradlew appRun
```
Output:
```console
Inferred project: hystrix, version: 1.6.0-SNAPSHOT
...
:hystrix-dashboard:prepareInplaceWebApp UP-TO-DATE
:hystrix-dashboard:appRun
22:00:10 INFO  Jetty 9.2.15.v20160210 started and listening on port 7979
22:00:10 INFO  hystrix-dashboard runs at:
22:00:10 INFO    http://localhost:7979/hystrix-dashboard
Press any key to stop the server.
```
After `Press any key to stop the server` is shown, point your browser to the displayed location (<http://localhost:7979/hystrix-dashboard>) and fill up the form accordingly:

![Image](doc/form.png?raw=true)
Repeat for each endpoint:
1. Type the `hystrix.stream` URL
2. Click on "Add Stream"

Then after both endpoints show up, click on 3. Monitor Streams.

The following dashboard will be shown:

![Image](doc/result.png?raw=true)
