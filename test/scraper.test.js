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
				callback(window, function() {});
			}
		}
	});
}

test('normalizes string request options', function(done) {
	var options = scraperModule.normalizeRequestOptions('http://example.com');

	assert.equal(options.uri, 'http://example.com');
	assert.equal(options.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
});

test('does not mutate request options', function(done) {
	var original = { uri: 'http://example.com', headers: { Accept: 'text/html' } };
	var normalized = scraperModule.normalizeRequestOptions(original);

	assert.equal(original.headers['User-Agent'], undefined);
	assert.equal(normalized.headers.Accept, 'text/html');
	assert.equal(normalized.headers['User-Agent'], 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)');
	done();
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

test('handles request errors without reading body', function(done) {
	var scraper = scraperWithRequest(function(options, callback) {
		process.nextTick(function() {
			callback(new Error('network failed'), null, undefined);
		});
	});

	scraper('http://example.com', function(err) {
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

	scraper('http://example.com', function(err) {
		assert(err);
		assert(err.message.indexOf('503') !== -1);
		done();
	});
});

run(0);
