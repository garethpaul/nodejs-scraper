var dns = require('dns');
var http = require('http');
var https = require('https');
var net = require('net');

var DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
var DEFAULT_MAX_REDIRECTS = 5;
var DEFAULT_TIMEOUT_MS = 10000;
var REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308];
var blockedAddresses = buildBlockedAddresses();

function createHttpRequest(deps) {
	deps = deps || {};
	var httpClient = deps.http || http;
	var httpsClient = deps.https || https;
	var lookup = createPublicLookup(deps.lookup || dns.lookup);
	var setDeadline = deps.setTimeout || setTimeout;
	var clearDeadline = deps.clearTimeout || clearTimeout;

	return function request(requestOptions, callback, fetchOptions) {
		requestOptions = requestOptions || {};
		fetchOptions = fetchOptions || {};
		var maxBodyBytes = normalizePositiveInteger(fetchOptions.maxBodyBytes, DEFAULT_MAX_BODY_BYTES);
		var maxRedirects = normalizeNonNegativeInteger(fetchOptions.maxRedirects, DEFAULT_MAX_REDIRECTS);
		var timeout = normalizePositiveInteger(requestOptions.timeout, DEFAULT_TIMEOUT_MS);
		var completed = false;
		var activeRequest = null;
		var deadlineTimer = setDeadline(function() {
			finish(new Error('Request timed out after '+timeout+' ms.'), null, null, function(outgoing) {
				if (outgoing) {
					outgoing.destroy();
				}
			});
		}, timeout);

		function finish(err, response, body, beforeCallback) {
			if (completed) {
				return;
			}
			completed = true;
			clearDeadline(deadlineTimer);
			var outgoing = activeRequest;
			activeRequest = null;
			if (beforeCallback) {
				beforeCallback(outgoing);
			}
			callback(err, response || null, typeof body === 'undefined' ? null : body);
		}

		function dispatch(uri, redirects, previousUrl, previousHeaders) {
			var parsed;
			try {
				parsed = new URL(uri);
			} catch (err) {
				finish(new Error('You must supply an http or https uri.'));
				return;
			}
			var hostname = normalizeHostname(parsed.hostname);
			if (!isHttpUrl(parsed) || !isPublicHostnameLiteral(hostname)) {
				finish(new Error('You must supply an http or https uri with a public network address.'));
				return;
			}

			var method = String(requestOptions.method || 'GET').toUpperCase();
			if (method !== 'GET') {
				finish(new Error('The built-in scraper transport supports GET requests only.'));
				return;
			}

			var client = parsed.protocol === 'https:' ? httpsClient : httpClient;
			var headers = redirectHeaders(previousHeaders || requestOptions.headers || {}, previousUrl, parsed);
			var outgoing = client.request({
				protocol: parsed.protocol,
				hostname: hostname,
				port: parsed.port || undefined,
				path: parsed.pathname + parsed.search,
				method: method,
				headers: headers,
				lookup: lookup
			}, function(response) {
				if (REDIRECT_STATUS_CODES.indexOf(response.statusCode) !== -1 && response.headers.location) {
					response.resume();
					if (redirects >= maxRedirects) {
						finish(new Error('Request redirect limit of '+maxRedirects+' exceeded.'));
						return;
					}
					var redirectUrl;
					try {
						redirectUrl = new URL(response.headers.location, parsed);
					} catch (err) {
						finish(new Error('Request redirect must use a valid http or https uri.'));
						return;
					}
					dispatch(redirectUrl.toString(), redirects + 1, parsed, headers);
					return;
				}

				if (response.statusCode !== 200) {
					response.resume();
					finish(null, response, null);
					return;
				}

				var contentLength = Number(response.headers['content-length']);
				if (isFinite(contentLength) && contentLength > maxBodyBytes) {
					response.destroy();
					finish(bodyLimitError(maxBodyBytes));
					return;
				}

				var chunks = [];
				var receivedBytes = 0;
				response.on('data', function(chunk) {
					if (completed) {
						return;
					}
					if (!Buffer.isBuffer(chunk)) {
						chunk = Buffer.from(chunk);
					}
					receivedBytes += chunk.length;
					if (receivedBytes > maxBodyBytes) {
						response.destroy();
						finish(bodyLimitError(maxBodyBytes));
						return;
					}
					chunks.push(chunk);
				});
				response.on('end', function() {
					finish(null, response, Buffer.concat(chunks, receivedBytes));
				});
				response.on('aborted', function() {
					finish(new Error('Response ended before the body completed.'));
				});
				response.on('error', function(err) {
					finish(err);
				});
			});
			activeRequest = outgoing;

			outgoing.on('error', function(err) {
				finish(err);
			});
			outgoing.setTimeout(timeout, function() {
				outgoing.destroy(new Error('Request timed out after '+timeout+' ms.'));
			});
			outgoing.end();
		}

		dispatch(requestOptions.uri, 0, null);
	};
}

