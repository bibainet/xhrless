/**
 * # XHRLESS: write less, do more with XMLHttpRequest API. ########################
 * 
 * It is an abstraction layer over the **XMLHttpRequest** v2 API for browser/Node.JS environments.
 * 
 * @version    1.0.7 2017.12.31
 * @license    MIT
 * @copyright  Copyright © 2017 Alexander Bibanin https://github.com/bibainet
 * 
 * 
 * ## Installation ################################################################
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
 * ## Usage examples ##############################################################
 * 
 * The only exported name is `XHR`, the constructor function. It returns the `XHR` instance.
 * It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.
 * Mostly all of the methods of XHR prototype returns the reference to `XHR` (`this`), so the method calls can easily be chained:
 * `xhr = XHR(...).setHeader(...).responseType(...).onSuccess(...).send();`.
 * 
 * @example
 * ```javascript
 * XHR(url).setHeader('X-Test', 'OK').setTimeout(5e3).onTimeout(xhr => {
 *   alert('Request timed out: ' + xhr.url);
 * }).onReady(function(xhr) {
 *   // Request completed, regardless of errors
 *   if (this.isSuccessResponse()) // Check errors
 *     console.log('OK:', this.responseText());
 *   else
 *     console.warn('Failed:', this.url, this.errorState(true));
 * }).send(new FormData(document.querySelector('form')));
 * 
 * XHR(url, new FormData(form), 'POST')
 * .setData('reqTime', new Date())
 * .onSuccess(xhr => {
 *   // Request completed successfully
 *   console.log('OK:', xhr.response());
 * }, xhr => {
 *   // Something failed
 *   console.warn('Failed:', xhr.url, xhr.errorState(true));
 * }, xhr => {
 *   // Finally:
 *   submitButton.disabled = false;
 *   console.log((new Date()) - xhr.data.reqTime, 'msec');
 * }).send();
 * ```
 * 
 * ### Fetch JSON #################################################################
 * 
 * Call `.responseType('json')` on `XHR` instance before sending request.
 * When completed, call `.response()` to get the decoded response object.
 * 
 * @example
 * ```javascript
 * XHR(url_json).responseType('json').onSuccess(function success(xhr) {
 *   console.log('OK:', typeof this.response(), this.response());
 * }, function error(xhr) {
 *   console.warn('Failed:', this.url, this.errorState(true));
 * }).send();
 * ```
 * 
 * ### Using promises #############################################################
 *
 * Call `.promise()` instead of `.send()` to send the request and get the `Promise` object.
 * It will be resolved when request succeeded. It will be rejected for error responses.
 * 
 * @example
 * ```javascript
 * XHR(url).promise()
 *   .then( xhr=>console.log('OK:', xhr.responseText()))
 *   .catch(xhr=>console.warn('Failed:', xhr.url, xhr.errorState(!0)));
 * ```
 * 
 * ### Sending complex data structures as x-www-form-urlencoded ###################
 * 
 * Encode complex object/array to query string, send encoded result in request body
 * with 'application/x-www-form-urlencoded' content type. On the server side, the
 * structure will be automatically parsed and restored to it's original state.
 * Call `.loadQuery()` for that. URL encoding is performed by `.encodeQuery()`.
 * 
 * @example
 * ```javascript
 * // This will send 'sum[min]=100&sum[max]=200&filter[paid]=1&
 * // filter[status][0]=shipping&filter[status][1]=completed' request
 * // with 'Content-Type: application/x-www-form-urlencoded' header
 * // to '/orders/' endpoint:
 * var query = {
 *   sum: { min: 100, max: 200 },
 *   filter: {
 *     paid: 1,
 *     status: ['shipping', 'completed']
 *   }
 * };
 * XHR('/orders/').loadQuery(query).onSuccess(handler).send();
 * ```
 * 
 * ### XHR instances are reusable #################################################
 * 
 * The `XHR` instance, once created, can be reused several times.
 * 
 * @example
 * ```javascript
 * // Create and configure the XHR instance
 * const req = XHR().onReady(handler)
 *   .setTimeout(5e3).setHeader('X-Test', 'OK');
 * // Set/reset target URL, send POST
 * req.reset(url).send(body1);
 * // Send another POST
 * req.send(body2);
 * ```
 * 
 * ### Methods that works in browser only (DOM API required) ######################
 * 
 * Call `.loadInto()` to quickly load the response text into the DOM element.
 * 
 * @example
 * ```javascript
 * XHR(url).loadInto(document.querySelector('#target'), true, 'Request failed');
 * XHR(url).loadInto('#target', 'Loading...', xhr => 'Error: ' + xhr.errorState(true));
 * XHR(url).loadInto(inputElement);
 * ```
 * 
 * Call `.loadForm()` to load the URL, method and request body from HTML form element.
 * 
 * @example
 * ```javascript
 * XHR().loadForm(document.querySelector('#form')).formValue('field', 'value').send();
 * XHR().loadForm('#form').onSuccess(xhr => console.log('Posted to', xhr.url)).send();
 * ```
 * 
 * 
 * ## API documentation ###########################################################
 * 
 * The source code is well documented. All exported names has a detailed doc-comment description.
 */

