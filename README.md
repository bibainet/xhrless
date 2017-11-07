# XHRLESS: write less, do more with XMLHttpRequest API. #

It is an abstraction layer over the **XMLHttpRequest** v2 API for browser/Node.JS environments.  

*@version*    1.0.5 2017.11.08  
*@license*    MIT  
*@copyright*  Copyright © 2017 Alexander Bibanin https://github.com/bibainet  


## Installation ##

On the client side (browser) just include the **xhrless.js** script. The constructor function is now available under the name `XHR`.  

In order to use it on the server side (Node.JS), install package **xhrless** using npm: `npm install xhrless`.  

You can manually add a dependency to the package.json file:  

```json
"dependencies": {
  "xhrless": "^1.0.0"
}
```

and run `npm install`. Now you can import and use it:  

```javascript
const XHR = require('xhrless');
```


## Usage examples ##

The only exported name is `XHR`, the constructor function. It returns the `XHR` instance.  
It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.  
Mostly all of the methods of XHR prototype returns the reference to `XHR` (`this`), so the method calls can easily be chained:  
`xhr = XHR(...).setHeader(...).responseType(...).onSuccess(...).send();`.  

*@example*  
```javascript
XHR(url).setHeader('X-Test', 'OK').setTimeout(5e3).onTimeout(function(xhr) {
  alert('Request timed out');
}).onReady(function(xhr) {
  // Request completed, regardless of errors
  if (this.isSuccessResponse()) // Check errors
    console.log('OK:', this.responseText());
  else
    console.warn('Failed:', this.url, this.errorState(true));
}).send(new FormData(document.querySelector('form')));

XHR(url, new FormData(form), 'POST').setData('reqTime', new Date()).onSuccess(xhr => {
  // Request completed successfully
  console.log('OK:', xhr.response());
}, xhr => {
  // Something failed
  console.warn('Failed:', xhr.url, xhr.errorState(true));
}, xhr => {
  // Finally:
  submitButton.disabled = false;
  console.log((new Date()) - xhr.data.reqTime, 'msec');
}).send();
```

### Fetch JSON ###

Call `.responseType('json')` on `XHR` instance before sending request.  
When completed, call `.response()` to get the decoded response object.  

*@example*  
```javascript
XHR(url_json).responseType('json').onSuccess(function success(xhr) {
  console.log('OK:', typeof this.response(), this.response());
}, function error(xhr) {
  console.warn('Failed:', this.url, this.errorState(true));
}).send();
```

### Using promises ###

Call `.promise()` instead of `.send()` to send the request and get the `Promise` object.  
It will be resolved when request succeeded. It will be rejected for error responses.  

*@example*  
```javascript
XHR(url).promise()
  .then(  xhr => console.log('OK:', xhr.responseText()) )
  .catch( xhr => console.warn('Failed:', xhr.url, xhr.errorState(true)) );
```

### XHR instances are reusable ###

The `XHR` instance, once created, can be reused several times.  

*@example*  
```javascript
// Create and configure the XHR instance
const req = XHR().onReady(handler).setTimeout(5e3).setHeader('X-Test', 'OK');
// Set/reset target URL, send POST
req.reset(url).send(body1);
// Send another POST
req.send(body2);
```

### Methods that works in browser only ###

Call `.loadInto()` to quickly load the response text into the DOM element.  

*@example*  
```javascript
XHR(url).loadInto(document.querySelector('#target'), true, 'Request failed');
XHR(url).loadInto('#target', 'Loading...', xhr => 'Error: ' + xhr.errorState(true));
XHR(url).loadInto(inputElement);
```


## API documentation ##

The source code is well documented. All exported names has a detailed doc-comment description.  

### var XHR = function(url, postData, method) ###

`XHR` class constructor. Creates the `XHR` instance.  

It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.  

All arguments are optional, so they can be set later by calling `XHR.prototype.reset()`.  

*@example*  
```javascript
XHR(url).send();
XHR(url, 'data', 'PUT').send();
XHR().reset(url).send();
var form = document.querySelector('form');
XHR(form.action, new FormData(form)).send();
```
*@param* `{string}` [url]      Request URL  
*@param* `{*}`      [postData] The POST body to send with request, if any. See `XHR.prototype.send()`.  
*@param* `{string}` [method]   Custom request method  

