const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/font-mono/g, 'font-medium');
fs.writeFileSync(file, content, 'utf8');
