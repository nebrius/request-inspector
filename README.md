# Request Inspector

Request Inspector is an HTTP(S) request diagnostic tool for Node.js servers.

When a web or mobile client makes an HTTP call to a backend, it can be tricky
to find out why that particular request took X amount of time. This is especially
true in the days of microservices, where servers make calls to servers which make
calls to other servers. How does one correlate timing information across all of
these microservices? Enter Request Inspector.

Request inspector works by adding a header to all HTTP requests that is then used
to track the request through multiple systems. Request inspector also uses the new
Async Hooks API in Node.js to track that request through asynchronous calls locally.
This data is then sent to a special Request Inspector server which aggregates and
correlates all of this data.

Here is a screenshot showing the timeline working across three separate servers:

![UI Screenshot](https://user-images.githubusercontent.com/1141386/35941185-488be068-0c06-11e8-9d6e-a65c480a2ddf.png)

Be sure to [check out the example](./example).

## Installation

Request Inspector is currently split into two packages: a Node.js instrumenter
and the server. The instrumenter runs inside of your Node.js server, which collects
data and sends it to the server.

Start by installing the server globally:

```bash
npm install -g @request-inspector/server
```

Then install the instrumenter in your project:

```bash
npm install @request-inspector/node-instrumenter
```

**Warning:** the `@request-inspector/node-instrumenter` package _requires_ Node.js
8.1.0 or newer to function, because older versions of Node.js don't support [async_hooks](https://nodejs.org/api/async_hooks.html).

## Usage

To instrument your code in Node.js, require/import the module and initialize it:

```JavaScript
const instrumenter = require('@request-inspector/node-instrumenter');
instrumenter.init({
  serverHostname: 'localhost',
  serverPort: 7176,
  serviceName: 'template'
}, (initErr) => {

  // Your app code here

});
```

Then, start the server:

```bash
request-inspector [-p PORT]
```

Note: it is recommended that you run this initialization code _before_ you require/import
any other code.

This code will _automatically_ instrument all inbound HTTP requests for you. You can also
add more data points to get a more fine-grained look at what your application is doing:

```JavaScript
const templateReadEvent = instrumenter.begin('file-read');
fs.readFile('./my-file', (err, data) => {
  instrumenter.end(templateReadEvent);
});
```

Each begin and end call is automatically correlated with an HTTP request that Node.js
received. Note that you _cannot_ `begin` an event that is not associated with an HTTP
request. You can use the `instrumenter.isInRequestContext()` check to see if you are
in a request context or not.

You can also add extra data associated with your event:

```JavaScript
const templateReadEvent = instrumenter.begin('file-read', {
  filename: './my-file'
});
fs.readFile('./my-file', (err, data) => {
  instrumenter.end(templateReadEvent, {
    error: err && err.toString()
  });
});
```

This information can be in any format that can be passed to `JSON.stringify`, and it
is sent to the server and shown in the UI.

To view the results, point your browser to the request-inspector server URL that you
entered in the `init` method above, e.g. `http://localhost:7176/`.

# License

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
