const fs = require('fs');

const file = 'src/components/TheoryPresentation.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/border-slate- relative/g, 'border-slate-200 relative');
content = content.replace(/bg-slate- hover:bg-slate- /g, 'bg-slate-800 hover:bg-slate-700 ');
content = content.replace(/border-slate-\"/g, 'border-slate-800"');

fs.writeFileSync(file, content, 'utf8');
