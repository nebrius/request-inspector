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

import { HEADER_NAME, EVENT_NAMES, IMeasurementEvent, IService } from './common/common';
import { v4 as uuid } from 'uuid';

const serviceId = uuid();

export interface IOptions {
  serverHostname: string;
  serverPort: number;
  serviceName: string;
}

let options: IOptions;
let isInitialized = false;
let oldXMLHttpRequest: any;

export function init(newOptions: IOptions, cb?: (err: Error | undefined) => void): void {

  options = newOptions;

  // Patch fetch
  if (window.fetch) {
    const oldFetch = window.fetch;
    window.fetch = function fetch(input: string | Request, fetchInit?: RequestInit): Promise<Response> {
      const requestId = uuid();
      if (fetchInit) {
        if (fetchInit.headers) {
          if (fetchInit.headers instanceof Headers) {
            fetchInit.headers.set(HEADER_NAME, requestId);
          } else {
            (fetchInit.headers as any)[HEADER_NAME] = requestId;
          }
        } else {
          fetchInit.headers = {
            [HEADER_NAME]: requestId
          };
        }
      } else {
        fetchInit = {
          headers: {
            [HEADER_NAME]: requestId
          }
        };
      }
      const fetchEvent = begin(requestId, EVENT_NAMES.BROWSER_HTTP_FETCH_REQUEST, {
        url: typeof input === 'string' ? input : input.url
      });
      const req = oldFetch(input, fetchInit);
      req.then((response) => {
        end(fetchEvent);
        return response;
      });
      return req;
    };
  }

  // Patch XHR
  oldXMLHttpRequest = (window as any).XMLHttpRequest;
  (window as any).XMLHttpRequest = function XMLHttpRequest() {
    const req: XMLHttpRequest = new oldXMLHttpRequest(arguments);
    const requestId = uuid();
    let xhrEvent: IMeasurementEvent;
    req.addEventListener('load', () => {
      end(xhrEvent);
    });
    let method: string;
    let url: string;
    const oldOpen = req.open;
    req.open = function open(newMethod, newUrl) {
      method = newMethod;
      url = newUrl;
      const result = oldOpen.apply(this, arguments);
      req.setRequestHeader(HEADER_NAME, requestId);
      return result;
    };
    const oldSend = req.send;
    req.send = function send() {
      xhrEvent = begin(requestId, EVENT_NAMES.BROWSER_HTTP_XHR_REQUEST, {
        url,
        method
      });
      return oldSend.apply(this, arguments);
    };
    return req;
  };

  // Register with the server
  const service: IService = {
    serviceId,
    serviceName: 'client'
  };
  const registerReq = new oldXMLHttpRequest();
  registerReq.open('POST', `http://${options.serverHostname}:${options.serverPort}/api/register`);
  registerReq.addEventListener('load', () => {
    isInitialized = true;
    if (cb) {
      cb(undefined);
    }
  });
  registerReq.addEventListener('error', (e: ErrorEvent) => cb && cb(e.error));
  registerReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  registerReq.send(JSON.stringify(service));
}

function sendEvent(event: IMeasurementEvent): void {
  const req = new oldXMLHttpRequest();
  req.open('POST', `http://${options.serverHostname}:${options.serverPort}/api/events`);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(JSON.stringify(event));
}

export function begin(requestId: string, type: string, details: { [ key: string ]: any } = {}): IMeasurementEvent {
  if (!isInitialized) {
    throw new Error('"begin" was called before Request Inspector was finished initializing');
  }
  if (typeof type !== 'string') {
    throw new Error('"name" must be a string');
  }
  if (!requestId) {
    throw new Error('Internal Error: could not get request ID. ' +
      'This is a bug in Request Inspector, please report it to the author.');
  }
  const newEntry: IMeasurementEvent = {
    eventId: requestId,
    serviceId,
    requestId,
    type,
    start: Date.now(),
    end: NaN,
    details
  };
  sendEvent(newEntry);
  return newEntry;
}

export function end(event: IMeasurementEvent, details: { [ key: string ]: any } = {}): void {
  if (!isInitialized) {
    throw new Error('"begin" was called before Request Inspector was finished initializing');
  }
  if (!isNaN(event.end)) {
    throw new Error(`"end" called twice for ${event.type}:${event.eventId}`);
  }
  event.end = Date.now();
  event.details = {
    ...event.details,
    ...details
  };
  sendEvent(event);
}

(window as any).requestInspector = {
  init,
  begin,
  end
};
