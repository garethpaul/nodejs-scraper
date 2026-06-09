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

function scraperWithRequest(fakeRequest) {
	return scraperModule.createScraper({
		request: fakeRequest,
		jsdom: {
			jsdom: function() {
				return {
					createWindow: function() {
						return {};
					}
				};
			},
			jQueryify: function(window, path, callback) {
				callback(window, function() {
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
		}
	});
}

test('normalizes string request options', function(done) {
	var options = scraperModule.normalizeRequestOptions('https://example.com');

	assert.equal(options.uri, 'https://example.com');
	assert.equal(options.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
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
