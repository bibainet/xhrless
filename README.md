# XHRLESS: write less, do more with XMLHttpRequest API. #

It is an abstraction layer over the **XMLHttpRequest** v2 API for browser/Node.JS environments.  

*@version* `1.0.0` 2017.10.21  
*@author* `https://github.com/bibainet`  


## Installation ##

On the client side (browser) just include the `xhrless.js` script. The constructor function is now available under the name `XHR`.  

In order to use it on the server side (Node.JS), install `xhrless` package using **npm**: `npm install xhrless`.  

You can manually add a dependency to the **package.json** file:  

```json
"dependencies": {
  "xhrless": "^1.0.0"
}
```

and run `npm install`. Now you can import and use it:  

```javascript
const XHR = require('xhrless');
```


## Usage and examples ##

The only exported name is `XHR`, the constructor function. It returns the `XHR` instance.  
It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.  
Mostly all of the methods of XHR prototype returns the reference to `this`, so the method calls can easily be chained:  
`xhr = XHR(...).setHeader(...).responseType(...).onSuccess(...).send();`.  

```javascript
XHR(url).setHeader('X-Test', 'OK').onReady(function(xhr) {
  // Request completed, regardless of errors
  if (this.isSuccessResponse())
    console.log('OK:', this.responseText());
  else
    console.warn(this.url, this.errorState(true));
}).send(new FormData());

XHR(url, new FormData(), 'PUT').httpAuth(config.userName, config.password).onSuccess(xhr => {
  // Request completed successfully
  console.log(xhr.response());
}, xhr => {
  // Something failed
  console.warn(xhr.url, xhr.errorState(true));
}).send();
```

### Fetch JSON ###

```javascript
XHR(url_json).responseType('json').setData('reqTime', new Date()).onSuccess(function(xhr) {
  console.log(typeof this.response(), this.response());
}, function(xhr) {
  console.warn(this.data.reqTime, this.url, this.errorState(true));
}).send();
```

### Using promises ###

```javascript
XHR(url).promise()
  .then(  xhr => console.log(xhr.response()) )
  .catch( xhr => console.warn(xhr.url, xhr.errorState(true)) );
```

### Methods that work only in browsers ###

```javascript
XHR(url).showPreloader(node).loadInto(node);
XHR(url).loadInto(node, true, 'Request failed');
XHR(url).loadInto(node, true, xhr => xhr.errorState(true));
```

### XHR instances are reusable ###

```javascript
// Create and configure the XHR instance once
const req = XHR().onReady(handler).setTimeout(5e3).setHeader('X-Test', 'OK');
// [Re]set target URL, send POST
req.reset(url).send(body1);
// Send another POST
req.send(body2);
```


## API documentation ##

The source code is well documented. Any exported name has a detailed doc-comment description.  

### var XHR = function(url, postData, method) ###

`XHR` class constructor. Creates the `XHR` instance.  

It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.  
All arguments are optional, so they can be set later by calling this.reset().  

*@param* `{string}` [url]      Request URL  
*@param* `{*}`      [postData] The POST body to send with request. See this.send(), XMLHttpRequest.send().  
*@param* `{string}` [method]   Custom request method. See this.send().  

*@property* `{XMLHttpRequest}` xhr      XMLHttpRequest instance  
*@property* `{string}`         method   Custom request method. See this.send().  
*@property* `{string}`         url      Request URL  
*@property* `{*}`              postData The POST body to send with request. See this.send(), XMLHttpRequest.send().  
*@property* `{string}`         userName User name for authentication  
*@property* `{string}`         password Password for authentication  
*@property* `{object}`         headers  The set of headers to send with request  
*@property* `{object}`         data     The set of arbitrary user data key -> value pairs associated with object  

*@return* `{XHR}` XHR instance  

### const XHR.prototype.ERR_* ###

The error codes returned by this.errorState() (the reasons of request failure)  

*@type* `{number}`  


```javascript
XHR.prototype.ERR_NONE       = 0;
XHR.prototype.ERR_CONNECTION = 1; // Connection failed
XHR.prototype.ERR_HTTPSTATUS = 2; // HTTP response status code is not 2XX
XHR.prototype.ERR_BODYTYPE   = 3; // Unable to parse the response body according to responseType
```

### XHR.prototype.reset = function(url, postData, method) ###

Set the new method, URL and POST body for the next request  

*@param* `{string}` url  
*@param* `{*}` [postData]  
*@param* `{string}` [method]  
*@return* `{XHR}` this  

### XHR.prototype.httpAuth = function(userName, password) ###

Set/clear the HTTP authentication data  

*@param* `{string}` [userName]  
*@param* `{string}` [password]  
*@return* `{XHR}` this  

