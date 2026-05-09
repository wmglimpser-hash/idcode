import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('src/components')
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join('src/components', f));
files.push('src/App.tsx');

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/bg-slate-800 dark:bg-slate-200\/10/g, 'bg-slate-800/10 dark:bg-slate-200/10');
    c = c.replace(/bg-slate-800 dark:bg-slate-200\/5\b/g, 'bg-slate-800/5 dark:bg-slate-200/5');
    c = c.replace(/bg-slate-800 dark:bg-slate-200\/20/g, 'bg-slate-800/20 dark:bg-slate-200/20');
    c = c.replace(/bg-slate-800 dark:bg-slate-200\/30/g, 'bg-slate-800/30 dark:bg-slate-200/30');
    
    // Also fix hover states where text stays dark
    c = c.replace(/hover:bg-slate-800 dark:bg-slate-200\/10/g, 'hover:bg-slate-800/10 dark:hover:bg-slate-200/10');
    
    fs.writeFileSync(f, c);
  }
});
