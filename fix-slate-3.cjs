const fs = require('fs');

const tpFile = 'src/components/TheoryPresentation.tsx';
let tpContent = fs.readFileSync(tpFile, 'utf8');

tpContent = tpContent.replace(/<Trophy className=\"w-8 h-8 text-slate-\" \/>/g, '<Trophy className=\"w-8 h-8 text-amber-500\" \/>');
tpContent = tpContent.replace(/<TagIcon className=\"w-3 h-3 text-slate-\" \/>/g, '<TagIcon className=\"w-3 h-3 text-amber-500\" \/>');
tpContent = tpContent.replace(/<Trophy className=\"w-3 h-3 text-slate-\" \/>/g, '<Trophy className=\"w-3 h-3 text-amber-500\" \/>');
tpContent = tpContent.replace(/<Sparkles className=\"w-5 h-5 text-slate-\" \/>/g, '<Sparkles className=\"w-5 h-5 text-amber-500\" \/>');
tpContent = tpContent.replace(/text-slate-\"/g, 'text-slate-900 dark:text-white"');

fs.writeFileSync(tpFile, tpContent, 'utf8');

const appFile = 'src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(/text-slate-\"/g, 'text-amber-500"'); // For CODEX in App.tsx
fs.writeFileSync(appFile, appContent, 'utf8');