### XHR.prototype.setTimeout = function(msec) ###

Set/clear request timeout (this.xhr.timeout), milliseconds  

*@param* `{number}` [msec]  
*@return* `{XHR}` this  

### XHR.prototype.setData = function(name, value) ###

Add (name -> value) pair into this.data.  
The name should be a non empty string.  
If the value is undefined then this.data[name] will be removed.  

*@param* `{string}` name  
*@param* `{*}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.setHeader = function(name, value) ###

Add HTTP request header to this.headers.  
The name should be a non empty string.  
If the value is not a string or it is empty then this.headers[name] will be removed.  

*@param* `{string}` name  
*@param* `{string}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.setCookie = function(name, value) ###

Append cookie to the "Cookie" request header (to this.headers["Cookie"]).  
Both name and value should be a non empty string.  

> Requires Node.JS API.  

*@param* `{string}` name  
*@param* `{string}` value  
*@return* `{XHR}` this  

### XHR.prototype.setCookies = function(cookies) ###

Set the "Cookie" request header (this.headers["Cookie"]).  

If cookies is a non empty object then use the name -> value pairs from it, non empty strings only.  
If not (e.g. undefined) then remove the "Cookie" header.  

> Requires Node.JS API.  

*@param* `{object}` [cookies]  
*@return* `{XHR}` this  

## Event handlers ##

Inside the any event handler the `this` keyword is always referred to `XHR` instance (except arrow functions and promises).  
The first argument for any callback is also an `XHR` instance (the same as `this`).  
It allows the caller to use promises and arrow functions where `this` reference is always inherited from the caller scope.  

The handlers set with `this.onChange`, `this.onReady`, `this.onSuccess`, `this.promise` will overwrite each other,  
because all of them are internally assigned to `this.xhr.onreadystatechange`.  

### XHR.prototype.onTimeout = function(handler) ###

Set request timeout event handler (this.xhr.ontimeout)  

```javascript
XHR(url).setTimeout(5e3).onTimeout(function(xhr) {
  alert('Request timed out after '+this.xhr.timeout+'ms');
}).loadInto(node);
```

*@param* `{function(XHR)}` handler  
*@return* `{XHR}` this  

### XHR.prototype.onChange = function(handler) ###

Set this.xhr.onreadystatechange event handler.  
The handler will be called several times during request, every time when the this.xhr.readyState changed.  

```javascript
XHR(url).onChange(function(xhr) {
  // Request is in progress
  if (this.isCompleted())
    // Request is completed
    if (this.isSuccessResponse())
      console.log(this.response());
    else
      console.warn('Failed');
}).send();
```

*@param* `{function(XHR)}` handler  
*@return* `{XHR}` this  

### XHR.prototype.onReady = function(handler) ###

Set this.xhr.onreadystatechange event handler for this.xhr.readyState == XMLHttpRequest.DONE event.  
The nandler will be called once when the request completes/fails, regardless of errors.  

```javascript
XHR(url).onReady(xhr => {
  // Request completed, regardless of errors
  if (xhr.isSuccessResponse())
    console.log(xhr.response());
  else
    console.warn('Failed');
}).send();
```

*@param* `{function(XHR)}` handler  
*@return* `{XHR}` this  

### XHR.prototype.onSuccess = function(successHandler, errorHandler) ###

Set this.xhr.onreadystatechange event handlers for this.xhr.readyState == XMLHttpRequest.DONE event.  
For success responses the successHandler(this) will be called. For error responses the errorHandler(this) will be called.  
Both successHandler and errorHandler can be omitted.  

> See this.isSuccessResponse() for more.  

```javascript
XHR(url).onSuccess(function(xhr) {
  // Request completed successfully
  console.log(this.response());
}, function(xhr) {
  // Something failed
  console.warn(this.url, this.errorState(true));
}).send();
```

*@param* `{function(XHR)}` [successHandler]  
*@param* `{function(XHR)}` [errorHandler]  
*@return* `{XHR}` this  

### XHR.prototype.promise = function(postData) ###

Send request and return the Promise.  
The promise will be resolved when request is succeeded. It will be rejected for error responses.  
The XHR instance (this) will be passed as first argument to resolve/reject callbacks.  

> See this.send() and this.isSuccessResponse() for more.  

```javascript
XHR(url).promise()
  .then(  xhr => console.log(xhr.response()) )
  .catch( xhr => console.warn(xhr.url, xhr.errorState(true)) );
```

*@param* `{*}` [postData]  
*@return* `{Promise}`  

## The wrappers for XMLHttpRequest properties and methods ##

### XHR.prototype.readyState = function() ###