*@property* `{XMLHttpRequest}` xhr      XMLHttpRequest instance. See <https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest> for more.  
*@property* `{string}`         method   Custom request method  
*@property* `{string}`         url      Request URL  
*@property* `{*}`              postData The POST body to send with request, if any. See `XHR.prototype.send()`.  
*@property* `{string}`         userName User name for authentication  
*@property* `{string}`         password Password for authentication  
*@property* `{object}`         headers  The set of headers to send with request  
*@property* `{object}`         data     The set of arbitrary user data key-value pairs associated with object  

*@return* `{XHR}` XHR instance  

### const XHR.prototype.ERR_* ###

The error codes returned by `XHR.prototype.errorState()` (the reasons of request failure)  

*@type* `{number}`  


```javascript
XHR.prototype.ERR_NONE       = 0; // No error
XHR.prototype.ERR_CONNECTION = 1; // Connection failed
XHR.prototype.ERR_HTTPSTATUS = 2; // HTTP response status code is not 2XX
XHR.prototype.ERR_BODYTYPE   = 3; // Unable to parse the response body according to responseType
```

### XHR.prototype.toString = function() ###

Get string representation: method, url, status  

### XHR.prototype.reset = function(url, postData, method) ###

Set/reset the new URL, method and POST body for the request.  

> See XHR class constructor for more.  

*@param* `{string}` url        Request URL  
*@param* `{*}`      [postData] The POST body to send with request, if any. See `XHR.prototype.send()`.  
*@param* `{string}` [method]   Custom request method  
*@return* `{XHR}` this  

### XHR.prototype.httpAuth = function(userName, password) ###

Set/clear the HTTP authentication data  

*@param* `{string}` [userName]  
*@param* `{string}` [password]  
*@return* `{XHR}` this  

### XHR.prototype.setTimeout = function(msec) ###

Set/clear request timeout (`this.xhr.timeout`), milliseconds  

> See XHR.prototype.onTimeout()  

*@param* `{number}` [msec]  
*@return* `{XHR}` this  

### XHR.prototype.setData = function(name, value) ###

Add name-value pair into `this.data`.  
The name should be a non empty string.  
If the value is undefined then `this.data[name]` will be removed.  

*@param* `{string}` name  
*@param* `{*}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.setHeader = function(name, value) ###

Add HTTP request header into `this.headers`.  
The name should be a non empty string.  
If the value is not a string or it is empty then `this.headers[name]` will be removed.  

*@param* `{string}` name  
*@param* `{string}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.setHeaders = function(headers) ###

Copy name-value pairs from headers object into `this.headers`, non empty strings only.  
All predefined headers will always be removed before copying.  

*@param* `{object}` [headers]  
*@return* `{XHR}` this  

### XHR.prototype.setCookie = function(name, value) ###

Append cookie to the "Cookie" request header (`this.headers["Cookie"]`).  
Both name and value should be a non empty string.  

> Requires Node.JS API.  

*@param* `{string}` name  
*@param* `{string}` value  
*@return* `{XHR}` this  

### XHR.prototype.setCookies = function(cookies) ###

Set the "Cookie" request header (`this.headers["Cookie"]`).  
If cookies is a non empty object then copy name-value pairs from it, non empty strings only.  
If not (e.g. undefined) then remove the "Cookie" header.  

> Requires Node.JS API.  

*@param* `{object}` [cookies]  
*@return* `{XHR}` this  

## Event handlers ##

Inside the any event handler the `this` keyword is always referred to `XHR` instance (except arrow functions and promises).  
The first argument for any callback is also an `XHR` instance (the same as `this`).  
It allows the caller to use promises and arrow functions where `this` reference is always inherited from the caller scope.  

The handlers set with `.onChange`, `.onReady`, `.onSuccess`, `.promise` will overwrite each other, because all of them are  
internally assigned to `this.xhr.onreadystatechange`.  

### XHR.prototype.onTimeout = function(handler) ###

Set/clear request timeout event handler (`this.xhr.ontimeout`)  

> See XHR.prototype.setTimeout().  

*@example*  
```javascript
XHR(url).setTimeout(5e3).onTimeout(function(xhr) {
  alert('Request timed out after '+this.xhr.timeout+'ms');
}).send();
```
*@param* `{function(this:XHR,XHR)}` [handler]  
*@return* `{XHR}` this  

### XHR.prototype.onChange = function(handler) ###

Set/clear `this.xhr.onreadystatechange` event handler.  
The handler will be called several times during request, every time when the `this.xhr.readyState` changed.  

> See XHR.prototype.onReady().  

