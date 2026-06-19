var assert = require('assert');

var documentModule = require('../lib/document');

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

test('returns jQuery bound to parsed head and body content', function(done) {
	documentModule.createDocument(
		'<!doctype html><html><head><title>Example</title></head><body><main id="content">Hello</main></body></html>',
		function(err, $) {
			assert.ifError(err);
			assert.equal(typeof $, 'function');
			assert.equal($('title').text(), 'Example');
			assert.equal($('#content').text(), 'Hello');
			assert.equal($('main').length, 1);
			done();
		}
	);
});

test('repairs malformed HTML without executing inline scripts', function(done) {
	documentModule.createDocument(
		'<html><body><section><p>Open<script>window.__scraperExecuted = true</script>',
		function(err, $) {
			assert.ifError(err);
			var window = $('body')[0].ownerDocument.defaultView;
			assert.equal($('section p').contents().first().text(), 'Open');
			assert.equal(window.__scraperExecuted, undefined);
			done();
		}
	);
});

test('does not load external document resources', function(done) {
	documentModule.createDocument(
		'<html><body><img src="http://127.0.0.1:1/tracker.png"><iframe src="http://127.0.0.1:1/frame"></iframe></body></html>',
		function(err, $) {
			assert.ifError(err);
			assert.equal($('img').attr('src'), 'http://127.0.0.1:1/tracker.png');
			assert.equal($('iframe').attr('src'), 'http://127.0.0.1:1/frame');
			done();
		}
	);
});

test('reports parser construction errors through the callback', function(done) {
	function BrokenJSDOM() {
		throw new Error('parser failed');
	}

	documentModule.createDocument('<html></html>', function(err, $) {
		assert(err);
		assert.equal(err.message, 'parser failed');
		assert.equal($, null);
		done();
	}, {
		JSDOM: BrokenJSDOM,
		jQueryFactory: function() {
			throw new Error('factory must not run');
		}
	});
});

test('does not recast consumer callback exceptions as parser errors', function(done) {
	var callbacks = 0;
	var expected = new Error('consumer failed');
	process.once('uncaughtException', function(err) {
		assert.equal(err, expected);
		setImmediate(function() {
			assert.equal(callbacks, 1);
			done();
		});
	});

	documentModule.createDocument('<html></html>', function(err) {
		assert.ifError(err);
		callbacks += 1;
		throw expected;
	}, {
		JSDOM: function() {
			this.window = {};
		},
		jQueryFactory: function() {
			return function() {};
		}
	});
});

run(0);
