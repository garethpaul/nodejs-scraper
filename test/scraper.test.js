var assert = require('assert');
var scraperModule = require('../lib/scraper');

var tests = [];

function test(name, fn) {
	tests.push({ name: name, fn: fn });
}

function run(index) {
	if (index >= tests.length) {
		return;
	}

	var current = tests[index];
	var finished = false;
	function done(err) {
		if (finished) {
			return;
		}
		finished = true;
		if (err) {
			console.error(current.name + ': ' + err.stack);
			process.exit(1);
			return;
		}
		run(index + 1);
	}

	try {
		current.fn(done);
	} catch (err) {
		done(err);
	}
}

function scraperWithRequest(fakeRequest, fakeCreateDocument, extraDeps) {
	var deps = {
		request: fakeRequest,
		createDocument: fakeCreateDocument || function(body, callback) {
			callback(null, function() {
					return {
						append: function() { return this; },
						find: function() {
							return {
								html: function() { return ''; }
							};
						},
						html: function() { return ''; },
						text: function() { return 'Example Domain'; },
						length: 1
					};
			});
		}
	};
	Object.keys(extraDeps || {}).forEach(function(key) {
		deps[key] = extraDeps[key];
	});
	return scraperModule.createScraper(deps);
}

test('normalizes string request options', function(done) {
	var options = scraperModule.normalizeRequestOptions('https://example.com');

	assert.equal(options.uri, 'https://example.com');
	assert.equal(options.timeout, 10000);
	assert.equal(options.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
});

test('normalizes request timeouts', function(done) {
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: 2500
	}).timeout, 2500);
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: '1500'
	}).timeout, 1500);
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: 0
	}).timeout, 10000);
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: Infinity
	}).timeout, 10000);
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: true
	}).timeout, 10000);
	assert.equal(scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		timeout: '   '
	}).timeout, 10000);
	done();
});

test('dispatches bounded request timeouts', function(done) {
	var receivedOptions;
	var scraper = scraperWithRequest(function(options, callback) {
		receivedOptions = options;
		process.nextTick(function() {
			callback(new Error('network failed'), null, undefined);
		});
	});

	scraper('https://example.com', function(err) {
		assert(err);
		assert.equal(receivedOptions.timeout, 10000);
		done();
	});
});

test('does not mutate request options', function(done) {
	var original = { uri: 'https://example.com', headers: { Accept: 'text/html' } };
	var normalized = scraperModule.normalizeRequestOptions(original);

	assert.equal(original.headers['User-Agent'], undefined);
	assert.equal(normalized.headers.Accept, 'text/html');
	assert.equal(normalized.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
});

test('ignores non-object request headers', function(done) {
	var stringHeaders = scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		headers: 'Accept: text/html'
	});
	var arrayHeaders = scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		headers: ['Accept: text/html']
	});

	assert.equal(stringHeaders.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	assert.equal(stringHeaders.headers['0'], undefined);
	assert.equal(arrayHeaders.headers['0'], undefined);
	done();
});

test('drops unsafe request headers', function(done) {
	var options = scraperModule.normalizeRequestOptions({
		uri: 'https://example.com',
		headers: {
			Accept: 'text/html',
			'X-Bad\r\nInjected': 'ok',
			'X-Bad-Value': 'ok\r\nInjected: yes',
			'X-Empty': null
		}
	});

	assert.equal(options.headers.Accept, 'text/html');
	assert.equal(options.headers['X-Bad\r\nInjected'], undefined);
	assert.equal(options.headers['X-Bad-Value'], undefined);
	assert.equal(options.headers['X-Empty'], undefined);
	assert.equal(options.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
});

test('does not mutate fetch options', function(done) {
	var fetchOptions = {};
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper('https://example.com', function(err) {
		assert.ifError(err);
		assert.equal(fetchOptions.reqPerSec, undefined);
		done();
	}, fetchOptions);
});

test('rejects oversized response bodies before parsing', function(done) {
	var parsed = false;
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, Buffer.alloc(1024 * 1024 + 1, 'a'));
		});
	}, function() {
		parsed = true;
		throw new Error('oversized body reached parser');
	});

	scraper('https://example.com', function(err, $) {
		assert(err);
		assert.equal(err.message, 'Response body exceeds maxBodyBytes limit of 1048576 bytes.');
		assert.equal($, null);
		assert.equal(parsed, false);
		done();
	});
});

