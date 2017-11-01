/**
 * # XHRLESS: write less, do more with XMLHttpRequest API. #
 * 
 * It is an abstraction layer over the **XMLHttpRequest** v2 API for browser/Node.JS environments.
 * 
 * @version    1.0.3 2017.11.01
 * @license    MIT
 * @copyright  Copyright © 2017 Alexander Bibanin https://github.com/bibainet
 * 
 * 
 * ## Installation ##
 * 
 * On the client side (browser) just include the **xhrless.js** script. The constructor function is now available under the name `XHR`.
 * 
 * In order to use it on the server side (Node.JS), install package **xhrless** using npm: `npm install xhrless`.
 * 
 * You can manually add a dependency to the package.json file:
 * 
 * ```json
 * "dependencies": {
 *   "xhrless": "^1.0.0"
 * }
 * ```
 * 
 * and run `npm install`. Now you can import and use it:
 * 
 * ```javascript
 * const XHR = require('xhrless');
 * ```
 * 
 * 
 * ## Usage and examples ##
 * 
 * The only exported name is `XHR`, the constructor function. It returns the `XHR` instance.
 * It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.
 * Mostly all of the methods of XHR prototype returns the reference to `XHR` (`this`), so the method calls can easily be chained:
 * `xhr = XHR(...).setHeader(...).responseType(...).onSuccess(...).send();`.
 * 
 * ```javascript
 * XHR(url).setHeader('X-Test', 'OK').onReady(function(xhr) {
 *   // Request completed, regardless of errors
 *   if (this.isSuccessResponse())
 *     console.log('OK:', this.responseText());
 *   else
 *     console.warn(this.url, this.errorState(true));
 * }).send(new FormData());
 * 
 * XHR(url, new FormData(), 'PUT').httpAuth(config.userName, config.password).onSuccess(xhr => {
 *   // Request completed successfully
 *   console.log(xhr.response());
 * }, xhr => {
 *   // Something failed
 *   console.warn(xhr.url, xhr.errorState(true));
 * }).send();
 * ```
 * 
 * ### Fetch JSON ###
 * 
 * Call `.responseType('json')` on `XHR` instance before sending request.
 * Call `.response()` to get the decoded response object.
 * 
 * ```javascript
 * XHR(url_json).responseType('json').setData('reqTime', new Date()).onSuccess(function(xhr) {
 *   console.log(typeof this.response(), this.response());
 * }, function(xhr) {
 *   console.warn(this.data.reqTime, this.url, this.errorState(true));
 * }).send();
 * ```
 * 
 * ### Using promises ###
 *
 * Call `.promise()` instead of `.send()`.
 * 
 * ```javascript
 * XHR(url).promise()
 *   .then(  xhr => console.log(xhr.response()) )
 *   .catch( xhr => console.warn(xhr.url, xhr.errorState(true)) );
 * ```
 * 
 * ### Methods that work only in browser ###
 * 
 * ```javascript
 * XHR(url).showPreloader(node).loadInto(node);
 * XHR(url).loadInto(node, true, 'Request failed');
 * XHR(url).loadInto(node, true, xhr => 'Error: ' + xhr.errorState(true));
 * ```
 * 
 * ### XHR instances are reusable ###
 * 
 * The `XHR` instance, once created, can be reused several times.
 * 
 * ```javascript
 * // Create and configure the XHR instance
 * const req = XHR().onReady(handler).setTimeout(5e3).setHeader('X-Test', 'OK');
 * // Set/reset target URL, send POST
 * req.reset(url).send(body1);
 * // Send another POST
 * req.send(body2);
 * ```
 * 
 * 
 * ## API documentation ##
 * 
 * The source code is well documented. All exported names has a detailed doc-comment description.
 */

// @ts-check