// @ts-check

(function(exportName) {

	// Error messages: throw new Error(ERR_*);
	const ERR_NO_XHR_API       = 'XMLHttpRequest is not defined in this environment';
	const ERR_ENVIRONMENT      = 'Unsupported environment';
	const ERR_ELEMENT_SELECTOR = 'Invalid element / CSS selector';

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
			(typeof XMLHttpRequest.prototype._restrictedHeaders == 'object') && ['cookie','cookie2','referer','user-agent'].forEach(name => delete(XMLHttpRequest.prototype._restrictedHeaders[name]));
		} else {
			throw new Error(ERR_NO_XHR_API);
		};
	};

	/**
	 * `XHR` class constructor. Creates the `XHR` instance.
	 * 
	 * It can be called as `new XHR(...)` or just as `XHR(...)`, in which case the result of `new XHR(...)` will be returned transparently.
	 * 
	 * All arguments are optional, so they can be set later by calling `XHR.prototype.reset()` or `XHR.prototype.loadForm()`.
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).send();
	 * XHR(url, 'data', 'PUT').send();
	 * XHR(formElement.action, new FormData(formElement)).send();
	 * XHR().loadForm(formElement).send();
	 * XHR().reset(url, 'data').send();
	 * ```
	 * @constructor
	 * 
	 * @param {string} [url]      Request URL
	 * @param {*}      [postData] The request body to send, if any. See `XHR.prototype.send()`.
	 * @param {string} [method]   Request method. If no method is set then it will be auto selected before sending the request depending on `this.postData` value.
	 * 
	 * @property {XMLHttpRequest} xhr      XMLHttpRequest instance. See <https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest> for more.
	 * @property {string}         method   Request method
	 * @property {string}         url      Request URL
	 * @property {*}              postData The request body to send, if any. See `XHR.prototype.send()`.
	 * @property {string}         userName User name for authentication
	 * @property {string}         password Password for authentication
	 * @property {object}         headers  The set of headers to send with request
	 * @property {object}         data     The set of arbitrary key-value pairs associated with the object. See `XHR.prototype.setData()`.
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
	 * @static
	 * @x-id const XHR.prototype.ERR_*
	 * @x-rowspan javascript
	 */
	XHR.prototype.ERR_NONE       = 0; // No error
	XHR.prototype.ERR_CONNECTION = 1; // Connection failed
	XHR.prototype.ERR_HTTPSTATUS = 2; // HTTP response status code is not 2XX
	XHR.prototype.ERR_BODYTYPE   = 3; // Unable to parse the response body according to responseType

	/**
	 * Get string representation: method, url, status
	 */
	XHR.prototype.toString = function() {
		return `[object XHR] ${this.method ? this.method : (this.postData ? 'POST' : 'GET')} ${this.url ? this.url : '-'} ${this.readyState()} ${this.status()}`;
	}

	/**
	 * Set/reset the new URL, method and request body (.url, .method and .postData properties).
	 * 
	 * > See XHR class constructor and XHR.prototype.loadForm() for more.
	 * 
	 * @param {string} url        Request URL
	 * @param {*}      [postData] The request body to send, if any. See `XHR.prototype.send()`.
	 * @param {string} [method]   Request method. If no method is set then it will be auto selected before sending the request depending on `this.postData` value.
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
	 * Set/clear request timeout (`this.xhr.timeout`), milliseconds.
	 * 
	 * > See XHR.prototype.onTimeout().
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
	 * It is a set of arbitrary key-value pairs associated with this instance, it can be referred from callback functions.
	 * The name should be a non empty string. If the value is undefined then `this.data[name]` will be removed.
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
	 * If the value is not a string or it is empty then `this.headers[name]` will be removed from the headers list.
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
	 * Current headers will always be removed before copying.
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
	 * Otherwise the "Cookie" header will be completely removed from the headers list.
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

	/**
	 * Encode complex object/array queryValues to query string (x-www-form-urlencoded) using `XHR.prototype.encodeQuery()`,
	 * use encoded result as request body (assign it to `this.postData`). Set 'Content-Type: application/x-www-form-urlencoded' header.
	 * 
	 * This allows to send complex data structures using the standard x-www-form-urlencoded encoding method.
	 * On the server side, the structure will be automatically parsed and restored to it's original state.
	 * 
	 * > URL-encoded data does not contain any information about types.
	 * > By default, all primitive values will be decoded as string on server side.
	 * > See XHR.prototype.encodeQuery() for more.
	 * 
	 * @example
	 * ```javascript
	 * var query = {
	 *   sum: { min: 100, max: 200 },
	 *   filter: {
	 *     paid: 1,
	 *     status: ['shipping', 'completed']
	 *   }
	* };
	 * XHR('/orders/').loadQuery(query).onSuccess(handler).send();
	 * ```
	 * @param {object|array} queryValues Arbitrary values to send in request body (URL-encoded)
	 * @return {XHR} this
	 */
	XHR.prototype.loadQuery = function(queryValues) {
		this.postData = XHR.prototype.encodeQuery(queryValues);
		this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
		return this;
	};

