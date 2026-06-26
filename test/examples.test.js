var assert = require('assert');
var childProcess = require('child_process');
var path = require('path');

var root = path.resolve(__dirname, '..');
var result = childProcess.spawnSync(process.execPath, [
	path.join(root, 'examples', 'reused-options.js')
], {
	'cwd': root,
	'encoding': 'utf8'
});

assert.equal(result.status, 0, result.stderr);
assert.equal(result.stderr, '');
assert.equal(result.stdout, [
	'First scrape: Example One',
	'Second scrape: Example Two',
	'Request options unchanged: true',
	'Fetch options unchanged: true',
	''
].join('\n'));
