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

import { createHook, executionAsyncId as getExecutionAsyncId } from 'async_hooks';
import { begin, end } from './event';
import { EVENT_NAMES, HEADER_NAME } from './common/common';
import { v4 as uuid } from 'uuid';

import http = require('http');
import https = require('https');

type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

const relationships: { [ triggerId: number ]: number } = {};
const requests: { [ requestId: string ]: string } = {};

const rootContextPath = getContextPath();

export function init(cb: (err: Error | undefined) => void): void {
  const asyncHook = createHook({
    init: (executionAsyncId, type, triggerAsyncId, resource) => {
      if (relationships.hasOwnProperty(executionAsyncId)) {
        if (relationships[executionAsyncId] !== triggerAsyncId) {
          throw new Error('Inconsistent relationship');
        }
      } else {
        relationships[executionAsyncId] = triggerAsyncId;
      }
    }
  });
  asyncHook.enable();

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

export function registerRequestId(requestId: string): void {
  const contextPath = getContextPath();
  if (rootContextPath === contextPath) {
    throw new Error('Attempted to register a request in the root context');
  }
  requests[requestId] = getContextPath();
}

export function getCurrentRequestId(): string | undefined {
  const contextPath = getContextPath();
  console.log(contextPath);
  for (const requestId in requests) {
    if (!requests.hasOwnProperty(requestId)) {
      continue;
    }
    if (contextPath.startsWith(requests[requestId])) {
      console.log(requests[requestId]);
      return requestId;
    }
  }
  return;
}

export function getContextPath(): string {
  const executionAsyncId = getExecutionAsyncId();
  function findRoot(execId: number): number[] {
    if (!relationships.hasOwnProperty(execId)) {
      return [ execId ];
    } else {
      return findRoot(relationships[execId]).concat([ execId ]);
    }
  }
  return findRoot(executionAsyncId).join('/');
}