/** ## Event handlers ############################################################## */

	/**
	 * Inside the any event handler the `this` keyword is always referred to `XHR` instance (except arrow functions and promises).
	 * The first argument for any callback is also an `XHR` instance (the same as `this`).
	 * It allows the caller to use promises and arrow functions where `this` reference is always inherited from the caller scope.
	 * 
	 * The handlers set with `.onChange`, `.onReady`, `.onSuccess`, `.promise` will overwrite each other,
	 * because all of them are internally assigned to `this.xhr.onreadystatechange`.
	 */

	/**
	 * Set/clear request timeout event handler (`this.xhr.ontimeout`).
	 * 
	 * > See XHR.prototype.setTimeout().
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).setTimeout(5e3).onTimeout(function(xhr) {
	 *   alert('Request timed out after '+this.xhr.timeout+'ms');
	 * }).send();
	 * ```
	 * @param {function(this:XHR,XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onTimeout = function(handler) {
		this.xhr.ontimeout = (typeof handler == 'function')
			? (event) => handler.call(this, this)
			: null;
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
	 *     // Request completed
	 *     if (this.isSuccessResponse()) // Check errors
	 *       console.log('OK:', this.response());
	 *     else
	 *       console.warn('Failed:', this.url, this.errorState(true));
	 * }).send();
	 * ```
	 * @param {function(this:XHR,XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onChange = function(handler) {
		this.xhr.onreadystatechange = (typeof handler == 'function')
			? (event) => handler.call(this, this)
			: null;
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
	 *   if (xhr.isSuccessResponse()) // Check errors
	 *     console.log('OK:', xhr.response());
	 *   else
	 *     console.warn('Failed:', xhr.url, xhr.errorState(true));
	 * }).send();
	 * ```
	 * @param {function(this:XHR,XHR)} [handler]
	 * @return {XHR} this
	 */
	XHR.prototype.onReady = function(handler) {
		this.xhr.onreadystatechange = (typeof handler == 'function')
			? (event) => this.isCompleted() && handler.call(this, this)
			: null;
		return this;
	};

	/**
	 * Set/clear `this.xhr.onreadystatechange` event handlers for `this.xhr.readyState` == `XMLHttpRequest.DONE` event.
	 * The successHandler(this) will be called on success. errorHandler(this) will be called on errors. Finally, the finalHandler(this) will always be called.
	 * All arguments are optional. Call `onSuccess()` with no arguments to clear `this.xhr.onreadystatechange`.
	 * 
	 * > See XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).onSuccess(function success(xhr) {
	 *   // Request completed successfully
	 *   console.log('OK:', this.response());
	 * }, function error(xhr) {
	 *   // Something failed
	 *   console.warn('Failed:', this.url, this.errorState(true));
	 * }, function final(xhr) {
	 *   // Finally:
	 *   submitButton.disabled = false;
	 * }).send();
	 * 
	 * XHR(url).onSuccess(null, null, xhr=>console.log('Completed')).send();
	 * ```
	 * @param {function(this:XHR,XHR)} [successHandler] will be called on success
	 * @param {function(this:XHR,XHR)} [errorHandler] will be called on errors
	 * @param {function(this:XHR,XHR)} [finalHandler] will always be called
	 * @return {XHR} this
	 */
	XHR.prototype.onSuccess = function(successHandler, errorHandler, finalHandler) {
		successHandler = (typeof successHandler == 'function') ? successHandler : null;
		errorHandler   = (typeof errorHandler   == 'function') ? errorHandler   : null;
		finalHandler   = (typeof finalHandler   == 'function') ? finalHandler   : null;
		this.xhr.onreadystatechange = (successHandler || errorHandler || finalHandler) ? (event) => {
			if (this.isCompleted()) {
				if (this.isSuccessResponse())
					successHandler && successHandler.call(this, this);
				else
					errorHandler && errorHandler.call(this, this);
				finalHandler && finalHandler.call(this, this);
			};
		} : null;
		return this;
	};

	/**
	 * Send request and return the `Promise` object.
	 * It will be resolved when request succeeded. It will be rejected for error responses.
	 * The `XHR` instance (`this`) will be passed to `resolve`/`reject` callbacks.
	 * 
	 * > See XHR.prototype.send() and XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @example
	 * ```javascript
	 * XHR(url).promise()
	 *   .then( xhr=>console.log('OK:', xhr.responseText()))
	 *   .catch(xhr=>console.warn('Failed:', xhr.url, xhr.errorState(!0)));
	 * ```
	 * @param {*} [postData] The request body to send, if any. It will be used instead of `this.postData`.
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

/** ## The wrappers for XMLHttpRequest properties/methods ########################## */

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
	 * Send request, use predefined URL, method, headers and body.
	 * 
	 * 1. Call `this.xhr.open(this.method, this.url, true, this.userName, this.password)`;
	 * 2. Send headers defined in `this.headers` by calling `this.xhr.setRequestHeader()`;
	 * 3. Send request body (`postData` or `this.postData`, if any) by calling `this.xhr.send()`;
	 * 
	 * If `this.method` is empty then the method will be auto selected from "GET" or "POST" depending on body.
	 * If the one of the `postData` or `this.postData` is not empty then it will be passed to `this.xhr.send()`.
	 * 
	 * @param {*} [postData] The request body to send, if any. It will be used instead of `this.postData`.
	 * @return {XHR} this
	 */
	XHR.prototype.send = function(postData) {
		if (postData || this.postData) {
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

/** ## User-level helper methods ################################################### */

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
	 * Get the reason of request failure, the error code (e.g. `XHR.prototype.ERR_HTTPSTATUS`) or 0.
	 * It should be called when the response is completed, from the handler set by `XHR.prototype.onReady()` for example.
	 * It always returns 0 if called from the handler which was set by `XHR.prototype.onSuccess()`.
	 * 
	 * > See XHR.prototype.isStatusOK() and XHR.prototype.isSuccessResponse() for more.
	 * 
	 * @param {boolean} [asString] Return the error message instead of the error code (for simplified debugging)
	 * @return {number|string} Error code (see `XHR.prototype.ERR_*`) or message
	 */
	XHR.prototype.errorState = function(asString) {
		if (!this.status())
			return asString ? 'Connection failed' : XHR.prototype.ERR_CONNECTION;
		else if (!this.isStatusOK())
			return asString ? 'HTTP '+this.status() : XHR.prototype.ERR_HTTPSTATUS;
		else if (!this.isSuccessResponse())
			return asString ? 'Unexpected response body format' : XHR.prototype.ERR_BODYTYPE;
		else
			return asString ? 'No error' : XHR.prototype.ERR_NONE;
	};

	/**
	 * Encode arbitrary object/array (recursive) or any plain value to URL query string which is suitable
	 * for URLs or POST requests with 'application/x-www-form-urlencoded' content type.
	 * This allows to send complex data structures using the standard x-www-form-urlencoded encoding method.
	 * 
	 * > See XHR.prototype.loadQuery().
	 * 
	 * @example
	 * ```javascript
	 * XHR.prototype.encodeQuery( { "a":"A", "b":"B" } ) == 'a=A&b=B';
	 * XHR.prototype.encodeQuery( { "a": { "b": { "c":"V1" } }, "d": [ { "e":"V2" } ] }, '', ' & ', true ) == 'a[b][c]=V1 & d[0][e]=V2';
	 * XHR.prototype.encodeQuery( { "a":"A", "b":"B" }, 'form', '&amp;', true ) == 'form[a]=A&amp;form[b]=B';
	 * ```
	 * @static  It can be called directly from prototype without creating object instance
	 * @param {*} value The value to encode
	 * @param {string} [prefix] The name (key or index) of the value in parent object, used in recursive calls (see example)
	 * @param {string} [sep] Resulting query arguments separator (defaults is '&')
	 * @param {boolean} [rawKeys] Do not URL-encode arguments names (keys), return 'obj[key]=x%20y' instead of 'obj%5Bkey%5D=x%20y'
	 * @return {string} Query string where arguments are separated by sep or by '&'
	 */
	XHR.prototype.encodeQuery = function(value, prefix, sep, rawKeys) {
		var withPrefix = typeof prefix == 'string' && prefix.length > 0;
		if (typeof value != 'object')
			return (withPrefix ? (rawKeys ? prefix : encodeURIComponent(prefix))+'=' : '') + encodeURIComponent(value);
		var query = [];
		if (value instanceof Array) {
			for (var i = 0, l = value.length; i < l; ++i)
				query.push(XHR.prototype.encodeQuery(value[i], withPrefix ? prefix+'['+i+']' : i.toString(), sep, rawKeys));
		} else {
			for (var key in value) if (value.hasOwnProperty(key))
				query.push(XHR.prototype.encodeQuery(value[key], withPrefix ? prefix+'['+key+']' : key, sep, rawKeys));
		};
		return query.join(typeof sep == 'string' && sep.length ? sep : '&');
	};

/** ## Methods that works in browser only (DOM API required) ####################### */

	if (ENV_BROWSER) {

		/**
		 * Send request, load response result text (`this.xhr.responseText`) into DOM element (`element.value` or `element.innerHTML`).
		 * This clears the response type (`this.xhr.responseType`) and overwrites the previously installed event handler.
		 * If request fails then onError will be used:
		 * If onError is a function then the result of calling onError(this) will be used.
		 * If onError is not a function then its value will be used as is.
		 * 
		 * > Requires DOM (browser) API.
		 * > XMLHttpRequest.responseText property is only available when XMLHttpRequest.responseType is "text" or empty.
		 * 
		 * @example
		 * ```javascript
		 * XHR(url).loadInto(document.querySelector('#target'), true, 'Request failed');
		 * XHR(url).loadInto('#target', 'Loading...', xhr => 'Error: ' + xhr.errorState(true));
		 * XHR(url).loadInto(inputElement);
		 * ```
		 * @param {Element|string} element Element instance or CSS selector string
		 * @param {boolean|string} [preloading] If not empty, call `this.showPreloader(element[, preloading])` before request
		 * @param {string|function(XHR)} [onError] Will be used if request fails
		 * @throws {Error} if element is neither an Element instance nor a string or if `document.querySelector(element)` fails
		 * @return {XHR} this
		 */
		XHR.prototype.loadInto = function(element, preloading, onError) {
			(typeof element == 'string') && (element = document.querySelector(element));
			if ((typeof element != 'object') || !(element instanceof Element))
				throw new Error(ERR_ELEMENT_SELECTOR);
			preloading && this.showPreloader(element, (typeof preloading == 'string') ? preloading : '');
			return this.responseType('').onReady(function XHR_loadInto_onReady() {
				// @ts-ignore
				element[('value' in element) ? 'value' : 'innerHTML'] = this.isStatusOK()
					? this.xhr.responseText
					: ((typeof onError == 'function') ? onError(this) : onError) || '';
			}).send();
		};

		/**
		 * Show preloader in the DOM element.
		 * Set element.innerHTML = `<div class="xhr_preloader"...>message</div>`. For input elements set element.value = message.
		 * It used by `XHR.prototype.loadInto()`. The caller can assign custom implementation to `XHR.prototype.showPreloader`.
		 * 
		 * > Requires DOM (browser) API.
		 * 
		 * @type {function(Element|string,string?):XHR}
		 * @param {Element|string} element Element instance or CSS selector string
		 * @param {string} [message] Custom 'loading...' message
		 * @throws {Error} if element is neither an Element instance nor a string or if `document.querySelector(element)` fails
		 * @return {XHR} this
		 */
		XHR.prototype.showPreloader = function(element, message) {
			(typeof element == 'string') && (element = document.querySelector(element));
			if ((typeof element != 'object') || !(element instanceof Element))
				throw new Error(ERR_ELEMENT_SELECTOR);
			if (typeof message != 'string')
				message = '';
			if ('value' in element)
				element['value'] = message;
			else
				element['innerHTML'] = `<div class="xhr_preloader" id="xhr_preloader_${element.id}" style="height:${element.clientHeight}px;width:${element.clientWidth}px;">${message}</div>`;
			return this;
		};

		/**
		 * Load URL, method and request body from HTML form element.
		 * It calls `this.reset(formElement.action, new FormData(formElement), formElement.method || 'POST')`.
		 * The request body (this.postData) will always be set to new FormData() regardless of form's method.
		 * 
		 * > Requires DOM (browser) API.
		 * > See XHR.prototype.formValue().
		 * 
		 * @example
		 * ```javascript
		 * XHR().loadForm(document.querySelector('#form')).formValue('field', 'value').send();
		 * XHR().loadForm('#form').onSuccess(xhr => console.log('Posted to', xhr.url)).send();
		 * ```
		 * @param {HTMLFormElement|string} formElement HTML form element or CSS selector which points to the form
		 * @throws {Error} if formElement is neither an HTMLFormElement instance nor a string or if `document.querySelector(formElement)` fails
		 * @return {XHR} this
		 */
		XHR.prototype.loadForm = function(formElement) {
			// @ts-ignore
			(typeof formElement == 'string') && (formElement = document.querySelector(formElement));
			if ((typeof formElement != 'object') || !(formElement instanceof HTMLFormElement))
				throw new Error(ERR_ELEMENT_SELECTOR);
			return this.reset(formElement.action, new FormData(formElement), formElement.method || 'POST');
		}

		/**
		 * Add value into `this.postData` as `FormData`.
		 * If `this.postData` is not a `FormData` instance then it will be overwritten with `new FormData()`.
		 * Calling `.formValue()` several times with the same name will append several values under the single name.
		 * If the value is undefined then all values stored under this name will be deleted.
		 * Empty names are ignored.
		 * 
		 * > Requires DOM (browser) API.
		 * > See https://developer.mozilla.org/en-US/docs/Web/API/FormData/append for more.
		 * 
		 * @param {string} name
		 * @param {*} [value]
		 * @param {string} [fileName]
		 * @return {XHR} this
		 */
		XHR.prototype.formValue = function(name, value, fileName) {
			if ((typeof name != 'string') || !name.length)
				return this;
			if ((typeof this.postData != 'object') || !(this.postData instanceof FormData))
				this.postData = new FormData();
			if (value === undefined)
				this.postData.delete(name);
			else if (typeof fileName == 'string')
				this.postData.append(name, value, fileName);
			else
				this.postData.append(name, value);
			return this;
		}

	}; // if (ENV_BROWSER)

/* ## Exports ##################################################################### */

	if (ENV_BROWSER) window[exportName] = XHR;
	else if (ENV_NODEJS) module.exports = XHR;
	else throw new Error(ERR_ENVIRONMENT);

})('XHR');
