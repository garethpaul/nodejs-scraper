var scraper = require('../lib/scraper');

scraper('https://example.test/search?q=javascript', function(err, $) {
	if (err) {throw err;}

	console.log($('title').text().trim());
});
