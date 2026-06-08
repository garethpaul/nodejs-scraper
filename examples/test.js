var http = require('http');
var server = http.createServer(function (request, response) {
	var respondTime = Math.floor(Math.random()*1000);
	setTimeout(function() {
		var links = '';
		var linkCount = Math.floor(Math.random()*20)+5;
		for (var i=0; i < linkCount; i++) {
			links += '<a href="/">Test - '+i+'</a>';
		}
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.end('<html><head><title>Page has '+linkCount+' links</title></head><body><div id="time">'+respondTime+'</div>'+links+'</body></html>\n');
	}, respondTime);
}).listen(8486);

var urls = [];
var requestCount = parseInt(process.env.SCRAPER_TEST_REQUESTS || '4', 10);
for (var u=0; u < requestCount; u++) {
	urls.push('http://localhost:8486');
}

setTimeout(function() {
	var scraper = require('../lib/scraper');
	var remaining = urls.length;
	scraper(urls, function(err, $) {
		if (err) {
			console.log(err);
			if (--remaining === 0) {
				server.close();
			}
			return;
		}
		console.log('Server took '+$('#time').text()+'ms to respond, found '+$('a').length+' <a> @ '+new Date().toString()+' with title "'+$('title').text()+'"');
		if (--remaining === 0) {
			server.close();
		}
	}, {
		'reqPerSec': parseFloat(process.env.SCRAPER_TEST_REQ_PER_SEC || '2')
	});
}, 1000);
