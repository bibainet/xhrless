/**
 * XHRLESS examples
 */

const XHR = require('../xhrless.js');

const url = 'http://localhost/xhrless/example/ajax.php?q='+Math.floor((Math.random()*1e8)),
	url_error = url + '&error',
	url_json = url + '&json',
	url_json_invalid = url_json + '&invalid',
	url_headers = url + '&headers',
	url_cookies = url + '&cookies';

function showError(xhr) {
	console.log('! Error: (' + xhr.errorState() + '):', xhr.errorState(true));
};

function showText(xhr) {
	console.log(xhr.responseText());
};

function jsonReady(xhr) {
	console.log('.response:     ' + (typeof this.response()) + ' ' + JSON.stringify(this.response()));
	console.log('.responseText: ' + (this.responseType() == '' ? typeof this.responseText() + ' ' + this.responseText() : '-'));
	console.log('Content-Type:  ' + this.responseHeader('Content-Type'));
};

async function awaitResponseAndShow(url) {
	try {
		showText(await XHR(url).promise());
	} catch (e) {
		if (e instanceof XHR)
			showError(e);
		else
			throw e;
	};
};

XHR.prototype.setFormCT = function() {
	return this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
};

const examples = [

	// .onReady().send()
	()=>XHR(url).onReady(console.log).send(),
	()=>XHR(url).onReady(function(){showText(this)}).send(),
	()=>XHR(url).onReady(x=>showText(x)).send(),
	()=>XHR(url).onReady(showText).send(),
	()=>XHR(url).onReady(showText).onReady().send(),
	()=>XHR(url).onReady(function(){this.isStatusOK()?showText(this):showError(this)}).send(),
	()=>XHR(url_error).onReady(function(){this.isStatusOK()?showText(this):showError(this)}).send(),
	()=>XHR(url).setTimeout(200).onTimeout(function(){console.log('Timed out after '+this.xhr.timeout+'ms')}).send(),

	// .onSuccess().send()
	()=>XHR(url      ).onSuccess(function(){showText(this)}, function(){showError(this)}).send(),
	()=>XHR(url_error).onSuccess(function(){showText(this)}, function(){showError(this)}).send(),
	()=>XHR(url      ).onSuccess(        x=>showText(x),             x=>showError(x)    ).send(),
	()=>XHR(url_error).onSuccess(        x=>showText(x),             x=>showError(x)    ).send(),
	()=>XHR(url      ).onSuccess(           showText,                   showError       ).send(),
	()=>XHR(url_error).onSuccess(           showText,                   showError       ).send(),
	()=>XHR(url      ).onSuccess(           showText                                    ).send(),
	()=>XHR(url_error).onSuccess(             null,                     showError       ).send(),
	()=>XHR(url      ).onSuccess(                                                       ).send(),
	()=>XHR(url      ).onSuccess(           showText,       showError       ).onSuccess().send(),
	()=>XHR(url      ).onSuccess(showText, showError, x=>console.log('Done')).send(),
	()=>XHR(url_error).onSuccess(showText, showError, x=>console.log('Done')).send(),
	()=>XHR(url      ).onSuccess(null, null, x=>console.log('Done')).send(),

	// With POST
	()=>XHR(url, 'q=1234')        .setFormCT().onSuccess(showText, showError).send(),
	()=>XHR(url)                  .setFormCT().onSuccess(showText, showError).send('q=1234'),
	()=>XHR().reset(url, 'q=1234').setFormCT().onSuccess(showText, showError).send(),

	// .responseType('json').onReady().send()
	()=>XHR(url_json).responseType('json').onReady(jsonReady).send(),
	()=>XHR(url_json, 'q=1234').setFormCT().responseType('json').onReady(jsonReady).send(),
	()=>XHR(url_json).onReady(jsonReady).send(),
	()=>XHR(url_json_invalid).responseType('json').onReady(jsonReady).send(),
	()=>XHR(url_error).responseType('json').onReady(jsonReady).send(),

	// .responseType('json').onSuccess().send()
	()=>XHR(url_json).responseType('json').onSuccess(jsonReady, showError).send(),
	()=>XHR(url_json, 'q=1234').setFormCT().responseType('json').onSuccess(jsonReady, showError).send(),
	()=>XHR(url_json).onSuccess(jsonReady, showError).send(),
	()=>XHR(url_json_invalid).responseType('json').onSuccess(jsonReady, showError).send(),
	()=>XHR(url_error).responseType('json').onSuccess(jsonReady, showError).send(),

	// .promise().then().catch(), async/await
	()=>XHR(url)          .promise().then(function(x){showText(x)}).catch(function(x){showError(x)}),
	()=>XHR(url_error)    .promise().then(function(x){showText(x)}).catch(function(x){showError(x)}),
	()=>XHR(url)          .promise().then(x=>showText(x))          .catch(x=>showError(x)),
	()=>XHR(url_error)    .promise().then(x=>showText(x))          .catch(x=>showError(x)),
	()=>XHR(url, 'q=1234').setFormCT().promise().then(showText).catch(showError),
	()=>XHR(url).setFormCT().promise('q=1234')  .then(showText).catch(showError),
	()=>XHR(url_error).promise(), // throws

	// .promise(), async/await
	()=>awaitResponseAndShow(url),
	()=>awaitResponseAndShow(url_error),

	// .abort()
	()=>XHR(url).onChange(x=>{if (x.readyState()==2) x.abort(); if (x.readyState()==4) if (x.isSuccessResponse()) showText(x); else showError(x);}).send(),
	()=>{var x=XHR(url).onSuccess(showText, showError).send(); setTimeout(()=>x.abort(), 200);},

	// .setData(), .setHeader(), .setHeaders(), .responseHeaders(), .responseHeader()
	()=>XHR(url).setData('one', 1).setData('two', 2).setData('three', 3).setData('two').onReady(x=>console.log(JSON.stringify(x.data))).send(), // '{one:1,three:3}'
	()=>XHR(url_headers).setHeader('X-One', '1').setHeader('X-Two', '2').setHeader('X-Three', '3').setHeader('X-Two').onSuccess(showText, showError).send(), // X-One:1 X-Three:3
	()=>XHR(url_headers).setHeaders({'X-One':'1','X-Two':'','X-Three':'3'}).onSuccess(showText, showError).send(), // X-One:1 X-Three:3
	()=>XHR(url).onSuccess(x=>console.log(x.responseHeaders()+"\n\n"+JSON.stringify(x.responseHeaders(true))+"\n\nCT: "+x.responseHeader('Content-type')), showError).send(),

	// .setCookie(), .setCookies() (does not work in browser)
	()=>XHR(url_cookies).setCookie('C-One', '1').setCookie('C-Two', '').setCookie('C-Three', '3').onSuccess(showText, showError).send(), // C-One=1 C-Three=3
	()=>XHR(url_cookies).setCookies({'C-One':'1','C-Two':'','C-Three':'3'}).onSuccess(showText, showError).send(), // C-One=1 C-Three=3
	()=>XHR(url_cookies).setCookies({'C-One':'1'}).setCookies().onSuccess(showText, showError).send(), // empty

];

if (process.argv.length <= 2) {
	examples.forEach( (example, iExample) => console.log('('+(iExample+1)+')', example.toString().substr(4)) );
	console.log("\nUsage:", require('path').basename(process.argv[1]), '[index]');
	process.exit(2);
};

const iExample = parseInt(process.argv[2]);

if (isNaN(iExample) || iExample < 1 || iExample > examples.length) {
	console.log('Incorrect index '+process.argv[2]+'. Expected [1..'+examples.length+'].');
	process.exit(2);
};

const example = examples[iExample-1];

if (typeof example != 'function') {
	console.log('The type of example #'+iExample+' is not a function');
	process.exit(2);
};

console.log('('+iExample+')', example.toString().substr(4));
example();
