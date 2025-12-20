const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

// Remove lines 3-4 (the comment and @import url for Google Fonts)
const lines = content.split('\n');
const filteredLines = lines.filter((line, index) => {
    // Keep all lines except the comment and @import url for Google Fonts
    if (line.includes('Import Space Grotesk')) return false;
    if (line.includes('@import url') && line.includes('fonts.googleapis')) return false;
    return true;
});

fs.writeFileSync('src/index.css', filteredLines.join('\n'));
console.log('Fixed index.css - removed duplicate Google Fonts import');
