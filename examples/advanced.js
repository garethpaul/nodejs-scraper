var scraper = require('../lib/scraper');

scraper({
	'uri': 'https://example.test/search?q=nodejs'
	, 'headers': {
		'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
	}}
	, function(err, $) {
	if (err) {throw err;}

	console.log($('title').text().trim());
});
