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
const continuation_local_storage_1 = require("continuation-local-storage");
const event_1 = require("./event");
const common_1 = require("./common/common");
const uuid_1 = require("uuid");
const http = require("http");
const https = require("https");
const requestNamespace = continuation_local_storage_1.createNamespace('request');
function init(cb) {
    function wrapListener(listener) {
        function wrappedListener(req, res) {
            requestNamespace.run(() => {
                requestNamespace.bindEmitter(req);
                requestNamespace.bindEmitter(res);
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
                requestNamespace.set('requestId', requestId);
                listener.apply(this, arguments);
            });
        }
        return wrappedListener;
    }
    function patchRequestHandler(server, defaultHandler) {
        const oldOn = server.on;
        server.on = function on(eventName, listener) {
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
    function requestHandler(req, res) {
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
        patchRequestHandler(server, handler);
        return server;
    };
    const oldHttpsCreateServer = https.createServer;
    https.createServer = function createServer(options, handler) {
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
    setImmediate(cb);
}
exports.init = init;
function getCurrentRequestId() {
    return requestNamespace.get('requestId');
}
exports.getCurrentRequestId = getCurrentRequestId;
//# sourceMappingURL=stack.js.map