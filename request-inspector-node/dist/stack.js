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
const uuid_1 = require("uuid");
const relationships = {};
const requests = {};
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
    setImmediate(cb);
}
exports.init = init;
function registerRequest(request) {
    let requestId = request.getHeader('X-Request-Inspector-Request-ID');
    if (!requestId) {
        requestId = uuid_1.v4();
        request.setHeader('X-Request-Inspector-Request-ID', requestId);
    }
    requests[requestId] = getContextPath();
}
exports.registerRequest = registerRequest;
function getRequestId() {
    return;
}
exports.getRequestId = getRequestId;
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
    return findRoot(executionAsyncId);
}
exports.getContextPath = getContextPath;
//# sourceMappingURL=stack.js.map