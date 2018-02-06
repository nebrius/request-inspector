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
const uuid_1 = require("uuid");
const stack_1 = require("./stack");
function begin(name) {
    if (typeof name !== 'string') {
        throw new Error('"name" must be a string');
    }
    const requestId = stack_1.getRequestId();
    if (!requestId) {
        throw new Error(`Could not find request ID`);
    }
    const contextPath = stack_1.getContextPath();
    console.log(contextPath);
    // Do a thing with contextPath?
    const newEntry = {
        id: uuid_1.v4(),
        name,
        start: Date.now(),
        end: NaN,
        requestId
    };
    // Do a thing with this entry
    return newEntry;
}
exports.begin = begin;
function end(event) {
    if (!isNaN(event.end)) {
        throw new Error(`"end" called twice for ${event.name}`);
    }
    event.end = Date.now();
}
exports.end = end;
//# sourceMappingURL=event.js.map