test('measures response body limits in utf8 bytes', function(done) {
	var parsed = false;
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, 'éé');
		});
	}, function() {
		parsed = true;
		throw new Error('oversized body reached parser');
	});

	scraper('https://example.com', function(err) {
		assert(err);
		assert.equal(err.message, 'Response body exceeds maxBodyBytes limit of 3 bytes.');
		assert.equal(parsed, false);
		done();
	}, { maxBodyBytes: 3 });
});

test('accepts buffer response bodies within the parse limit', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, Buffer.from('<html><head></head><body>ok</body></html>'));
		});
	});

	scraper('https://example.com', function(err, $) {
		assert.ifError(err);
		assert($);
		done();
	}, { maxBodyBytes: 1024 });
});

test('measures buffer limits before utf8 decoding', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, Buffer.from([0xff, 0xff]));
		});
	});

	scraper('https://example.com', function(err, $) {
		assert.ifError(err);
		assert($);
		done();
	}, { maxBodyBytes: 2 });
});

test('rejects unsupported response body types before parsing', function(done) {
	var parsed = false;
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, { html: '<body>no</body>' });
		});
	}, function() {
		parsed = true;
		throw new Error('unsupported body reached parser');
	});

	scraper('https://example.com', function(err) {
		assert(err);
		assert.equal(err.message, 'Response body must be text or a buffer.');
		assert.equal(parsed, false);
		done();
	});
});

test('reports document parser errors', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><body>broken</body></html>');
		});
	}, function(body, callback) {
		callback(new Error('parser failed'), null);
	});

	scraper('https://example.com', function(err, $) {
		assert(err);
		assert.equal(err.message, 'parser failed');
		assert.equal($, null);
		done();
	});
});

test('parses successful responses with the maintained document adapter', function(done) {
	var scraper = scraperModule.createScraper({
		request: function(options, callback) {
			process.nextTick(function() {
				callback(null, { statusCode: 200 }, [
					'<!doctype html><html><head><title>Maintained</title></head>',
					'<body><main id="content">Ready</main>',
					'<script>window.__scraperExecuted = true</script></body></html>'
				].join(''));
			});
		}
	});

	scraper('https://example.com', function(err, $) {
		assert.ifError(err);
		assert.equal($('title').text(), 'Maintained');
		assert.equal($('#content').text(), 'Ready');
		assert.equal($('script').length, 0);
		assert.equal($('nobreakage').length, 1);
		assert.equal($('body')[0].ownerDocument.defaultView.__scraperExecuted, undefined);
		done();
	});
});

test('falls back to the default parse limit for invalid overrides', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body>ok</body></html>');
		});
	});

	scraper('https://example.com', function(err, $) {
		assert.ifError(err);
		assert($);
		done();
	}, { maxBodyBytes: 0 });
});

test('does not coerce boolean parse limits', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body>ok</body></html>');
		});
	});

	scraper('https://example.com', function(err, $) {
		assert.ifError(err);
		assert($);
		done();
	}, { maxBodyBytes: true });
});

test('reports missing uri without calling request', function(done) {
	var called = false;
	var scraper = scraperWithRequest(function() {
		called = true;
	});

	scraper({}, function(err) {
		assert(err);
		assert.equal(called, false);
		done();
	});
});

