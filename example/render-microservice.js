/*
MIT License

Copyright (c) 2018 Bryan Hughes <bryan@nebri.us>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const monitor = require('../node-instrumenter/');
monitor.init({ serverHostname: 'localhost', serverPort: 8080, serviceName: 'renderer' }, (err) => {

  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log('Request Inspector loaded');

  const http = require('http');
  const fs = require('fs');
  const express = require('express');

  const app = express();

  app.get('/', (req, res) => {
    const clientRequestEvent = monitor.begin('client-request');

    const req = http.request('http://nebri.us/static/me.jpg', (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {});
      res.on('end', () => {
        monitor.end(clientRequestEvent);
        const fileReadEvent = monitor.begin('file-read');
        fs.readFile('./package.json', (err, data) => {
          monitor.end(fileReadEvent);
          res.send(data);
        });
      });
    });

    req.on('error', (e) => {
      console.error(`b-problem with request\t${num}\t${getCallbackPath()}: ${e.message}`);
    });

    // write data to request body
    req.end();
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'));

});