function createPublicLookup(lookup) {
	return function publicLookup(hostname, options, callback) {
		var lookupOptions = { all: true, verbatim: true };
		if (options && options.family) {
			lookupOptions.family = options.family;
		}
		lookup(hostname, lookupOptions, function(err, addresses) {
			if (err) {
				callback(err);
				return;
			}
			var validatedAddresses = Array.isArray(addresses) && addresses.map(function(entry) {
				var family = entry && net.isIP(entry.address);
				return family && isPublicAddress(entry.address) ? {
					address: entry.address,
					family: family
				} : null;
			});
			if (!validatedAddresses || !validatedAddresses.length || validatedAddresses.some(function(entry) {
				return !entry;
			})) {
				callback(new Error('Request host must resolve only to a public network address.'));
				return;
			}
			if (options && options.all) {
				callback(null, validatedAddresses);
				return;
			}
			callback(null, validatedAddresses[0].address, validatedAddresses[0].family);
		});
	};
}

function redirectHeaders(headers, previousUrl, currentUrl) {
	var redirected = {};
	Object.keys(headers).forEach(function(name) {
		if (name.toLowerCase() !== 'host') {
			redirected[name] = headers[name];
		}
	});
	if (previousUrl && previousUrl.origin !== currentUrl.origin) {
		Object.keys(redirected).forEach(function(name) {
			if (['authorization', 'cookie', 'proxy-authorization'].indexOf(name.toLowerCase()) !== -1) {
				delete redirected[name];
			}
		});
	}
	return redirected;
}

function isHttpUrl(parsed) {
	return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
		&& !!parsed.hostname
		&& !parsed.username
		&& !parsed.password;
}

function isPublicHostnameLiteral(hostname) {
	return !net.isIP(hostname) || isPublicAddress(hostname);
}

function normalizeHostname(hostname) {
	if (hostname[0] === '[' && hostname[hostname.length - 1] === ']') {
		return hostname.slice(1, -1);
	}
	return hostname;
}

function isPublicAddress(address) {
	var family = net.isIP(address);
	if (!family) {
		return false;
	}
	return !blockedAddresses[family === 4 ? 'ipv4' : 'ipv6'].check(
		address,
		family === 4 ? 'ipv4' : 'ipv6'
	);
}

function buildBlockedAddresses() {
	var blockLists = {
		ipv4: new net.BlockList(),
		ipv6: new net.BlockList()
	};
	[
		['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10],
		['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
		['192.0.0.0', 29], ['192.0.2.0', 24], ['192.88.99.0', 24],
		['192.168.0.0', 16],
		['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
		['224.0.0.0', 4], ['240.0.0.0', 4]
	].forEach(function(entry) {
		blockLists.ipv4.addSubnet(entry[0], entry[1], 'ipv4');
	});
	['192.0.0.8', '192.0.0.170', '192.0.0.171'].forEach(function(address) {
		blockLists.ipv4.addAddress(address, 'ipv4');
	});
	[
		['::', 128], ['::1', 128], ['::ffff:0:0', 96],
		['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
		['100:0:0:1::', 64], ['2001::', 32], ['2001:2::', 48],
		['2001:10::', 28], ['2001:db8::', 32], ['2002::', 16],
		['3fff::', 20], ['5f00::', 16], ['fc00::', 7],
		['fe80::', 10], ['ff00::', 8]
	].forEach(function(entry) {
		blockLists.ipv6.addSubnet(entry[0], entry[1], 'ipv6');
	});
	return blockLists;
}

function normalizePositiveInteger(value, fallback) {
	var normalized = Number(value);
	if (!isFinite(normalized) || normalized <= 0) {
		return fallback;
	}
	return Math.floor(normalized) || fallback;
}

function normalizeNonNegativeInteger(value, fallback) {
	var normalized = Number(value);
	if (!isFinite(normalized) || normalized < 0) {
		return fallback;
	}
	return Math.floor(normalized);
}

function bodyLimitError(maxBodyBytes) {
	return new Error('Response body exceeds maxBodyBytes limit of '+maxBodyBytes+' bytes.');
}

module.exports.createHttpRequest = createHttpRequest;
module.exports.createPublicLookup = createPublicLookup;
module.exports.isPublicAddress = isPublicAddress;