test('rejects non-http request uri without calling request', function(done) {
	var called = false;
	var scraper = scraperWithRequest(function(options, callback) {
		called = true;
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper('file:///etc/passwd', function(err) {
		assert(err);
		assert(err.message.indexOf('http or https') !== -1);
		assert.equal(called, false);
		done();
	});
});

test('rejects http request uri without host without calling request', function(done) {
	var called = false;
	var scraper = scraperWithRequest(function(options, callback) {
		called = true;
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper('http://', function(err) {
		assert(err);
		assert(err.message.indexOf('http or https') !== -1);
		assert.equal(called, false);
		done();
	});
});

test('rejects http request uri with credentials without calling request', function(done) {
	var called = false;
	var scraper = scraperWithRequest(function(options, callback) {
		called = true;
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper('https://user:pass@example.com', function(err) {
		assert(err);
		assert(err.message.indexOf('http or https') !== -1);
		assert.equal(called, false);
		done();
	});
});

test('handles request errors without reading body', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(new Error('network failed'), null, undefined);
		});
	});

	scraper('https://example.com', function(err) {
		assert(err);
		assert.equal(err.message, 'network failed');
		done();
	});
});

test('handles non-200 responses without reading body', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, { statusCode: 503 }, undefined);
		});
	});

	scraper('https://example.com', function(err) {
		assert(err);
		assert(err.message.indexOf('503') !== -1);
		done();
	});
});

test('reports missing response metadata through the callback', function(done) {
	var parserCalled = false;
	var callbackCount = 0;
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(null, null, null);
		});
	}, function() {
		parserCalled = true;
	});

	scraper('https://example.com/missing-response', function(err, $, body) {
		callbackCount += 1;
		assert(err);
		assert.equal(err.message, 'Request to https://example.com/missing-response ended with status code: unknown');
		assert.equal($, null);
		assert.equal(body, null);
		assert.equal(parserCalled, false);
		process.nextTick(function() {
			assert.equal(callbackCount, 1);
			done();
		});
	});
});