(function(exportName) {

	// Detect environment (Browser/Node.JS)
	const ENV_BROWSER = (typeof window == 'object') && (typeof document == 'object');
	const ENV_NODEJS  = (typeof module == 'object') && (typeof require == 'function');

	// Check XMLHttpRequest API
	if (typeof XMLHttpRequest == 'undefined') {
		if (ENV_NODEJS) {
			// Load "xhr2" module implementing XMLHttpRequest v2 API for Node.JS
			// @ts-ignore
			XMLHttpRequest = require('xhr2'); // Omiting var keyword to avoid hoisting: inherit global XMLHttpRequest when in browser API
			// @ts-ignore
			(typeof XMLHttpRequest.prototype._restrictedHeaders == 'object') && ['cookie', 'cookie2', 'referer', 'user-agent'].forEach(name => delete(XMLHttpRequest.prototype._restrictedHeaders[name]));
		} else {
			throw new Error('XMLHttpRequest is not defined in this environment');
		};
	};

	/**
	 * `XHR` class constructor. Creates the `XHR` instance.
	 * 
	 * It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.
	 * 
	 * All arguments are optional, so they can be set later by calling `XHR.prototype.reset()`.
	 * 
	 * @param {string} [url]      Request URL
	 * @param {*}      [postData] The POST body to send with request, if any. See `XHR.prototype.send()`.
	 * @param {string} [method]   Custom request method
	 * 
	 * @property {XMLHttpRequest} xhr      XMLHttpRequest instance. See <https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest> for more.
	 * @property {string}         method   Custom request method
	 * @property {string}         url      Request URL
	 * @property {*}              postData The POST body to send with request, if any. See `XHR.prototype.send()`.
	 * @property {string}         userName User name for authentication
	 * @property {string}         password Password for authentication
	 * @property {object}         headers  The set of headers to send with request
	 * @property {object}         data     The set of arbitrary user data key-value pairs associated with object
	 * 
	 * @return {XHR} XHR instance
	 */
	var XHR = function(url, postData, method) {
		// If called without the `new` keyword then auto create object calling `new XHR()` and return it
		if ((typeof this != 'object') || !(this instanceof XHR))
			return new XHR(url, postData, method);
		// Called with new keyword
		this.xhr      = new XMLHttpRequest();
		// this.reset();
		this.method   = method   || '';
		this.url      = url      || '';
		this.postData = postData || undefined;
		// this.httpAuth();
		this.userName = undefined;
		this.password = undefined;
		this.headers  = {};
		this.data     = {};
	};

	/**
	 * The error codes returned by `XHR.prototype.errorState()` (the reasons of request failure)
	 * @type {number}
	 * @x-id const XHR.prototype.ERR_*
	 * @x-rowspan javascript
	 */
	XHR.prototype.ERR_NONE       = 0; // No error
	XHR.prototype.ERR_CONNECTION = 1; // Connection failed
	XHR.prototype.ERR_HTTPSTATUS = 2; // HTTP response status code is not 2XX
	XHR.prototype.ERR_BODYTYPE   = 3; // Unable to parse the response body according to responseType

	/**
	 * Set/reset the new URL, method and POST body for the request.
	 * 
	 * > See XHR class constructor for more.
	 * 
	 * @param {string} url        Request URL
	 * @param {*}      [postData] The POST body to send with request, if any. See `XHR.prototype.send()`.
	 * @param {string} [method]   Custom request method
	 * @return {XHR} this
	 */
	XHR.prototype.reset = function(url, postData, method) {
		this.method   = method   || '';
		this.url      = url      || '';
		this.postData = postData || undefined;
		return this;
	};

	/**
	 * Set/clear the HTTP authentication data
	 * @param {string} [userName]
	 * @param {string} [password]
	 * @return {XHR} this
	 */
	XHR.prototype.httpAuth = function(userName, password) {
		this.userName = userName;
		this.password = password;
		return this;
	};

	/**
	 * Set/clear request timeout (`this.xhr.timeout`), milliseconds
	 * 
	 * > See XHR.prototype.onTimeout()
	 * 
	 * @param {number} [msec]
	 * @return {XHR} this
	 */
	XHR.prototype.setTimeout = function(msec) {
		this.xhr.timeout = (typeof msec == 'number') && msec > 0 ? msec : 0;
		return this;
	};

	/**
	 * Add name-value pair into `this.data`.
	 * The name should be a non empty string.
	 * If the value is undefined then `this.data[name]` will be removed.
	 * @param {string} name
	 * @param {*} [value]
	 * @return {XHR} this
	 */
	XHR.prototype.setData = function(name, value) {
		if ((typeof name == 'string') && name.length)
			if (value !== undefined)
				this.data[name] = value;
			else if (this.data.hasOwnProperty(name))
				delete(this.data[name]);
		return this;
	};

	/**
	 * Add HTTP request header into `this.headers`.
	 * The name should be a non empty string.
	 * If the value is not a string or it is empty then `this.headers[name]` will be removed.
	 * @param {string} name
	 * @param {string} [value]
	 * @return {XHR} this
	 */
	XHR.prototype.setHeader = function(name, value) {
		if ((typeof name == 'string') && name.length)
			if ((typeof value == 'string') && value.length)
				this.headers[name] = value;
			else if (this.headers.hasOwnProperty(name))
				delete(this.headers[name]);
		return this;
	};

	/**
	 * Copy name-value pairs from headers object into `this.headers`, non empty strings only.
	 * All predefined headers will always be removed before copying.
	 * @param {object} [headers]
	 * @return {XHR} this
	 */
	XHR.prototype.setHeaders = function(headers) {
		this.headers = {};
		if (typeof headers == 'object')
			for (var name in headers)
				if (headers.hasOwnProperty(name) && (typeof headers[name] == 'string') && headers[name].length)
					this.headers[name] = headers[name];
		return this;
	};

	/**
	 * Append cookie to the "Cookie" request header (`this.headers["Cookie"]`).
	 * Both name and value should be a non empty string.
	 * 
	 * > Requires Node.JS API.
	 * 
	 * @param {string} name
	 * @param {string} value
	 * @return {XHR} this
	 */
	XHR.prototype.setCookie = function(name, value) {
		if ((typeof name == 'string') && name.length && (typeof value == 'string') && value.length)
			if ('Cookie' in this.headers)
				this.headers['Cookie'] += '; ' + name + '=' + encodeURIComponent(value);
			else
				this.headers['Cookie'] = name + '=' + encodeURIComponent(value);
		return this;
	};

	/**
	 * Set the "Cookie" request header (`this.headers["Cookie"]`).
	 * If cookies is a non empty object then copy name-value pairs from it, non empty strings only.
	 * If not (e.g. undefined) then remove the "Cookie" header.
	 * 
	 * > Requires Node.JS API.
	 * 
	 * @param {object} [cookies]
	 * @return {XHR} this
	 */
	XHR.prototype.setCookies = function(cookies) {
		var encoded = [];
		if (typeof cookies == 'object')
			for (var name in cookies)
				if (cookies.hasOwnProperty(name) && (typeof cookies[name] == 'string') && cookies[name].length)
					encoded.push(name + '=' + encodeURIComponent(cookies[name]));
		if (encoded.length)
			this.headers['Cookie'] = encoded.join('; ');
		else if (this.headers.hasOwnProperty('Cookie'))
			delete(this.headers['Cookie']);
		return this;
	};

	// =========================================================================

	/**
	 * ## Event handlers ##
	 * 
	 * Inside the any event handler the `this` keyword is always referred to `XHR` instance (except arrow functions and promises).
	 * The first argument for any callback is also an `XHR` instance (the same as `this`).
	 * It allows the caller to use promises and arrow functions where `this` reference is always inherited from the caller scope.
	 * 
	 * The handlers set with `.onChange`, `.onReady`, `.onSuccess`, `.promise` will overwrite each other, because all of them are
	 * internally assigned to `this.xhr.onreadystatechange`.
	 */

	/**
	 * Set/clear request timeout event handler (`this.xhr.ontimeout`)
	 * 
	 * > See XHR.prototype.setTimeout().
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).setTimeout(5e3).onTimeout(function(xhr) {
	 *   alert('Request timed out after '+this.xhr.timeout+'ms');
	 * }).send();
	 * ```
	 * @param {function(XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onTimeout = function(handler) {
		if (typeof handler == 'function')
			this.xhr.ontimeout = (event) => handler.call(this, this);
		else
			this.xhr.ontimeout = null;
		return this;
	};

	/**
	 * Set/clear `this.xhr.onreadystatechange` event handler.
	 * The handler will be called several times during request, every time when the `this.xhr.readyState` changed.
	 * 
	 * > See XHR.prototype.onReady().
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).onChange(function(xhr) {
	 *   // Request is in progress
	 *   if (this.isCompleted())
	 *     // Request is completed
	 *     if (this.isSuccessResponse())
	 *       console.log(this.response());
	 *     else
	 *       console.warn('Failed');
	 * }).send();
	 * ```
	 * @param {function(XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onChange = function(handler) {
		if (typeof handler == 'function')
			this.xhr.onreadystatechange = (event) => handler.call(this, this);
		else
			this.xhr.onreadystatechange = null;
		return this;
	};

	/**
	 * Set/clear `this.xhr.onreadystatechange` event handler for `this.xhr.readyState` == `XMLHttpRequest.DONE` event.
	 * The nandler will be called once when the request completes/fails, regardless of errors.
	 * 
	 * > See XHR.prototype.onSuccess().
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).onReady(xhr => {
	 *   // Request completed, regardless of errors
	 *   if (xhr.isSuccessResponse())
	 *     console.log(xhr.response());
	 *   else
	 *     console.warn('Failed');
	 * }).send();
	 * ```
	 * @param {function(XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onReady = function(handler) {
		if (typeof handler == 'function')
			this.xhr.onreadystatechange = (event) => this.isCompleted() && handler.call(this, this);
		else
			this.xhr.onreadystatechange = null;
		return this;
	};

	/**
	 * Set/clear `this.xhr.onreadystatechange` event handlers for `this.xhr.readyState` == `XMLHttpRequest.DONE` event.
	 * For success responses the successHandler(this) will be called. For error responses the errorHandler(this) will be called.
	 * Both successHandler and errorHandler can be omitted.
	 * 
	 * > See XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).onSuccess(function(xhr) {
	 *   // Request completed successfully
	 *   console.log(this.response());
	 * }, function(xhr) {
	 *   // Something failed
	 *   console.warn(this.url, this.errorState(true));
	 * }).send();
	 * ```
	 * @param {function(XHR)} [successHandler]
	 * @param {function(XHR)} [errorHandler]
	 * @return {XHR} this
	 */
	XHR.prototype.onSuccess = function(successHandler, errorHandler) {
		if ((typeof successHandler == 'function') && (typeof errorHandler == 'function')) {
			this.xhr.onreadystatechange = (event) => {
				if (this.isCompleted())
					if (this.isSuccessResponse())
						successHandler.call(this, this);
					else
						errorHandler.call(this, this);
			};
		} else if (typeof successHandler == 'function') {
			this.xhr.onreadystatechange = (event) => this.isCompleted() && this.isSuccessResponse() && successHandler.call(this, this);
		} else if (typeof errorHandler == 'function') {
			this.xhr.onreadystatechange = (event) => this.isCompleted() && !this.isSuccessResponse() && errorHandler.call(this, this);
		} else {
			this.xhr.onreadystatechange = null;
		};
		return this;
	};

	/**
	 * Send request and return the Promise.
	 * The promise will be resolved when request is succeeded. It will be rejected for error responses.
	 * The XHR instance (`this`) will be passed as first argument to resolve/reject callbacks.
	 * 
	 * > See XHR.prototype.send() and XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).promise()
	 *   .then(  xhr => console.log(xhr.response()) )
	 *   .catch( xhr => console.warn(xhr.url, xhr.errorState(true)) );
	 * ```
	 * @param {*} [postData] The POST body to send with request, if any. It will be used instead of `this.postData`.
	 * @return {Promise}
	 */
	XHR.prototype.promise = function(postData) {
		return new Promise((resolve, reject) => {
			this.xhr.onreadystatechange = (event) => {
				if (this.isCompleted())
					if (this.isSuccessResponse())
						resolve(this);
					else
						reject(this);
			};
			this.send(postData);
		});
	};

	// =========================================================================
	/** ## The wrappers for XMLHttpRequest properties and methods ## */

	/**
	 * Get the ready state (e.g. `XMLHttpRequest.DONE`)
	 * @return {number} this.xhr.readyState
	 */
	XHR.prototype.readyState = function() {
		return this.xhr.readyState;
	};

	/**
	 * Get the HTTP response status code
	 * @return {number} this.xhr.status
	 */
	XHR.prototype.status = function() {
		return this.xhr.status;
	};

	/**
	 * Get all response headers (`this.xhr.getAllResponseHeaders()`).
	 * Depending on the value of asObject it returns string separated by CRLF or object like {"Key":["Value",],}.
	 * @param {boolean} [asObject]
	 * @return {string|object}
	 */
	XHR.prototype.responseHeaders = function(asObject) {
		if (!asObject)
			return this.xhr.getAllResponseHeaders();
		var list = this.xhr.getAllResponseHeaders().split("\n"),
			hash = {}, key = '', val = '', sep = 0;
		for (var i = 0, l = list.length; i < l; ++i) {
			sep = list[i].indexOf(':');
			if (sep > 0) {
				key = list[i].substr(0,sep).trim();
				val = list[i].substr(sep+1).trim();
				if (key.length && val.length) {
					if (hash.hasOwnProperty(key))
						hash[key].push(val);
					else
						hash[key] = [val];
				};
			};
		};
		return hash;
	};

	/**
	 * Get the value of the response header by name
	 * @param {string} name
	 * @return {string|void} this.xhr.getResponseHeader(name)
	 */
	XHR.prototype.responseHeader = function(name) {
		return this.xhr.getResponseHeader(name);
	};

	/**
	 * Get the response body as string
	 * @throws {InvalidStateError} if `this.xhr.responseType` is set to anything other than the empty string or "text"
	 * @return {string} this.xhr.responseText
	 */
	XHR.prototype.responseText = function() {
		return this.xhr.responseText;
	};

	/**
	 * Get the response body (parsed). The type is depended on the value of `this.xhr.responseType`.
	 * @return {*} this.xhr.response
	 */
	XHR.prototype.response = function() {
		return this.xhr.response;
	};

	/**
	 * Get/set the type of the response (`this.xhr.responseType`). The type of `this.xhr.response` will depend on `this.xhr.responseType`.
	 * Possible values are: "text" (default, the same as ""), "arraybuffer", "blob", "document", "json".
	 * If the value is not a string then returns the current value.
	 * @param {XMLHttpRequestResponseType} [value]
	 * @return {XHR} this
	 */
	XHR.prototype.responseType = function(value) {
		if (typeof value != 'string')
			// @ts-ignore
			return this.xhr.responseType;
		this.xhr.responseType = value;
		return this;
	};

	/**
	 * Send request with predefined method, headers and body.
	 * 1. Call `this.xhr.open(this.method, this.url, true, this.userName, this.password)`;
	 * 2. Send headers defined in `this.headers` using `this.xhr.setRequestHeader()`;
	 * 3. Send request body (`postData` or `this.postData`, if any) using `this.xhr.send()`;
	 * If `this.method` is empty then it will be set to GET or POST depending on body.
	 * If the one of the `postData` or `this.postData` is not empty then it will be passed to `this.xhr.send()`.
	 * @param {*} [postData] The POST body to send with request, if any. It will be used instead of `this.postData`.
	 * @throws {Error} if `this.url` is empty
	 * @return {XHR} this
	 */
	XHR.prototype.send = function(postData) {
		if (!this.url) {
			throw new Error('The request URL is empty');
		} else if (postData || this.postData) {
			this.xhr.open(this.method || 'POST', this.url, true, this.userName, this.password);
			for (var key in this.headers) this.xhr.setRequestHeader(key, this.headers[key]);
			this.xhr.send(postData || this.postData);
		} else {
			this.xhr.open(this.method || 'GET', this.url, true, this.userName, this.password);
			for (var key in this.headers) this.xhr.setRequestHeader(key, this.headers[key]);
			this.xhr.send();
		};
		return this;
	};

	/**
	 * Abort the request if it has already been sent. Calls `this.xhr.abort()`.
	 * When a request is aborted, its readyState is changed to `XMLHttpRequest.DONE` (4).
	 * @return {XHR} this
	 */
	XHR.prototype.abort = function() {
		this.xhr.abort();
		return this;
	};

	// =========================================================================
	/** ## User-level helper methods ## */

	/**
	 * Check if request is completed
	 * @return {boolean} this.xhr.readyState == XMLHttpRequest.DONE (4)
	 */
	XHR.prototype.isCompleted = function() {
		return this.xhr.readyState && (this.xhr.readyState == XMLHttpRequest.DONE || this.xhr.readyState == this.xhr.DONE);
	};

	/**
	 * Check if response HTTP status is 2XX
	 * @return {boolean} this.xhr.status is 2XX
	 */
	XHR.prototype.isStatusOK = function() {
		return (this.xhr.status >= 200) && (this.xhr.status < 300);
	};

	/**
	 * Check if response HTTP status is 2XX and there is valid response, correctly parsed depending on `this.xhr.responseType`.
	 * Valid response is a response where (`this.xhr.responseType` is empty) OR (`this.xhr.response` is not `null`/`undefined`).
	 * @return {boolean}
	 */
	XHR.prototype.isSuccessResponse = function() {
		return this.isStatusOK() && (!this.xhr.responseType || (this.xhr.response !== null && this.xhr.response !== undefined));
	};

	/**
	 * Get the reason of request failure, returns the error code (e.g. `XHR.prototype.ERR_HTTPSTATUS`) or 0.
	 * This should be called when the response is completed (when `this.xhr.readyState` == `XMLHttpRequest.DONE`),
	 * from the handler set by `this.onReady()` for example. It always returns 0 if called from the handler which was set by `this.onSuccess()`.
	 * 
	 * > See XHR.prototype.isStatusOK() and XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @param {boolean} [asString] Return the error message instead of the error code (for simplified debugging)
	 * @return {number|string} Error code (see `XHR.prototype.ERR_*`) or message
	 */
	XHR.prototype.errorState = function(asString) {
		if (!this.status())
			return asString ? 'Connection failed' : this.ERR_CONNECTION;
		else if (!this.isStatusOK())
			return asString ? 'HTTP '+this.status() : this.ERR_HTTPSTATUS;
		else if (!this.isSuccessResponse())
			return asString ? 'Unexpected response body format' : this.ERR_BODYTYPE;
		else
			return asString ? 'No error' : this.ERR_NONE;
	};

	if (ENV_BROWSER) {

		// These methods are available in browser environment only:

		/**
		 * Send request, load response result text (`this.xhr.responseText`) into DOM element node.
		 * This clears the response type (`this.xhr.responseType`) and overwrites the previously installed event handler.
		 * If request fails then onError will be used:
		 * If onError is a function then the result of calling onError(this) will be used.
		 * If onError is not a function then its value will be used as is.
		 * 
		 * > Requires browser API.
		 * > XMLHttpRequest.responseText property is only available when XMLHttpRequest.responseType is "text" or empty.
		 * 
		 * @param {Element|string} node element object or CSS selector string
		 * @param {boolean} [showPreloader] call `this.showPreloader(node)` before request
		 * @param {string|function(XHR)} [onError] will be used if request fails
		 * @throws {Error} if node is neither an Element instance nor a string or if `document.querySelector(node)` fails
		 * @return {XHR} this
		 */
		XHR.prototype.loadInto = function(node, showPreloader, onError) {
			showPreloader && (typeof this.showPreloader == 'function') && this.showPreloader(node);
			this.responseType('').onReady(function() {
				if ((typeof node == 'string') && node.length)
					node = document.querySelector(node);
				if ((typeof node != 'object') || !(node instanceof Element))
					throw new Error('Invalid node element / CSS selector');
				if (this.isStatusOK())
					node.innerHTML = this.xhr.responseText;
				else if (typeof onError == 'function')
					node.innerHTML = onError(this) || '';
				else
					node.innerHTML = onError || '';
			}).send();
			return this;
		};

		/**
		 * Show preloader `<div class="xhr_preloader"...>` in the DOM element node.
		 * It used by `this.loadInto()`. The caller can assign custom implementation to `XHR.prototype.showPreloader`.
		 * 
		 * > Requires browser API.
		 * 
		 * @type {function(Element|string):XHR}
		 * @param {Element|string} node element object or CSS selector string
		 * @return {XHR} this
		 */
		XHR.prototype.showPreloader = function(node) {
			if ((typeof node == 'string') && node.length)
				node = document.querySelector(node);
			if ((typeof node == 'object') && (node instanceof Element))
				node.innerHTML = '<div class="xhr_preloader" id="xhr_preloader_' + node.id +
					'" style="height:' + node.clientHeight + 'px;width:' + node.clientWidth + 'px;' +
					'margin:0px;padding:0px;"></div>';
			return this;
		};

	}; // if (ENV_BROWSER)

	// =========================================================================
	/* ## Exports ## */

	// Export XHR class constructor
	if (ENV_BROWSER)
		window[exportName] = XHR;
	else if (ENV_NODEJS)
		module.exports = XHR;
	else
		throw new Error('Unsupported environment');

})('XHR');
