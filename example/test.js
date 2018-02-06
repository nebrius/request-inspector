const http = require('http');
const fs = require('fs');
const express = require('express');

const inspector = require('../request-inspector-node/');

inspector.init((err) => {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log('Request Inspector loaded');

  const app = express();
  app.get('/', (req, res) => {
    res.on('finish', () => {});
    fs.readFile('./package.json', (err, data) => {
      res.send(data);
    });
  });
  app.listen(3000, () => console.log('Example app listening on port 3000!'));

  function request(num) {
    const req = http.request('http://nebri.us/static/me.jpg', (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {});
      res.on('end', () => {
        setTimeout(() => {});
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
