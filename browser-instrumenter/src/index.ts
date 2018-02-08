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

import { HEADER_NAME } from './common/common';
import { v4 as uuid } from 'uuid';

export interface IOptions {
  serverHostname: string;
  serverPort: number;
  serviceName: string;
}

export function init(options: IOptions): void {

  function begin() {
    console.log('begin');
  }

  function end() {
    console.log('end');
  }

  // Patch fetch
  if (window.fetch) {
    const oldFetch = window.fetch;
    window.fetch = function fetch(input: string | Request, fetchInit?: RequestInit): Promise<Response> {
      const requestId = uuid();
      if (fetchInit) {
        if (fetchInit.headers) {
          if (fetchInit.headers instanceof Headers) {
            fetchInit.headers.set(HEADER_NAME, requestId);
          } else {
            (fetchInit.headers as any)[HEADER_NAME] = requestId;
          }
        } else {
          fetchInit.headers = {
            [HEADER_NAME]: requestId
          };
        }
      } else {
        fetchInit = {
          headers: {
            [HEADER_NAME]: requestId
          }
        };
      }
      begin();
      const req = oldFetch(input, fetchInit);
      req.then((response) => {
        end();
        return response;
      });
      return req;
    };
  }

}

(window as any).requestInspector = {
  init
};
