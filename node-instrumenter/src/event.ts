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

import { v4 as uuid } from 'uuid';
import { getCurrentRequestId } from './stack';
import { IMeasurementEvent } from './common/common';
import { storeEvent } from './messaging';

export function isInRequestContext(): boolean {
  return !!getCurrentRequestId();
}

export function begin(name: string, details: { [ key: string ]: any } = {}): IMeasurementEvent {
  if (typeof name !== 'string') {
    throw new Error('"name" must be a string');
  }
  if (!isInRequestContext()) {
    throw new Error(`"begin" called outside of a request context`);
  }
  const requestId = getCurrentRequestId();
  if (!requestId) {
    throw new Error('Internal Error: could not get request ID. ' +
      'This is a bug in Request Inspector, please report it to the author.');
  }
  const newEntry: IMeasurementEvent = {
    id: uuid(),
    requestId,
    name,
    start: Date.now(),
    end: NaN,
    details
  };
  storeEvent(newEntry);
  return newEntry;
}

export function end(event: IMeasurementEvent, details: { [ key: string ]: any } = {}): void {
  if (!isNaN(event.end)) {
    throw new Error(`"end" called twice for ${event.name}`);
  }
  event.end = Date.now();
  event.details = {
    ...event.details,
    ...details
  };
  storeEvent(event);
}
