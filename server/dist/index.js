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
const express = require("express");
const body_parser_1 = require("body-parser");
const handlebars_1 = require("handlebars");
const fs_1 = require("fs");
const path_1 = require("path");
const cors = require("cors");
const requests = [];
const services = {};
function percent(min, value) {
    return Math.max(min, Math.round(100 * value));
}
function start({ port }, cb) {
    const app = express();
    app.use('/static', express.static(path_1.join(__dirname, '..', 'static')));
    app.use(body_parser_1.json());
    app.use(cors());
    app.get('/', (req, res) => {
        const template = handlebars_1.compile(fs_1.readFileSync(path_1.join(__dirname, '..', 'templates', 'index.handlebars'), 'utf-8'));
        res.send(template({
            requests: requests.map((request) => {
                let rootEvent;
                for (const event of request.events) {
                    if (event.eventId === request.requestId) {
                        rootEvent = event;
                        break;
                    }
                }
                if (!rootEvent) {
                    console.warn(`Internal Error: Could not find the root event for request ${request.requestId}`);
                    return;
                }
                const requestDuration = Math.max(0, (rootEvent.end - rootEvent.start));
                const requreDurationValid = typeof rootEvent.start === 'number' &&
                    typeof rootEvent.end === 'number';
                return Object.assign({}, request, { start: (new Date(rootEvent.start)).toString(), duration: requestDuration, durationValid: requreDurationValid, events: request.events.map((event) => {
                        // This isn't necessary, but TypeScript is getting a little confused and things it could be undefined still
                        if (!rootEvent) {
                            console.warn(`Internal Error: Could not find the root event for request ${request.requestId}`);
                            return;
                        }
                        return Object.assign({}, event, { serviceName: services[event.serviceId], duration: event.end - event.start, durationValid: typeof event.end === 'number', left: requreDurationValid ? percent(0, (event.start - rootEvent.start) / requestDuration) : 0, width: requreDurationValid ? percent(1, (event.end - event.start) / requestDuration) : 0 });
                    }) });
            })
        }));
    });
    app.get('/api/requests', (req, res) => {
        res.send({
            services,
            requests
        });
    });
    app.post('/api/register', (req, res) => {
        const service = req.body;
        console.log(`Registering service "${service.serviceName}"`);
        services[service.serviceId] = service.serviceName;
        res.send('ok');
    });
    app.post('/api/events', (req, res) => {
        const event = req.body;
        console.log(`Received event ${event.type}:${event.eventId} from ${event.serviceId} for request ${event.requestId}`);
        let requestEntry;
        for (const request of requests) {
            if (request.requestId === event.requestId) {
                requestEntry = request;
                break;
            }
        }
        if (!requestEntry) {
            requestEntry = {
                requestId: event.requestId,
                url: event.details.url,
                duration: 0,
                events: []
            };
            requests.push(requestEntry);
        }
        let existingEventUpdated = false;
        for (let i = 0; i < requestEntry.events.length; i++) {
            if (requestEntry.events[i].eventId === event.eventId) {
                requestEntry.events[i] = event;
                existingEventUpdated = true;
                break;
            }
        }
        if (!existingEventUpdated) {
            requestEntry.events.push(event);
        }
        requestEntry.events.sort((a, b) => a.start - b.start);
        res.send('OK');
    });
    app.listen(port, cb);
    return app;
}
exports.start = start;
//# sourceMappingURL=index.js.map