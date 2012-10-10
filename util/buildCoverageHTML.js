var jade = require('jade');
var fs = require('fs');

// Strings for code coverage classes
function coverageClass(n) {
  if (n >= 75) return 'high';
  if (n >= 50) return 'medium';
  if (n >= 25) return 'low';
  return 'terrible';
}

// Read in templates
var file = __dirname + '/../source/coverageTemplate/coverage.jade';
var str = fs.readFileSync(file, 'utf8');
var fn = jade.compile(str, { filename: file });

// Read JSON from stdin
var json = fs.readFileSync('/dev/stdin').toString();

try {
  var cov = JSON.parse(json);
  // Dump HTML
  console.log(fn({
      cov: cov,
      coverageClass: coverageClass
  }));
}
catch (err) {
  console.error('Failed to parse input JSON!');
  process.exit(1);
}
