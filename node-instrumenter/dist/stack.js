"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const async_hooks_1 = require("async_hooks");
const event_1 = require("./event");
const common_1 = require("./common/common");
const uuid_1 = require("uuid");
const http = require("http");
const https = require("https");
const relationships = {};
const requests = {};
let isInitialized = false;
let rootContextPath;
function init(cb) {
    const asyncHook = async_hooks_1.createHook({
        init: (executionAsyncId, type, triggerAsyncId, resource) => {
            if (relationships.hasOwnProperty(executionAsyncId)) {
                if (relationships[executionAsyncId] !== triggerAsyncId) {
                    throw new Error('Inconsistent relationship');
                }
            }
            else {
                relationships[executionAsyncId] = triggerAsyncId;
            }
        }
    });
    asyncHook.enable();
    function requestHandler(req, res) {
        let requestId = uuid_1.v4();
        for (const headerName in req.headers) {
            if (!req.headers.hasOwnProperty(headerName)) {
                continue;
            }
            if (headerName.toLowerCase() === common_1.HEADER_NAME.toLowerCase()) {
                requestId = req.headers[headerName];
                break;
            }
        }
        // TODO: need to associate this request as the root request if there's not already one, tie event id to request id
        registerRequestId(requestId);
        const measurementEvent = event_1.begin(common_1.EVENT_NAMES.NODE_HTTP_SERVER_REQUEST, {
            url: req.url,
            method: req.method,
            headers: Object.assign({}, req.headers)
        });
        res.on('finish', () => event_1.end(measurementEvent, {
            statusCode: res.statusCode,
            headers: Object.assign({}, res.getHeaders())
        }));
    }
    const oldHttpCreateServer = http.createServer;
    http.createServer = function createServer(handler) {
        const server = oldHttpCreateServer.call(this);
        server.on('request', requestHandler);
        if (handler) {
            server.on('request', handler);
        }
        return server;
    };
    const oldHttpsCreateServer = https.createServer;
    https.createServer = function createServer(options, handler) {
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
        const req = oldHttpRequest.call(this, options, responseListener);
        const requestId = getCurrentRequestId();
        if (requestId) {
            req.setHeader(common_1.HEADER_NAME, requestId);
        }
        return req;
    };
    const oldHttpsRequest = http.request;
    https.request = function request(options, responseListener) {
        const req = oldHttpsRequest.call(this, options, responseListener);
        const requestId = getCurrentRequestId();
        if (requestId) {
            req.setHeader(common_1.HEADER_NAME, requestId);
        }
        return req;
    };
    isInitialized = true;
    rootContextPath = getContextPath();
    setImmediate(cb);
}
exports.init = init;
function registerRequestId(requestId) {
    if (!isInitialized) {
        throw new Error('Cannot call "registerRequestId" until the event system is initialized');
    }
    const contextPath = getContextPath();
    if (rootContextPath === contextPath) {
        throw new Error('Attempted to register a request in the root context');
    }
    requests[requestId] = getContextPath();
}
exports.registerRequestId = registerRequestId;
function getCurrentRequestId() {
    if (!isInitialized) {
        throw new Error('Cannot call "getCurrentRequestId" until the event system is initialized');
    }
    const contextPath = getContextPath();
    for (const requestId in requests) {
        if (!requests.hasOwnProperty(requestId)) {
            continue;
        }
        if (contextPath.startsWith(requests[requestId])) {
            return requestId;
        }
    }
    return;
}
exports.getCurrentRequestId = getCurrentRequestId;
function getContextPath() {
    if (!isInitialized) {
        throw new Error('Cannot call "getContextPath" until the event system is initialized');
    }
    const executionAsyncId = async_hooks_1.executionAsyncId();
    function findRoot(execId) {
        if (!relationships.hasOwnProperty(execId)) {
            return [execId];
        }
        else {
            return findRoot(relationships[execId]).concat([execId]);
        }
    }
    return findRoot(executionAsyncId).join('/');
}
exports.getContextPath = getContextPath;
//# sourceMappingURL=stack.js.map