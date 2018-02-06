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

import * as express from 'express';
import { json } from 'body-parser';
import { IMeasurementEvent } from './common/common';

const DEFAULT_PORT = 7176;

export interface IOptions {
  port?: number;
}

const events: IMeasurementEvent[] = [];

export function start({ port = DEFAULT_PORT }: IOptions, cb: () => void): express.Express {

  const app = express();
  app.use(json());

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.get('/api/events', (req, res) => {
    res.send(events);
  });

  app.post('/api/events', (req, res) => {
    const event: IMeasurementEvent = req.body;
    console.log(`Receive event ${event.id}`);
    for (let i = 0; i < events.length; i++) {
      if (event.id === events[i].id) {
        events[i] = event;
        res.send('OK');
        return;
      }
    }
    events.push(req.body);
    res.send('OK');
  });

  app.listen(port, cb);

  return app;
}
