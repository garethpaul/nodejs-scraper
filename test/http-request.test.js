var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Readable = require('stream').Readable;

var transport = require('../lib/http-request');

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

function fakeDns(addresses) {
	return function(hostname, options, callback) {
		process.nextTick(function() {
			callback(null, addresses.map(function(address) {
				return { address: address, family: address.indexOf(':') === -1 ? 4 : 6 };
			}));
		});
	};
}

function fakeClient(responses, requests, options) {
	var clientOptions = options || {};
	return {
		request: function(options, onResponse) {
			var request = new EventEmitter();
			request.setTimeout = function(timeout, callback) {
				request.timeout = timeout;
				request.timeoutCallback = callback;
			};
			request.destroy = function(err) {
				process.nextTick(function() {
					request.emit('error', err);
				});
			};
			request.end = function() {
				requests.push(options);
				if (clientOptions.stallAfterRequest === requests.length) {
					return;
				}
				if (clientOptions.triggerTimeout) {
					process.nextTick(request.timeoutCallback);
					return;
				}
				options.lookup(options.hostname, { all: true }, function(err) {
					if (err) {
						request.emit('error', err);
						return;
					}
					var responseSpec = responses.shift();
					var response = new Readable({
						read: function() {
							var self = this;
							(responseSpec.chunks || []).forEach(function(chunk) {
								self.push(chunk);
							});
							self.push(null);
						}
					});
					response.statusCode = responseSpec.statusCode;
					response.headers = responseSpec.headers || {};
					onResponse(response);
				});
			};
			return request;
		}
	};
}

test('classifies public and blocked IP addresses', function(done) {
	assert.equal(transport.isPublicAddress('93.184.216.34'), true);
	assert.equal(transport.isPublicAddress('192.0.0.9'), true);
	assert.equal(transport.isPublicAddress('2606:2800:220:1:248:1893:25c8:1946'), true);
	assert.equal(transport.isPublicAddress('2001:3::1'), true);
	[
		'127.0.0.1', '10.0.0.1', '169.254.1.1', '192.168.1.1',
		'192.0.0.8', '192.0.2.1', '224.0.0.1', '::1', 'fc00::1',
		'fe80::1', '2001:2::1', '2001:db8::1', '3fff::1',
		'4000::1', '::ffff:127.0.0.1', '64:ff9b::7f00:1'
	].forEach(function(address) {
		assert.equal(transport.isPublicAddress(address), false, address);
	});
	done();
});

test('rejects reserved IPv6 literals outside global unicast before dispatch', function(done) {
	var requests = [];
	var client = fakeClient([], requests);
	var request = transport.createHttpRequest({ http: client, https: client });

	request({ uri: 'https://[4000::1]/admin', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 0);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects DNS answers outside IPv6 global unicast', function(done) {
	var requests = [];
	var client = fakeClient([], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['4000::1'])
	});

	request({ uri: 'https://reserved.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 1);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects redirects to IPv6 addresses outside global unicast', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 302, headers: { location: 'https://[4000::1]/admin' } }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({ uri: 'https://public.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 1);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects bracketed private IPv6 literals before dispatch', function(done) {
	var requests = [];
	var client = fakeClient([], requests);
	var request = transport.createHttpRequest({ http: client, https: client });

	request({ uri: 'http://[::1]/admin', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 0);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects hostnames resolving to private addresses', function(done) {
	var requests = [];
	var client = fakeClient([], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['127.0.0.1'])
	});

	request({ uri: 'https://private.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 1);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects mixed public and private DNS results', function(done) {
	var requests = [];
	var client = fakeClient([], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34', '10.0.0.2'])
	});

	request({ uri: 'https://mixed.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 1);
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects redirects to private addresses', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 302, headers: { location: 'http://private.example/admin' } }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: function(hostname, options, callback) {
			fakeDns([hostname === 'private.example' ? '10.0.0.2' : '93.184.216.34'])(hostname, options, callback);
		}
	});

	request({ uri: 'https://public.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('public network address') !== -1);
		assert.equal(requests.length, 2);
		done();
	}, { maxBodyBytes: 1024 });
});

test('stops streaming when maxBodyBytes is exceeded', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 200, chunks: [Buffer.alloc(4), Buffer.alloc(4)] }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({ uri: 'https://public.example', timeout: 1000 }, function(err, response, body) {
		assert(err);
		assert.equal(err.message, 'Response body exceeds maxBodyBytes limit of 6 bytes.');
		assert.equal(response, null);
		assert.equal(body, null);
		done();
	}, { maxBodyBytes: 6 });
});

test('returns successful response buffers', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 200, headers: { 'content-type': 'text/html' }, chunks: ['hello'] }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({ uri: 'https://public.example', timeout: 1000 }, function(err, response, body) {
		assert.ifError(err);
		assert.equal(response.statusCode, 200);
		assert(Buffer.isBuffer(body));
		assert.equal(body.toString('utf8'), 'hello');
		done();
	}, { maxBodyBytes: 1024 });
});

