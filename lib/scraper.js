var requestDefaults = {
	'uri': null
	, 'headers': {
		'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
	}
};
var fetchDefaults = {
	'reqPerSec': 0
};

function createScraper(deps) {
	deps = deps || {};
	return function scrape(requestOptions, callback, fetchOptions) {
	var request = deps.request || require('request');
	var jsdom = deps.jsdom || require('jsdom');
	if (!fetchOptions) {
		fetchOptions = {};
	}
	if (!callback) {
		callback = function(){};
	}
	var normalizedFetchOptions = {};
	Object.keys(fetchDefaults).forEach(function(key) {
		normalizedFetchOptions[key] = fetchDefaults[key];
	});
	Object.keys(fetchOptions).forEach(function(key) {
		normalizedFetchOptions[key] = fetchOptions[key];
	});

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

			if (!requestOptions['uri']) {
				callback(new Error('You must supply an uri.'), null, null);
				setTimeout(runNextFetch, timeSpacing);
				return;
			}

			request(requestOptions, function (err, response, body) {
				setTimeout(runNextFetch, timeSpacing);
				if (err) {
					callback(err, null, null);
					return;
				}
				if (response && response.statusCode == 200) {
					body = (body || '').replace(/<(\/?)script/g, '<$1nobreakage');
					var window = jsdom.jsdom().createWindow();
					jsdom.jQueryify(window, __dirname+'/../deps/jquery-1.6.1.min.js', function(win, $) {
						$('head').append($(body).find('head').html());
						$('body').append($(body).find('body').html());
						callback(null, $);
					});
				} else {
					callback(new Error('Request to '+requestOptions['uri']+' ended with status code: '+(typeof response !== 'undefined' ? response.statusCode : 'unknown')), null, null);
				}
			});
		})
	});

	var reqPerSec = normalizeReqPerSec(normalizedFetchOptions['reqPerSec']);
	var concurrentConnections = !reqPerSec ? queue.length : (Math.floor(reqPerSec) || 1);
	var timeSpacing = !reqPerSec ? 0 : 1000/reqPerSec;

	for (var i=0; i < concurrentConnections; i++) {
		runNextFetch();
	};

	function runNextFetch() {
		var nextFetch = queue.shift();
		if (nextFetch) {
			nextFetch();
		}
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
			Object.keys(requestOptions.headers || {}).forEach(function(header) {
				normalized.headers[header] = requestOptions.headers[header];
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

	return normalized;
}

function normalizeReqPerSec(value) {
	var reqPerSec = Number(value);
	if (!isFinite(reqPerSec) || reqPerSec <= 0) {
		return 0;
	}
	return reqPerSec;
}

module.exports = createScraper();
module.exports.createScraper = createScraper;
module.exports.normalizeRequestOptions = normalizeRequestOptions;
