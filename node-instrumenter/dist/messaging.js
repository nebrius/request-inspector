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
const request = require("request");
const uuid_1 = require("uuid");
let hostname;
let port;
let serviceId;
let isInitialized = false;
function init(newHostname, newPort, serviceName, cb) {
    hostname = newHostname;
    port = newPort;
    serviceId = uuid_1.v4();
    const service = {
        serviceName,
        serviceId
    };
    request({
        url: `http://${hostname}:${port}/api/register`,
        json: true,
        body: service,
        method: 'POST'
    }, (err, res, body) => {
        if (err) {
            cb(err);
        }
        else if (!res.statusCode) {
            cb(new Error('Request Inspector: could not register with the Request Inspector server'));
        }
        else if (res.statusCode >= 400) {
            cb(new Error(`Request Inspector: Request Inspector server returned ${res.statusCode} while trying to register`));
        }
        else {
            isInitialized = true;
            cb(undefined);
        }
    });
}
exports.init = init;
function getServiceId() {
    return serviceId;
}
exports.getServiceId = getServiceId;
function storeEvent(event) {
    if (!isInitialized) {
        throw new Error('Cannot call "storeEvent" until the event system is initialized');
    }
    request({
        url: `http://${hostname}:${port}/api/events`,
        json: true,
        body: event,
        method: 'POST'
    }, (err, res, body) => {
        if (err) {
            console.warn(`Request Inspector: error saving event to the server: ${err}`);
        }
        else if (!res.statusCode) {
            console.warn('Request Inspector: received no status code from the Request Inspector server');
        }
        else if (res.statusCode >= 400) {
            console.warn(`Request Inspector: Request Inspector server returned ${res.statusCode} while trying to save event`);
        }
    });
}
exports.storeEvent = storeEvent;
//# sourceMappingURL=messaging.js.map