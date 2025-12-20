const fs = require('fs');

let content = fs.readFileSync('./src/index.css', 'utf8');

// Remove lines containing the duplicate Google Fonts import
const lines = content.split('\n');
const filteredLines = lines.filter(function (line) {
    if (line.indexOf('Import Space Grotesk') !== -1) return false;
    if (line.indexOf('@import url') !== -1 && line.indexOf('fonts.googleapis') !== -1) return false;
    return true;
});

fs.writeFileSync('./src/index.css', filteredLines.join('\n'));
console.log('Fixed index.css - removed duplicate Google Fonts import');
