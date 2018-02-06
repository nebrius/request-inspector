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

import { createHook, executionAsyncId as getExecutionAsyncId } from 'async_hooks';

const relationships: { [ triggerId: number ]: number } = {};
const requests: { [ requestId: string ]: string } = {};

const rootContextPath = getContextPath();

export function init(cb: (err: Error | undefined) => void): void {
  const asyncHook = createHook({
    init: (executionAsyncId, type, triggerAsyncId, resource) => {
      if (relationships.hasOwnProperty(executionAsyncId)) {
        if (relationships[executionAsyncId] !== triggerAsyncId) {
          throw new Error('Inconsistent relationship');
        }
      } else {
        relationships[executionAsyncId] = triggerAsyncId;
      }
    }
  });
  asyncHook.enable();
  setImmediate(cb);
}

export function registerRequestId(requestId: string): void {
  const contextPath = getContextPath();
  if (rootContextPath === contextPath) {
    throw new Error('Attempted to register a request in the root context');
  }
  requests[requestId] = getContextPath();
}

export function getCurrentRequestId(): string | undefined {
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

export function getContextPath(): string {
  const executionAsyncId = getExecutionAsyncId();
  function findRoot(execId: number): number[] {
    if (!relationships.hasOwnProperty(execId)) {
      return [ execId ];
    } else {
      return findRoot(relationships[execId]).concat([ execId ]);
    }
  }
  return findRoot(executionAsyncId).join('/');
}
