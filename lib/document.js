var JSDOM = require('jsdom').JSDOM;
var jQueryFactory = require('jquery/factory').jQueryFactory;

function createDocument(body, callback, deps) {
	deps = deps || {};
	var Document = deps.JSDOM || JSDOM;
	var createJQuery = deps.jQueryFactory || jQueryFactory;

	process.nextTick(function() {
		var $;
		try {
			var document = new Document(body);
			$ = createJQuery(document.window);
		} catch (err) {
			callback(err, null);
			return;
		}
		callback(null, $);
	});
}

module.exports.createDocument = createDocument;
