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
const DEFAULT_PORT = 7176;
const requests = [];
function start({ port = DEFAULT_PORT }, cb) {
    const template = handlebars_1.compile(fs_1.readFileSync(path_1.join(__dirname, '..', 'templates', 'index.handlebars'), 'utf-8'));
    const app = express();
    app.use(body_parser_1.json());
    app.get('/', (req, res) => {
        res.send(template({ requests }));
    });
    app.get('/api/requests', (req, res) => {
        res.send(requests);
    });
    app.post('/api/events', (req, res) => {
        const event = req.body;
        console.log(`Received event ${event.name} (${event.id}) for request ${event.requestId}`);
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
                events: []
            };
            requests.push(requestEntry);
        }
        let existingEventUpdated = false;
        for (let i = 0; i < requestEntry.events.length; i++) {
            if (requestEntry.events[i].id === event.id) {
                requestEntry.events[i] = event;
                existingEventUpdated = true;
                break;
            }
        }
        if (!existingEventUpdated) {
            requestEntry.events.push(event);
        }
        res.send('OK');
    });
    app.listen(port, cb);
    return app;
}
exports.start = start;
//# sourceMappingURL=index.js.map