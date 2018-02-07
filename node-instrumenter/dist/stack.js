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
const rootContextPath = getContextPath();
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
        const requestId = req.headers[common_1.HEADER_NAME] || uuid_1.v4();
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
    setImmediate(cb);
}
exports.init = init;
function registerRequestId(requestId) {
    const contextPath = getContextPath();
    if (rootContextPath === contextPath) {
        throw new Error('Attempted to register a request in the root context');
    }
    requests[requestId] = getContextPath();
}
exports.registerRequestId = registerRequestId;
function getCurrentRequestId() {
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
exports.getCurrentRequestId = getCurrentRequestId;
function getContextPath() {
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