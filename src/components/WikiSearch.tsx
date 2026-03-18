import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Clock, User, UserCircle } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { WikiEntry, Character } from '../constants';

interface Props {
  onSelect: (entry: WikiEntry) => void;
  onSelectCharacter: (character: Character) => void;
}

export const WikiSearch = ({ onSelect, onSelectCharacter }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{ type: 'entry' | 'character'; data: any }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search Wiki Entries
        const entryQuery = query(
          collection(db, 'entries'),
          where('title', '>=', searchTerm),
          where('title', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );
        
        // Search Characters by title (称号)
        const charQuery = query(
          collection(db, 'characters'),
          where('title', '>=', searchTerm),
          where('title', '<=', searchTerm + '\uf8ff'),
          limit(5)
        );

        const [entrySnap, charSnap] = await Promise.all([
          getDocs(entryQuery),
          getDocs(charQuery)
        ]);

        const combinedResults: { type: 'entry' | 'character'; data: any }[] = [];
        
        charSnap.forEach((doc) => {
          combinedResults.push({ type: 'character', data: { id: doc.id, ...doc.data() } as Character });
        });

        entrySnap.forEach((doc) => {
          combinedResults.push({ type: 'entry', data: { id: doc.id, ...doc.data() } as WikiEntry });
        });

        setResults(combinedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 transition-colors ${loading ? 'text-accent animate-pulse' : 'text-muted'}`} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索庄园秘典词条或角色称号..."
          className="w-full bg-card/50 border border-border text-text pl-12 pr-4 py-4 rounded-none focus:border-accent outline-none transition-all cyber-border shadow-[0_0_20px_rgba(0,0,0,0.3)]"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[400px] overflow-y-auto">
          {results.map((result, idx) => {
            if (result.type === 'character') {
              const char = result.data as Character;
              return (
                <button
                  key={`char-${char.id}-${idx}`}
                  onClick={() => {
                    onSelectCharacter(char);
                    setSearchTerm('');
                    setResults([]);
                  }}
                  className="w-full text-left p-4 hover:bg-primary/10 border-b border-border/50 last:border-0 flex items-center gap-4 group transition-colors"
                >
                  <div className="w-10 h-10 bg-bg border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary group-hover:cyber-glow-text">{char.title} <span className="text-[10px] text-muted font-normal ml-2">({char.name})</span></div>
                    <div className="text-[10px] text-muted uppercase tracking-widest flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">角色档案</span>
                      <span className="flex items-center gap-1">{char.role}</span>
                    </div>
                  </div>
                </button>
              );
            } else {
              const entry = result.data as WikiEntry;
              return (
                <button
                  key={`entry-${entry.id}-${idx}`}
                  onClick={() => {
                    onSelect(entry);
                    setSearchTerm('');
                    setResults([]);
                  }}
                  className="w-full text-left p-4 hover:bg-accent/10 border-b border-border/50 last:border-0 flex items-center gap-4 group transition-colors"
                >
                  <div className="w-10 h-10 bg-bg border border-border flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-accent group-hover:cyber-glow-text">{entry.title}</div>
                    <div className="text-[10px] text-muted uppercase tracking-widest flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.type}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {entry.authorId.slice(0, 6)}</span>
                    </div>
                  </div>
                </button>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