Get the ready state (e.g. XMLHttpRequest.DONE)  

*@return* `{number}` this.xhr.readyState  

### XHR.prototype.status = function() ###

Get the HTTP response status code  

*@return* `{number}` this.xhr.status  

### XHR.prototype.responseHeaders = function() ###

Get all response headers separated by CRLF  

*@return* `{string}` this.xhr.getAllResponseHeaders()  

### XHR.prototype.responseHeader = function(name) ###

Get the value of the response header by name  

*@param* `{string}` name  
*@return* `{string|void}` this.xhr.getResponseHeader(name)  

### XHR.prototype.responseText = function() ###

Get the response body as string  

*@throws* `{InvalidStateError}` if this.xhr.responseType is set to anything other than the empty string or "text"  
*@return* `{string}` this.xhr.responseText  

### XHR.prototype.response = function() ###

Get the response body (parsed). The type is depended on the value of this.xhr.responseType  

*@return* `{*}` this.xhr.response  

### XHR.prototype.responseType = function(value) ###

Get/set the type of the response (this.xhr.responseType). The type of this.xhr.response will depend on this.xhr.responseType.  
Possible values are: "text" (default, the same as ""), "arraybuffer", "blob", "document", "json".  
If the value is not a string then return the current value. Otherwise, use value and return this.  

*@param* `{XMLHttpRequestResponseType}` [value]  
*@return* `{XHR}` this  

### XHR.prototype.send = function(postData) ###

Send request with predefined method, headers, body.  
Call this.xhr.open(), this.xhr.setRequestHeader()..., this.xhr.send();  
If this.method is empty then it will be set to GET or POST depending on body.  
If one of the postData or this.postData is not empty then it will be passed to this.xhr.send().  

> See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send for more.  

*@param* `{*}` [postData]  
*@throws* `{Error}` if this.url is empty  
*@return* `{XHR}` this  

### XHR.prototype.abort = function() ###

Abort request. Calls this.xhr.abort()  

*@return* `{XHR}` this  

## User-level helper methods ##

### XHR.prototype.isCompleted = function() ###

Check if request is completed  

*@return* `{boolean}` this.xhr.readyState == XMLHttpRequest.DONE  

### XHR.prototype.isStatusOK = function() ###

Check if response HTTP status is 2XX  

*@return* `{boolean}` this.xhr.status is 2XX  

### XHR.prototype.isSuccessResponse = function() ###

Check if response HTTP status is 2XX and there is valid response, correctly parsed depending on this.xhr.responseType.  
Valid response is a response where (this.xhr.responseType is empty) OR (this.xhr.response is not null/undefined).  

*@return* `{boolean}`  

```javascript
XHR.prototype.isSuccessResponse = function() {
	return this.isStatusOK() && (!this.xhr.responseType || (this.xhr.response !== null && this.xhr.response !== undefined));
};
```

### XHR.prototype.errorState = function(asString) ###

Get the reason of request failure, returns the error code (e.g. this.ERR_HTTPSTATUS) or 0.  
This should be called when the response is completed (when this.xhr.readyState == XMLHttpRequest.DONE),  
from the handler set by this.onReady() for example. It always returns 0 if called from the handler set by this.onSuccess().  

> See this.isStatusOK() and this.isSuccessResponse() for more.  

*@param* `{boolean}` [asString] Return the error message instead of the error code (for simplified debugging)  
*@return* `{number|string}` Error code or message  

### XHR.prototype.loadInto = function(node, showPreloader, onError) ###

Send request, load response result text (this.xhr.responseText) into DOM element node.  
This clears the response type (this.xhr.responseType) and overwrites the previously installed event handler.  
If request fails then onError will be used:  
If onError is a function then the result of calling onError(this) will be used.  
If onError is not a function then its value will be used as is.  

> Requires browser API.  
> XMLHttpRequest.responseText property is only available when XMLHttpRequest.responseType is "text" or empty.  

*@param* `{Element|string}` node element object or CSS selector string  
*@param* `{boolean}` [showPreloader] call this.showPreloader(node) before request  
*@param* `{string|function(XHR)}` [onError] will be used if request fails  
*@throws* `{Error}` if node is neither an Element instance nor a string or if document.querySelector(node) fails  
*@return* `{XHR}` this  

### XHR.prototype.showPreloader = function(node) ###

Show preloader `<div class="xhr_preloader"...>` in the DOM element node.  
It used by this.loadInto(). The caller can assign any custom implementation to this.  

> Requires browser API.  

*@type* `{function(Element|string):XHR}`  
*@param* `{Element|string}` node element object or CSS selector string  
*@return* `{XHR}` this  

