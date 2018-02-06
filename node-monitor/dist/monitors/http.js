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
const stack_1 = require("../stack");
const event_1 = require("../event");
const common_1 = require("../common/common");
const uuid_1 = require("uuid");
const http = require("http");
const https = require("https");
function init(cb) {
    function requestHandler(req, res) {
        const requestId = req.headers[common_1.HEADER_NAME] || uuid_1.v4();
        stack_1.registerRequestId(requestId);
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
    function patchRequest(module, protocol) {
        const oldRequest = http.request;
        http.request = function request(...args) {
            const req = oldRequest.apply(this, args);
            if (args.length === 3 && args[2] === 'is_request_inspector_call') {
                return req;
            }
            const requestId = stack_1.getCurrentRequestId();
            if (!requestId) {
                return req;
            }
            req.setHeader(common_1.HEADER_NAME, requestId);
            const measurementEvent = event_1.begin(common_1.EVENT_NAMES.NODE_HTTP_CLIENT_REQUEST);
            const options = args[0];
            let url;
            let method;
            if (typeof options === 'string') {
                method = 'GET';
                url = options;
            }
            else {
                method = options.method || 'GET';
                if (options.host) {
                    url = `${protocol}//${options.host}`;
                }
                else if (options.hostname) {
                    url = `${protocol}//${options.hostname}`;
                    if (options.port) {
                        url += `:${options.port}`;
                    }
                }
                else {
                    url = `${protocol}//localhost`;
                }
            }
            req.on('finish', () => event_1.end(measurementEvent, {
                url,
                method,
                headers: Object.assign({}, req.getHeaders())
            }));
            return req;
        };
    }
    patchRequest(http, 'http:');
    patchRequest(https, 'https:');
    setImmediate(cb);
}
exports.init = init;
//# sourceMappingURL=http.js.map