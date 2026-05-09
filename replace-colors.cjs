const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
         results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Re-map "text-accent" to standard black/white shades
  content = content.replace(/\btext-accent\b/g, 'text-slate-800 dark:text-slate-100');
  content = content.replace(/\bhover:text-accent\b/g, 'hover:text-slate-900 dark:hover:text-white');
  content = content.replace(/\bbg-accent\b/g, 'bg-slate-800 dark:bg-slate-200');
  content = content.replace(/\bhover:bg-accent\b/g, 'hover:bg-slate-700 dark:hover:bg-slate-300');
  content = content.replace(/\bbg-accent\/10\b/g, 'bg-slate-100 dark:bg-slate-800');
  content = content.replace(/\bborder-accent\b/g, 'border-slate-800 dark:border-slate-200');
  content = content.replace(/\bhover:border-accent\b/g, 'hover:border-slate-900 dark:hover:border-white');

  // Also replace some of the text-amber-* that might have been applied to text
  // Let's rely on regex for these
  content = content.replace(/text-amber-(\d00)/g, (match, p1) => {
    // We want to keep icons as amber. But the regex isn't smart enough to distinguish 
    // unless we look at the tag. Let's just do a specific regex for Lucide icons.
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
