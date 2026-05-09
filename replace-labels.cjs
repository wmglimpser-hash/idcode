const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/_NEW/g, '');
content = content.replace(/_BULK/g, '');
content = content.replace(/_LOGIN/g, '');
content = content.replace(/_CANCEL/g, '');
content = content.replace(/_SURVIVORS/g, '');
content = content.replace(/_HUNTERS/g, '');
content = content.replace(/_DELETE/g, '');
content = content.replace(/_BACK/g, '');
content = content.replace(/_SELECT_ALL/g, '');
content = content.replace(/_DESELECT/g, '');
content = content.replace(/返回搜索_BACK/g, '返回搜索');
content = content.replace(/font-serif/g, 'font-sans');

fs.writeFileSync(file, content, 'utf8');
