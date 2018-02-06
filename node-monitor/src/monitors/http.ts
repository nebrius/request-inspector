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

import { registerRequestId, getCurrentRequestId } from '../stack';
import { begin, end } from '../event';
import { EVENT_NAMES, HEADER_NAME } from '../common/common';
import { v4 as uuid } from 'uuid';

import http = require('http');
import https = require('https');

type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

export function init(cb: (err: Error | undefined) => void): void {

  function requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const requestId = req.headers[HEADER_NAME] as string || uuid();
    registerRequestId(requestId);
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
    server.on('request', requestHandler);
    if (handler) {
      server.on('request', handler);
    }
    return server;
  };

  const oldHttpsCreateServer = https.createServer;
  https.createServer = function createServer(options?: https.ServerOptions, handler?: RequestHandler): https.Server {
    if (typeof options === 'function') {
      handler = options;
      options = undefined;
    }
    const server = oldHttpsCreateServer.call(this, options);
    server.on('request', requestHandler);
    if (handler) {
      server.on('request', handler);
    }
    return server;
  };

  function patchRequest(module: any, protocol: string): void {
    const oldRequest = http.request;
    http.request = function request(...args: any[]): http.ClientRequest {
      const req: http.ClientRequest = oldRequest.apply(this, args);
      if (args.length === 3 && args[2] === 'is_request_inspector_call') {
        return req;
      }
      const requestId = getCurrentRequestId();
      if (!requestId) {
        return req;
      }
      req.setHeader(HEADER_NAME, requestId);
      const measurementEvent = begin(EVENT_NAMES.NODE_HTTP_CLIENT_REQUEST);
      const options: http.ClientRequestArgs | string = args[0];
      let url: string;
      let method: string;
      if (typeof options === 'string') {
        method = 'GET';
        url = options;
      } else {
        method = options.method || 'GET';
        if (options.host) {
          url = `${protocol}//${options.host}`;
        } else if (options.hostname) {
          url = `${protocol}//${options.hostname}`;
          if (options.port) {
            url += `:${options.port}`;
          }
        } else {
          url = `${protocol}//localhost`;
        }
      }
      req.on('finish', () => end(measurementEvent, {
        url,
        method,
        headers: { ...req.getHeaders() }
      }));
      return req;
    };
  }
  patchRequest(http, 'http:');
  patchRequest(https, 'https:');

  setImmediate(cb);
}
