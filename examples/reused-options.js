var scraperModule = require('../lib/scraper');

var responseCount = 0;
var scraper = scraperModule.createScraper({
	'request': function(options, callback) {
		responseCount += 1;
		process.nextTick(function() {
			callback(null, { 'statusCode': 200 }, [
				'<html><head><title>Example ',
				responseCount === 1 ? 'One' : 'Two',
				'</title></head><body></body></html>'
			].join(''));
		});
	}
});

var requestOptions = Object.freeze({
	'uri': 'https://example.test/reusable-options',
	'headers': Object.freeze({ 'Accept': 'text/html' })
});
var fetchOptions = Object.freeze({
	'maxBodyBytes': 4096,
	'reqPerSec': 0
});
var requestSnapshot = JSON.stringify(requestOptions);
var fetchSnapshot = JSON.stringify(fetchOptions);

function scrape(label, callback) {
	scraper(requestOptions, function(err, $) {
		if (err) {
			callback(err);
			return;
		}
		console.log(label + ': ' + $('title').text());
		callback();
	}, fetchOptions);
}

scrape('First scrape', function(err) {
	if (err) { throw err; }
	scrape('Second scrape', function(secondErr) {
		if (secondErr) { throw secondErr; }
		console.log('Request options unchanged: ' + (JSON.stringify(requestOptions) === requestSnapshot));
		console.log('Fetch options unchanged: ' + (JSON.stringify(fetchOptions) === fetchSnapshot));
	});
});
