var scraper = require('scraper');

scraper('https://example.test/search?q=javascript', function(err, $) {
	if (err) {throw err;}

	$('.msg').each(function() {
		console.log($(this).text().trim()+'\n');
	});
});