test('does not skip queued requests', function(done) {
	var calledUris = [];
	var callbackCount = 0;
	var scraper = scraperWithRequest(function(options, callback) {
		calledUris.push(options.uri);
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper(['https://a.example', 'https://b.example', 'https://c.example'], function(err) {
		assert.ifError(err);
		callbackCount += 1;
		if (callbackCount === 3) {
			assert.deepEqual(calledUris, ['https://a.example', 'https://b.example', 'https://c.example']);
			done();
		}
	});
});

test('does not stall queued requests for non-positive reqPerSec', function(done) {
	var calledUris = [];
	var callbackCount = 0;
	var timeout = setTimeout(function() {
		done(new Error('non-positive reqPerSec stalled the queue'));
	}, 250);
	var scraper = scraperWithRequest(function(options, callback) {
		calledUris.push(options.uri);
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper(['https://a.example', 'https://b.example'], function(err) {
		assert.ifError(err);
		callbackCount += 1;
		if (callbackCount === 2) {
			clearTimeout(timeout);
			assert.deepEqual(calledUris, ['https://a.example', 'https://b.example']);
			done();
		}
	}, { reqPerSec: -1 });
});

test('spaces integer reqPerSec request starts without waiting for completion', function(done) {
	var calledUris = [];
	var responseCallbacks = [];
	var scheduled = [];
	var callbackCount = 0;
	var scraper = scraperWithRequest(function(options, callback) {
		calledUris.push(options.uri);
		responseCallbacks.push(callback);
	}, null, {
		schedule: function(callback, delay) {
			scheduled.push({ callback: callback, delay: delay });
		}
	});

	scraper(['https://a.example', 'https://b.example', 'https://c.example'], function(err) {
		assert.ifError(err);
		callbackCount += 1;
		if (callbackCount === 3) {
			done();
		}
	}, { reqPerSec: 2 });

	assert.deepEqual(calledUris, ['https://a.example']);
	assert.equal(scheduled.length, 1);
	assert.equal(scheduled[0].delay, 500);
	scheduled.shift().callback();
	assert.deepEqual(calledUris, ['https://a.example', 'https://b.example']);
	assert.equal(responseCallbacks.length, 2);
	assert.equal(scheduled.length, 1);
	assert.equal(scheduled[0].delay, 500);
	scheduled.shift().callback();
	assert.deepEqual(calledUris, ['https://a.example', 'https://b.example', 'https://c.example']);
	assert.equal(responseCallbacks.length, 3);
	assert.equal(scheduled.length, 0);
	responseCallbacks.forEach(function(callback) {
		callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
	});
});

test('delivers callbacks in completion order without waiting for earlier requests', function(done) {
	var responseCallbacks = {};
	var scheduled = [];
	var callbackBodies = [];
	var scraper = scraperWithRequest(function(options, callback) {
		responseCallbacks[options.uri] = callback;
	}, function(body, callback) {
		callback(null, function() {
			return { text: function() { return body; } };
		});
	}, {
		schedule: function(callback, delay) {
			scheduled.push({ callback: callback, delay: delay });
		}
	});

	scraper(['https://a.example', 'https://b.example'], function(err, $) {
		assert.ifError(err);
		callbackBodies.push($().text());
		if (callbackBodies.length === 2) {
			assert.deepEqual(callbackBodies, ['second', 'first']);
			done();
		}
	}, { reqPerSec: 2 });

	assert.equal(scheduled.length, 1);
	scheduled.shift().callback();
	responseCallbacks['https://b.example'](null, { statusCode: 200 }, 'second');
	assert.deepEqual(callbackBodies, ['second']);
	responseCallbacks['https://a.example'](null, { statusCode: 200 }, 'first');
});

test('supports fractional and numeric-string reqPerSec spacing', function(done) {
	[
		{ value: 0.5, delay: 2000 },
		{ value: '4', delay: 250 }
	].forEach(function(example) {
		var calledUris = [];
		var scheduled = [];
		var scraper = scraperWithRequest(function(options) {
			calledUris.push(options.uri);
		}, null, {
			schedule: function(callback, delay) {
				scheduled.push({ callback: callback, delay: delay });
			}
		});

		scraper(['https://a.example', 'https://b.example'], function() {}, {
			reqPerSec: example.value
		});
		assert.deepEqual(calledUris, ['https://a.example']);
		assert.equal(scheduled.length, 1);
		assert.equal(scheduled[0].delay, example.delay);
		scheduled[0].callback();
		assert.deepEqual(calledUris, ['https://a.example', 'https://b.example']);
	});
	done();
});

test('chunks reqPerSec spacing beyond the maximum timer delay', function(done) {
	var maxTimerDelay = 2147483647;
	var calledUris = [];
	var scheduled = [];
	var scraper = scraperWithRequest(function(options) {
		calledUris.push(options.uri);
	}, null, {
		schedule: function(callback, delay) {
			scheduled.push({ callback: callback, delay: delay });
		}
	});

	scraper(['https://a.example', 'https://b.example'], function() {}, {
		reqPerSec: 1000 / (maxTimerDelay + 500)
	});
	assert.deepEqual(calledUris, ['https://a.example']);
	assert.equal(scheduled.length, 1);
	assert.equal(scheduled[0].delay, maxTimerDelay);
	scheduled.shift().callback();
	assert.deepEqual(calledUris, ['https://a.example']);
	assert.equal(scheduled.length, 1);
	assert(Math.abs(scheduled[0].delay - 500) < 0.001);
	scheduled.shift().callback();
	assert.deepEqual(calledUris, ['https://a.example', 'https://b.example']);
	done();
});

test('treats invalid reqPerSec strings as unthrottled', function(done) {
	var calledUris = [];
	var scheduled = [];
	var scraper = scraperWithRequest(function(options) {
		calledUris.push(options.uri);
	}, null, {
		schedule: function(callback, delay) {
			scheduled.push({ callback: callback, delay: delay });
		}
	});

	scraper(['https://a.example', 'https://b.example'], function() {}, {
		reqPerSec: 'not-a-rate'
	});
	assert.deepEqual(calledUris, ['https://a.example', 'https://b.example']);
	assert.equal(scheduled.length, 0);
	done();
});

test('treats non-function callbacks as no-op', function(done) {
	var called = false;
	var scraper = scraperWithRequest(function(options, callback) {
		called = true;
		process.nextTick(function() {
			callback(null, { statusCode: 200 }, '<html><head></head><body></body></html>');
		});
	});

	scraper('https://example.com', 'not a callback');
	setTimeout(function() {
		assert.equal(called, true);
		done();
	}, 30);
});

run(0);