test('rejects redirect loops after the configured limit', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 302, headers: { location: '/again' } },
		{ statusCode: 302, headers: { location: '/again' } }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({ uri: 'https://public.example', timeout: 1000 }, function(err) {
		assert(err);
		assert(err.message.indexOf('redirect limit') !== -1);
		assert.equal(requests.length, 2);
		done();
	}, { maxBodyBytes: 1024, maxRedirects: 1 });
});

test('uses the bounded default timeout and reports timeout errors', function(done) {
	var requests = [];
	var client = fakeClient([], requests, { triggerTimeout: true });
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({ uri: 'https://public.example', timeout: 0 }, function(err) {
		assert(err);
		assert.equal(err.message, 'Request timed out after 10000 ms.');
		assert.equal(requests.length, 1);
		done();
	}, { maxBodyBytes: 1024 });
});

test('reports synchronous transport setup failures and clears the deadline', function(done) {
	var setupError = new Error('transport setup failed');
	var timers = [];
	var clearedTimers = [];
	var callbackCount = 0;
	var client = {
		request: function() {
			throw setupError;
		}
	};
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34']),
		setTimeout: function(callback, delay) {
			var timer = { callback: callback, delay: delay };
			timers.push(timer);
			return timer;
		},
		clearTimeout: function(timer) {
			clearedTimers.push(timer);
		}
	});

	request({ uri: 'https://public.example', timeout: 250 }, function(err, response, body) {
		callbackCount += 1;
		assert.strictEqual(err, setupError);
		assert.strictEqual(response, null);
		assert.strictEqual(body, null);
		assert.equal(timers.length, 1);
		assert.equal(clearedTimers.length, 1);
		assert.strictEqual(clearedTimers[0], timers[0]);
		process.nextTick(function() {
			assert.equal(callbackCount, 1);
			done();
		});
	}, { maxBodyBytes: 1024 });
});

test('enforces one total request deadline without waiting for socket inactivity', function(done) {
	var requests = [];
	var timers = [];
	var clearedTimers = [];
	var destroyed = false;
	var callbackCount = 0;
	var client = {
		request: function(options) {
			var outgoing = new EventEmitter();
			outgoing.setTimeout = function() {};
			outgoing.destroy = function() {
				destroyed = true;
				process.nextTick(function() {
					outgoing.emit('error', new Error('destroyed'));
				});
			};
			outgoing.end = function() {
				requests.push(options);
			};
			return outgoing;
		}
	};
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34']),
		setTimeout: function(callback, delay) {
			var timer = { callback: callback, delay: delay };
			timers.push(timer);
			return timer;
		},
		clearTimeout: function(timer) {
			clearedTimers.push(timer);
		}
	});

	request({ uri: 'https://public.example', timeout: 250 }, function(err) {
		callbackCount += 1;
		assert(err);
		assert.equal(err.message, 'Request timed out after 250 ms.');
		assert.equal(destroyed, true);
		assert.equal(clearedTimers.length, 1);
		process.nextTick(function() {
			assert.equal(callbackCount, 1);
			done();
		});
	}, { maxBodyBytes: 1024 });

	assert.equal(requests.length, 1);
	assert.equal(timers.length, 1);
	assert.equal(timers[0].delay, 250);
	timers[0].callback();
});

test('keeps one total request deadline across redirects', function(done) {
	var requests = [];
	var timers = [];
	var clearedTimers = [];
	var client = fakeClient([
		{ statusCode: 302, headers: { location: 'https://other.example/page' } }
	], requests, { stallAfterRequest: 2 });
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34']),
		setTimeout: function(callback, delay) {
			var timer = { callback: callback, delay: delay };
			timers.push(timer);
			return timer;
		},
		clearTimeout: function(timer) {
			clearedTimers.push(timer);
		}
	});

	request({ uri: 'https://public.example', timeout: 500 }, function(err) {
		assert(err);
		assert.equal(err.message, 'Request timed out after 500 ms.');
		assert.equal(requests.length, 2);
		assert.equal(timers.length, 1);
		assert.equal(clearedTimers.length, 1);
		done();
	}, { maxBodyBytes: 1024 });

	setImmediate(function() {
		assert.equal(requests.length, 2);
		assert.equal(timers.length, 1);
		timers[0].callback();
	});
});

test('strips credentials when redirects cross origins', function(done) {
	var requests = [];
	var client = fakeClient([
		{ statusCode: 302, headers: { location: 'https://other.example/page' } },
		{ statusCode: 200, chunks: ['ok'] }
	], requests);
	var request = transport.createHttpRequest({
		http: client,
		https: client,
		lookup: fakeDns(['93.184.216.34'])
	});

	request({
		uri: 'https://public.example',
		timeout: 1000,
		headers: {
			Authorization: 'Bearer secret',
			Cookie: 'session=secret',
			Host: 'overridden.example',
			Accept: 'text/html'
		}
	}, function(err, response, body) {
		assert.ifError(err);
		assert.equal(response.statusCode, 200);
		assert.equal(body.toString(), 'ok');
		assert.equal(requests.length, 2);
		assert.equal(requests[0].headers.Authorization, 'Bearer secret');
		assert.equal(requests[0].headers.Host, undefined);
		assert.deepEqual(requests[1].headers, { Accept: 'text/html' });
		done();
	}, { maxBodyBytes: 1024 });
});

run(0);