*@example*  
```javascript
XHR(url).onChange(function(xhr) {
  // Request is in progress
  if (this.isCompleted())
    // Request completed
    if (this.isSuccessResponse()) // Check errors
      console.log('OK:', this.response());
    else
      console.warn('Failed:', this.url, this.errorState(true));
}).send();
```
*@param* `{function(this:XHR,XHR)}` [handler]  
*@return* `{XHR}` this  

### XHR.prototype.onReady = function(handler) ###

Set/clear `this.xhr.onreadystatechange` event handler for `this.xhr.readyState` == `XMLHttpRequest.DONE` event.  
The nandler will be called once when the request completes/fails, regardless of errors.  

> See XHR.prototype.onSuccess().  

*@example*  
```javascript
XHR(url).onReady(xhr => {
  // Request completed, regardless of errors
  if (xhr.isSuccessResponse()) // Check errors
    console.log('OK:', xhr.response());
  else
    console.warn('Failed:', xhr.url, xhr.errorState(true));
}).send();
```
*@param* `{function(this:XHR,XHR)}` [handler]  
*@return* `{XHR}` this  

### XHR.prototype.onSuccess = function(successHandler, errorHandler, finalHandler) ###

Set/clear `this.xhr.onreadystatechange` event handlers for `this.xhr.readyState` == `XMLHttpRequest.DONE` event.  
The successHandler(this) will be called on success. errorHandler(this) will be called on errors. Finally, the finalHandler(this) will always be called.  
All arguments are optional. Call `onSuccess()` with no arguments to clear `this.xhr.onreadystatechange`.  

> See XHR.prototype.isSuccessResponse() for more.  

*@example*  
```javascript
XHR(url).onSuccess(function success(xhr) {
  // Request completed successfully
  console.log('OK:', this.response());
}, function error(xhr) {
  // Something failed
  console.warn('Failed:', this.url, this.errorState(true));
}, function final(xhr) {
  // Finally:
  submitButton.disabled = false;
}).send();

XHR(url).onSuccess(null, null, xhr => console.log('Completed')).send();
```
*@param* `{function(this:XHR,XHR)}` [successHandler] will be called on success  
*@param* `{function(this:XHR,XHR)}` [errorHandler] will be called on errors  
*@param* `{function(this:XHR,XHR)}` [finalHandler] will always be called  
*@return* `{XHR}` this  

### XHR.prototype.promise = function(postData) ###

Send request and return the `Promise` object.  
It will be resolved when request succeeded. It will be rejected for error responses.  
The `XHR` instance (`this`) will be passed to `resolve`/`reject` callbacks.  

> See XHR.prototype.send() and XHR.prototype.isSuccessResponse() for more.  

*@example*  
```javascript
XHR(url).promise()
  .then(  xhr => console.log('OK:', xhr.responseText()) )
  .catch( xhr => console.warn('Failed:', xhr.url, xhr.errorState(true)) );
```
*@param* `{*}` [postData] The POST body to send with request, if any. It will be used instead of `this.postData`.  
*@return* `{Promise}`  

## The wrappers for XMLHttpRequest properties/methods ##

### XHR.prototype.readyState = function() ###

Get the ready state (e.g. `XMLHttpRequest.DONE`)  

*@return* `{number}` this.xhr.readyState  

### XHR.prototype.status = function() ###

Get the HTTP response status code  

*@return* `{number}` this.xhr.status  

### XHR.prototype.responseHeaders = function(asObject) ###

Get all response headers (`this.xhr.getAllResponseHeaders()`).  
Depending on the value of asObject it returns string separated by CRLF or object like {"Key":["Value",],}.  

*@param* `{boolean}` [asObject]  
*@return* `{string|object}`  

### XHR.prototype.responseHeader = function(name) ###

Get the value of the response header by name  

*@param* `{string}` name  
*@return* `{string|void}` this.xhr.getResponseHeader(name)  

### XHR.prototype.responseText = function() ###

Get the response body as string  

*@throws* `{InvalidStateError}` if `this.xhr.responseType` is set to anything other than the empty string or "text"  
*@return* `{string}` this.xhr.responseText  

### XHR.prototype.response = function() ###

Get the response body (parsed). The type is depended on the value of `this.xhr.responseType`.  

*@return* `{*}` this.xhr.response  

### XHR.prototype.responseType = function(value) ###

