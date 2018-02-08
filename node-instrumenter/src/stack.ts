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

import { createNamespace } from 'continuation-local-storage';
import { EventEmitter } from 'events';
import { begin, end } from './event';
import { EVENT_NAMES, HEADER_NAME } from './common/common';
import { v4 as uuid } from 'uuid';

import http = require('http');
import https = require('https');

type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

const requestNamespace = createNamespace('request');

export function init(cb: (err: Error | undefined) => void): void {

  function wrapListener(listener: any): any {
    function wrappedListener(req: http.IncomingMessage, res: http.ServerResponse) {
      requestNamespace.run(() => {
        requestNamespace.bindEmitter(req);
        requestNamespace.bindEmitter(res);
        let requestId = uuid();
        for (const headerName in req.headers) {
          if (!req.headers.hasOwnProperty(headerName)) {
            continue;
          }
          if (headerName.toLowerCase() === HEADER_NAME.toLowerCase()) {
            requestId = req.headers[headerName] as string;
            break;
          }
        }
        requestNamespace.set('requestId', requestId);
        listener.apply(this, arguments);
      });
    }
    return wrappedListener;
  }

  function patchRequestHandler(server: any, defaultHandler?: RequestHandler): void {
    const oldOn = server.on;
    server.on = function on(eventName: string, listener: any): EventEmitter {
      if (eventName === 'request') {
        listener = wrapListener(listener);
      }
      return oldOn.call(this, eventName, listener);
    };

    server.on('request', requestHandler);
    if (defaultHandler) {
      server.on('request', defaultHandler);
    }
  }

  function requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const measurementEvent = begin(EVENT_NAMES.NODE_HTTP_SERVER_REQUEST, {
      url: req.url,
      method: req.method,
      headers: { ...req.headers }
    });
    res.on('finish', () => end(measurementEvent, {
      statusCode: res.statusCode,
      headers: { ...res.getHeaders() }
    }));
  }

  const oldHttpCreateServer = http.createServer;
  http.createServer = function createServer(handler?: RequestHandler): http.Server {
    const server = oldHttpCreateServer.call(this);
    patchRequestHandler(server, handler);
    return server;
  };

  const oldHttpsCreateServer = https.createServer;
  https.createServer = function createServer(options?: https.ServerOptions, handler?: RequestHandler): https.Server {
    if (typeof options === 'function') {
      handler = options;
      options = undefined;
    }
    const server = oldHttpsCreateServer.call(this, options);
    patchRequestHandler(server, handler);
    return server;
  };

  const oldHttpRequest = http.request;
  http.request = function request(options, responseListener) {
    const req: http.ClientRequest = oldHttpRequest.call(this, options, responseListener);
    const requestId = getCurrentRequestId();
    if (requestId) {
      req.setHeader(HEADER_NAME, requestId);
    }
    return req;
  };

  const oldHttpsRequest = http.request;
  https.request = function request(options, responseListener) {
    const req: http.ClientRequest = oldHttpsRequest.call(this, options, responseListener);
    const requestId = getCurrentRequestId();
    if (requestId) {
      req.setHeader(HEADER_NAME, requestId);
    }
    return req;
  };

  setImmediate(cb);
}

export function getCurrentRequestId(): string | undefined {
  return requestNamespace.get('requestId');
}
