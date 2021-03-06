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

import { init as stackInit } from './stack';
import { init as messagingInit } from './messaging';
import { init as eventInit } from './event';
import { parallel } from 'async';

export { IMeasurementEvent } from './common/common';
export { isInRequestContext, begin, end } from './event';

export interface IOptions {
  serverHostname: string;
  serverPort: number;
  serviceName: string;
}

export type Callback = (err: Error | undefined) => void;

export function init(options: IOptions, cb?: Callback): void {
  if (!cb) {
    cb = () => {
      // DO Nothing
    };
  }
  if (typeof options !== 'object') {
    throw new Error('"options" must be an object');
  }
  const { serverHostname, serverPort, serviceName } = options;
  if (typeof serverHostname !== 'string') {
    throw new Error('"serverHostname" option must be a string');
  }
  if (typeof serverPort !== 'number') {
    throw new Error('"serverPort" option must be a number');
  }
  if (typeof serviceName !== 'string') {
    throw new Error('"serviceName" option must be a string');
  }

  parallel([
    (next) => stackInit(next),
    (next) => messagingInit(serverHostname, serverPort, serviceName, next),
    (next) => eventInit(next)
  ], cb);
}