Get/set the type of the response (`this.xhr.responseType`). The type of `this.xhr.response` will depend on `this.xhr.responseType`.  
Possible values are: "text" (default, the same as ""), "arraybuffer", "blob", "document", "json".  
If the value is not a string then returns the current value.  

*@param* `{XMLHttpRequestResponseType}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.send = function(postData) ###

Send request with predefined method, headers and body.  

1. Call `this.xhr.open(this.method, this.url, true, this.userName, this.password)`;  
2. Send headers defined in `this.headers` by calling `this.xhr.setRequestHeader()`;  
3. Send request body (`postData` or `this.postData`, if any) by calling `this.xhr.send()`;  

If `this.method` is empty then it will be set to "GET" or "POST" depending on body.  
If the one of the `postData` or `this.postData` is not empty then it will be passed to `this.xhr.send()`.  

*@param* `{*}` [postData] The POST body to send with request, if any. It will be used instead of `this.postData`.  
*@throws* `{Error}` if `this.url` is empty  
*@return* `{XHR}` this  

### XHR.prototype.abort = function() ###

Abort the request if it has already been sent. Calls `this.xhr.abort()`.  
When a request is aborted, its readyState is changed to `XMLHttpRequest.DONE` (4).  

*@return* `{XHR}` this  

## User-level helper methods ##

### XHR.prototype.isCompleted = function() ###

Check if request is completed  

*@return* `{boolean}` this.xhr.readyState == XMLHttpRequest.DONE (4)  

### XHR.prototype.isStatusOK = function() ###

Check if response HTTP status is 2XX  

*@return* `{boolean}` this.xhr.status is 2XX  

### XHR.prototype.isSuccessResponse = function() ###

Check if response HTTP status is 2XX and there is valid response, correctly parsed depending on `this.xhr.responseType`.  
Valid response is a response where (`this.xhr.responseType` is empty) OR (`this.xhr.response` is not `null`/`undefined`).  

*@return* `{boolean}`  

### XHR.prototype.errorState = function(asString) ###

Get the reason of request failure, returns the error code (e.g. `XHR.prototype.ERR_HTTPSTATUS`) or 0.  
This should be called when the response is completed (when `this.xhr.readyState` == `XMLHttpRequest.DONE`),  
from the handler set by `this.onReady()` for example. It always returns 0 if called from the handler which was set by `this.onSuccess()`.  

> See XHR.prototype.isStatusOK() and XHR.prototype.isSuccessResponse() for more.  

*@param* `{boolean}` [asString] Return the error message instead of the error code (for simplified debugging)  
*@return* `{number|string}` Error code (see `XHR.prototype.ERR_*`) or message  

### XHR.prototype.loadInto = function(element, preloading, onError) ###

Send request, load response result text (`this.xhr.responseText`) into DOM element (element.value or element.innerHTML).  
This clears the response type (`this.xhr.responseType`) and overwrites the previously installed event handler.  
If request fails then onError will be used:  
If onError is a function then the result of calling onError(this) will be used.  
If onError is not a function then its value will be used as is.  

> Requires browser API.  
> XMLHttpRequest.responseText property is only available when XMLHttpRequest.responseType is "text" or empty.  

*@example*  
```javascript
XHR(url).loadInto(document.querySelector('#target'), true, 'Request failed');
XHR(url).loadInto('#target', 'Loading...', xhr => 'Error: ' + xhr.errorState(true));
XHR(url).loadInto(inputElement);
```
*@param* `{Element|string}` element Element instance or CSS selector string  
*@param* `{boolean|string}` [preloading] If not empty, call `this.showPreloader(element[, preloading])` before request  
*@param* `{string|function(XHR)}` [onError] Will be used if request fails  
*@throws* `{Error}` if element is neither an Element instance nor a string or if `document.querySelector(element)` fails  
*@return* `{XHR}` this  

### XHR.prototype.showPreloader = function(element, message) ###

Show preloader in the DOM element.  
Set element.innerHTML = `<div class="xhr_preloader"...>message</div>`. For input elements set element.value = message.  
It used by `this.loadInto()`. The caller can assign custom implementation to `XHR.prototype.showPreloader`.  

> Requires browser API.  

*@type* `{function(Element|string,string?):XHR}`  
*@param* `{Element|string}` element Element instance or CSS selector string  
*@param* `{string}` [message] Custom 'loading...' message  
*@throws* `{Error}` if element is neither an Element instance nor a string or if `document.querySelector(element)` fails  
*@return* `{XHR}` this  

