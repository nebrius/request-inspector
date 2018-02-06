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
const http = require("http");
function init(cb) {
    const oldCreateServer = http.createServer;
    http.createServer = function createServer(...args) {
        const server = oldCreateServer.apply(this, args);
        server.on('request', (req, res) => {
            stack_1.registerRequest(req);
            const measurementEvent = event_1.begin(common_1.EVENT_NAMES.HTTP_SERVER_REQUEST);
            res.on('finish', () => event_1.end(measurementEvent));
        });
        return server;
    };
    // const oldRequest = http.request;
    // TODO: create and set HTTP header
    setImmediate(cb);
}
exports.init = init;
//# sourceMappingURL=http.js.map