const fs = require('fs');

const file = 'src/components/TheoryPresentation.tsx';
let content = fs.readFileSync(file, 'utf8');

// The original ones were text-amber-* that I broke. Let's look at the context.
// <span className="ml-auto px-3 py-1 bg-slate- text-slate- text-xs font-medium font-bold rounded-full">
content = content.replace(/bg-slate- text-slate- /g, 'bg-slate-100 text-slate-800 ');

// # 页标题, ---, 目录 [Contents], etc.
// <p><span className="text-slate- font-medium"># 页标题</span>：每段首行作为标题</p>
content = content.replace(/text-slate- font-medium/g, 'text-slate-700 font-medium');

// importSortOrder === 'asc' ? 'bg-white text-slate- shadow-sm'
content = content.replace(/text-slate- shadow-sm/g, 'text-slate-600 shadow-sm');

// <span className="text-[10px] text-slate- font-medium">TAG</span>
// <span className="text-[10px] text-slate- font-medium">{trait.role}</span>
content = content.replace(/text-\[10px\] text-slate- font-medium/g, 'text-[10px] text-slate-500 font-medium');

// className="text-slate- hover:text-red-500 transition-colors"
content = content.replace(/text-slate- hover:text-red-500/g, 'text-slate-400 hover:text-red-500');

// text-[10px] font-bold text-slate- rounded drop-shadow-sm transition-all border border-slate-
content = content.replace(/text-slate- rounded drop-shadow-sm transition-all border border-slate-/g, 'text-slate-600 rounded drop-shadow-sm transition-all border border-slate-200');

// text-slate- font-bold text-sm
content = content.replace(/text-slate- font-bold text-sm/g, 'text-slate-800 font-bold text-sm');

// Also handle Leaderboard just in case
let lbFile = 'src/components/Leaderboard.tsx';
let lbContent = fs.readFileSync(lbFile, 'utf8');
lbContent = lbContent.replace(/text-slate-\b/g, 'text-slate-500');
fs.writeFileSync(lbFile, lbContent, 'utf8');

fs.writeFileSync(file, content, 'utf8');
