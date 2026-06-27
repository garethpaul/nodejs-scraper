var requestDefaults = {
	'uri': null
	, 'timeout': 10000
	, 'headers': {
		'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
	}
};
var fetchDefaults = {
	'reqPerSec': 0
	, 'maxBodyBytes': 1024 * 1024
	, 'maxRedirects': 5
};
// Node clamps larger timeout delays to 1 ms.
var maxScheduleDelay = 2147483647;

function createScraper(deps) {
	deps = deps || {};
	return function scrape(requestOptions, callback, fetchOptions) {
	var request = deps.request || require('./http-request').createHttpRequest(deps.transport);
	var createDocument = deps.createDocument || require('./document').createDocument;
	var schedule = deps.schedule || setTimeout;
	if (!fetchOptions) {
		fetchOptions = {};
	}
	if (typeof callback !== 'function') {
		callback = function(){};
	}
	var normalizedFetchOptions = {};
	Object.keys(fetchDefaults).forEach(function(key) {
		normalizedFetchOptions[key] = fetchDefaults[key];
	});
	Object.keys(fetchOptions).forEach(function(key) {
		normalizedFetchOptions[key] = fetchOptions[key];
	});
	normalizedFetchOptions.maxBodyBytes = normalizeMaxBodyBytes(normalizedFetchOptions.maxBodyBytes);

	var fetches = [];
	var queue = [];

	if (!Array.isArray(requestOptions)) {
		fetches.push(requestOptions);
	} else {
		fetches = requestOptions;
	}

	fetches.forEach(function(requestOptions, index) {
		queue.push(function() {
			requestOptions = normalizeRequestOptions(requestOptions);

			if (!isHttpUri(requestOptions['uri'])) {
				callback(new Error('You must supply an http or https uri.'), null, null);
				return;
			}

			request(requestOptions, function (err, response, body) {
				if (err) {
					callback(err, null, null);
					return;
				}
				if (response && response.statusCode == 200) {
					var normalizedBody = normalizeResponseBody(body, normalizedFetchOptions.maxBodyBytes);
					if (normalizedBody.error) {
						callback(normalizedBody.error, null, null);
						return;
					}
					body = normalizedBody.body.replace(/<(\/?)script/g, '<$1nobreakage');
					createDocument(body, function(documentError, $) {
						if (documentError) {
							callback(documentError, null, null);
							return;
						}
						callback(null, $);
					});
				} else {
					var statusCode = response && response.statusCode != null ? response.statusCode : 'unknown';
					callback(new Error('Request to '+requestOptions['uri']+' ended with status code: '+statusCode), null, null);
				}
			}, {
				maxBodyBytes: normalizedFetchOptions.maxBodyBytes,
				maxRedirects: normalizedFetchOptions.maxRedirects
			});
		})
	});

	var reqPerSec = normalizeReqPerSec(normalizedFetchOptions['reqPerSec']);
	var timeSpacing = !reqPerSec ? 0 : 1000/reqPerSec;

	if (!reqPerSec) {
		while (queue.length) {
			runNextFetch();
		}
	} else {
		runNextFetch();
	}

	function runNextFetch() {
		var nextFetch = queue.shift();
		if (nextFetch) {
			if (reqPerSec && queue.length) {
				scheduleNextFetch(timeSpacing);
			}
			nextFetch();
		}
	}

	function scheduleNextFetch(delay) {
		var currentDelay = Math.min(delay, maxScheduleDelay);
		schedule(function() {
			var remainingDelay = delay - currentDelay;
			if (remainingDelay > 0) {
				scheduleNextFetch(remainingDelay);
				return;
			}
			runNextFetch();
		}, currentDelay);
	}
};
}

function normalizeRequestOptions(requestOptions) {
	if (typeof requestOptions === 'string') {
		requestOptions = {
			'uri': requestOptions
		};
	}
	requestOptions = requestOptions || {};

	var normalized = {};
	Object.keys(requestDefaults).forEach(function(key) {
		if (key === 'headers') {
			normalized.headers = {};
			Object.keys(requestDefaults.headers).forEach(function(header) {
				normalized.headers[header] = requestDefaults.headers[header];
			});
			var requestHeaders = normalizeHeaders(requestOptions.headers);
			Object.keys(requestHeaders).forEach(function(header) {
				normalized.headers[header] = requestHeaders[header];
			});
		} else {
			normalized[key] = requestOptions[key] || requestDefaults[key];
		}
	});
	Object.keys(requestOptions).forEach(function(key) {
		if (key !== 'headers') {
			normalized[key] = requestOptions[key];
		}
	});
	normalized.timeout = normalizeRequestTimeout(requestOptions.timeout);

	return normalized;
}

function normalizeRequestTimeout(value) {
	if (typeof value !== 'number' && typeof value !== 'string') {
		return requestDefaults.timeout;
	}
	if (typeof value === 'string' && value.trim() === '') {
		return requestDefaults.timeout;
	}
	var timeout = Number(value);
	if (!isFinite(timeout) || timeout <= 0) {
		return requestDefaults.timeout;
	}
	return timeout;
}

function normalizeHeaders(headers) {
	if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
		return {};
	}
	var normalized = {};
	Object.keys(headers).forEach(function(header) {
		if (isSafeHeader(header, headers[header])) {
			normalized[header] = headers[header];
		}
	});
	return normalized;
}

function isSafeHeader(header, value) {
	return typeof header === 'string'
		&& header.indexOf('\r') === -1
		&& header.indexOf('\n') === -1
		&& value !== null
		&& typeof value !== 'undefined'
		&& String(value).indexOf('\r') === -1
		&& String(value).indexOf('\n') === -1;
}

function normalizeReqPerSec(value) {
	var reqPerSec = Number(value);
	if (!isFinite(reqPerSec) || reqPerSec <= 0) {
		return 0;
	}
	return reqPerSec;
}

function normalizeMaxBodyBytes(value) {
	if (typeof value !== 'number' && typeof value !== 'string') {
		return fetchDefaults.maxBodyBytes;
	}
	if (typeof value === 'string' && value.trim() === '') {
		return fetchDefaults.maxBodyBytes;
	}
	var maxBodyBytes = Number(value);
	if (!isFinite(maxBodyBytes) || maxBodyBytes <= 0) {
		return fetchDefaults.maxBodyBytes;
	}
	return Math.floor(maxBodyBytes) || fetchDefaults.maxBodyBytes;
}

function normalizeResponseBody(body, maxBodyBytes) {
	var bodyBytes;
	if (body === null || typeof body === 'undefined') {
		body = '';
	} else if (Buffer.isBuffer(body)) {
		bodyBytes = body.length;
		body = body.toString('utf8');
	} else if (typeof body !== 'string') {
		return {
			'error': new Error('Response body must be text or a buffer.'),
			'body': null
		};
	}

	bodyBytes = typeof bodyBytes === 'number' ? bodyBytes : Buffer.byteLength(body, 'utf8');
	if (bodyBytes > maxBodyBytes) {
		return {
			'error': new Error('Response body exceeds maxBodyBytes limit of '+maxBodyBytes+' bytes.'),
			'body': null
		};
	}

	return {
		'error': null,
		'body': body
	};
}

function isHttpUri(uri) {
	if (typeof uri !== 'string') {
		return false;
	}
	var parsed;
	try {
		parsed = new URL(uri);
	} catch (err) {
		return false;
	}
	return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
		&& !!parsed.hostname
		&& !parsed.username
		&& !parsed.password;
}

module.exports = createScraper();
module.exports.createScraper = createScraper;
module.exports.normalizeRequestOptions = normalizeRequestOptions;
