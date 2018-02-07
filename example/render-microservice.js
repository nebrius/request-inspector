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
monitor.init({ serverHostname: 'localhost', serverPort: 8080, serviceName: 'app' }, (initErr) => {

  if (initErr) {
    console.error(initErr);
    process.exit(-1);
  }
  console.log('Request Inspector loaded');

  const http = require('http');
  const express = require('express');
  const bodyParser = require('body-parser');
  const handlebars = require('handlebars');

  const app = express();
  app.use(bodyParser.json());

  app.post('/api/render', (req, res) => {
    const renderEvent = monitor.begin('render');
    const template = handlebars.compile(req.body.template);
    const result = template({ date: req.body.date });
    monitor.end(renderEvent);
    res.send(result);
  });
  app.listen(3002, () => console.log('Example render microservice listening on port 3002!'));

});
