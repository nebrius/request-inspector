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
const http_1 = require("http");
let hostname;
let port;
function setServerConnection(newHostname, newPort) {
    hostname = newHostname;
    port = newPort;
}
exports.setServerConnection = setServerConnection;
function storeEvent(event) {
    if (!hostname || !port) {
        throw new Error('Cannot store event before the server hostname and port are set');
    }
    const data = JSON.stringify(event);
    const req = http_1.request({
        protocol: 'http:',
        hostname,
        port,
        path: `/api/events`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    }, (res) => {
        if (!res.statusCode) {
            console.warn('Request Inspector: received no status code from the Request Inspector server');
        }
        else if (res.statusCode >= 400) {
            console.warn(`Request Inspector: Request Inspector server returned ${res.statusCode}`);
        }
    }, 'is_request_inspector_call');
    req.on('error', (err) => {
        console.warn(`Request Inspector: error saving event to the server: ${err}`);
    });
    req.write(data);
    req.end();
}
exports.storeEvent = storeEvent;
//# sourceMappingURL=messaging.js.map