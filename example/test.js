const monitor = require('../node-monitor/');
monitor.init({ serverHostname: 'localhost', serverPort: 8080 }, (err) => {

  const http = require('http');
  const fs = require('fs');
  const express = require('express');

  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log('Request Inspector loaded');

  const app = express();
  app.get('/', (req, res) => {
    res.on('finish', () => {});
    const clientRequestEvent = monitor.begin('client-request');
    request(4, () => {;
      monitor.end(clientRequestEvent);
      const fileReadEvent = monitor.begin('file-read');
      fs.readFile('./package.json', (err, data) => {
        monitor.end(fileReadEvent);
        res.send(data);
      });
    });
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'));

  function request(num, cb) {
    const req = http.request('http://nebri.us/static/me.jpg', (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {});
      res.on('end', () => {
        if (cb) {
          setTimeout(cb, 10);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`b-problem with request\t${num}\t${getCallbackPath()}: ${e.message}`);
    });

    // write data to request body
    req.end();
  }
  request(1);
  request(2);
  request(3);

});
