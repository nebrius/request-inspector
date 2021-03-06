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

export interface IMeasurementEvent {
  eventId: string;
  requestId: string;
  serviceId: string;
  type: string;
  start: number;
  end: number;
  details: { [ key: string ]: any };
}

export interface IService {
  serviceId: string;
  serviceName: string;
}

export const EVENT_NAMES = {
  NODE_HTTP_SERVER_REQUEST: 'builtin:node:server-request',
  BROWSER_HTTP_XHR_REQUEST: 'builtin:browser:xhr-request',
  BROWSER_HTTP_FETCH_REQUEST: 'builtin:browser:fetch-request'
};

export const HEADER_NAME = 'x-request-inspector-request-ID';
