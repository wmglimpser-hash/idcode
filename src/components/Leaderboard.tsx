import React, { useState, useMemo } from 'react';
import { Character, CharacterTraitCategory } from '../constants';
import { Trophy, ArrowUp, ArrowDown, Search, Activity, Shield, Zap, Target } from 'lucide-react';

interface Props {
  characters: Character[];
}

export const Leaderboard = ({ characters }: Props) => {
  const [role, setRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [selectedTrait, setSelectedTrait] = useState<{ category: string, label: string } | null>(null);

  const baseInfo = useMemo(() => {
    const id = role === 'Survivor' ? 'base_survivor' : 'base_hunter';
    return characters.find(c => c.id === id);
  }, [characters, role]);

  const factionCharacters = useMemo(() => {
    return characters.filter(c => c.role === role && !c.id.startsWith('base_'));
  }, [characters, role]);

  // Helper to extract numeric value for sorting
  const extractValue = (valStr: string): number => {
    const match = valStr.match(/(-?\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const groupedRankedData = useMemo(() => {
    if (!selectedTrait) return [];

    const data = factionCharacters
      .map(char => {
        const category = char.traits?.find(t => t.category === selectedTrait.category);
        const item = category?.items.find(i => i.label === selectedTrait.label);
        return {
          id: char.id,
          name: char.name,
          title: char.title,
          imageUrl: char.imageUrl,
          value: item ? item.value : 'N/A',
          numericValue: item ? extractValue(item.value) : -Infinity
        };
      })
      .sort((a, b) => b.numericValue - a.numericValue);

    const groups: { rank: number, value: string, numericValue: number, characters: typeof data }[] = [];
    
    data.forEach((item, index) => {
      if (index > 0 && item.numericValue === data[index - 1].numericValue) {
        groups[groups.length - 1].characters.push(item);
      } else {
        groups.push({
          rank: index + 1,
          value: item.value,
          numericValue: item.numericValue,
          characters: [item]
        });
      }
    });

    return groups;
  }, [factionCharacters, selectedTrait]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-accent cyber-glow-text flex items-center gap-4">
            <Trophy className="w-10 h-10 text-gold" /> 庄园能力排行榜
          </h2>
          <p className="text-muted text-xs font-mono mt-2 uppercase tracking-widest">Neural Leaderboard System v2.1</p>
        </div>

        <div className="flex bg-card border border-border p-1 cyber-border">
          <button
            onClick={() => { setRole('Survivor'); setSelectedTrait(null); }}
            className={`px-8 py-2 text-xs font-bold tracking-widest transition-all ${role === 'Survivor' ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]' : 'text-muted hover:text-text'}`}
          >
            求生者 SURVIVORS
          </button>
          <button
            onClick={() => { setRole('Hunter'); setSelectedTrait(null); }}
            className={`px-8 py-2 text-xs font-bold tracking-widest transition-all ${role === 'Hunter' ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]' : 'text-muted hover:text-text'}`}
          >
            监管者 HUNTERS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Base Info Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card/30 border border-border p-6 cyber-border relative overflow-hidden flex flex-col h-[800px]">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-serif text-accent mb-6 flex items-center gap-2 flex-shrink-0">
              <Shield className="w-5 h-5" /> 阵营基础数值概览
            </h3>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8">
              {baseInfo?.traits ? (
                <>
                  {baseInfo.traits.map((cat, i) => (
                    <div key={i} className="space-y-3">
                      <div className="text-[10px] text-primary font-bold uppercase tracking-widest border-b border-primary/20 pb-1">
                        {cat.category}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {cat.items.map((item, j) => (
                          <div key={j} className="flex justify-between items-center bg-bg/40 p-3 border border-border/50 group hover:border-accent/50 transition-all">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted font-mono">{item.label}</span>
                              <span className="text-sm font-bold text-text">{item.value}</span>
                            </div>
                            <button
                              onClick={() => setSelectedTrait({ category: cat.category, label: item.label })}
                              className={`flex items-center gap-2 px-3 py-1 text-[9px] font-mono tracking-tighter border transition-all ${
                                selectedTrait?.label === item.label 
                                  ? 'bg-accent text-bg border-accent' 
                                  : 'border-accent/30 text-accent hover:bg-accent/10'
                              }`}
                            >
                              <Trophy className="w-3 h-3" /> 查看排名
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-12 text-center text-muted font-mono text-sm">
                  暂无基础数值数据。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <div className="lg:col-span-7 space-y-6">
          {selectedTrait ? (
            <div className="bg-card/30 border border-border p-6 cyber-border h-[800px] flex flex-col">
              <div className="flex justify-between items-end mb-8 border-b border-border pb-4 flex-shrink-0">
                <div>
                  <div className="text-[10px] text-primary font-bold uppercase mb-1">{selectedTrait.category}</div>
                  <h3 className="text-2xl font-serif text-accent cyber-glow-text">{selectedTrait.label} 排行榜</h3>
                </div>
                <div className="text-[10px] font-mono text-muted">共 {factionCharacters.length} 名成员</div>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {groupedRankedData.map((group) => (
                  <div 
                    key={group.rank} 
                    className={`flex items-center gap-4 p-4 border transition-all ${
                      group.rank === 1 ? 'bg-gold/10 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 
                      group.rank === 2 ? 'bg-accent/5 border-accent/30' :
                      group.rank === 3 ? 'bg-primary/5 border-primary/30' :
                      'bg-bg/40 border-border/50'
                    }`}
                  >
                    <div className="w-8 text-center font-mono font-bold flex-shrink-0">
                      {group.rank === 1 ? <span className="text-gold text-xl">1st</span> :
                       group.rank === 2 ? <span className="text-accent text-lg">2nd</span> :
                       group.rank === 3 ? <span className="text-primary text-base">3rd</span> :
                       <span className="text-muted">{group.rank}</span>}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 flex-grow">
                      {group.characters.map(char => (
                        <div key={char.id} className="flex items-center gap-3 bg-bg/20 p-1 pr-3 border border-border/30 hover:border-accent/50 transition-all group">
                          <div className="w-10 h-10 cyber-border overflow-hidden flex-shrink-0">
                            <img src={char.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col">
                            <div className="text-xs font-bold text-accent group-hover:text-primary transition-colors">{char.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-mono font-bold text-accent">{group.value}</div>
                      {group.rank === 1 && <div className="text-[8px] text-gold font-bold uppercase tracking-widest">庄园最强</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card/20 border border-dashed border-border p-12 cyber-border flex flex-col items-center justify-center text-center space-y-4 min-h-[600px]">
              <div className="w-16 h-16 bg-border/20 flex items-center justify-center rotate-45">
                <Search className="text-muted w-8 h-8 -rotate-45" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-serif text-muted">等待选择数据项</h4>
                <p className="text-muted text-xs font-mono max-w-xs">
                  请从左侧的基础数值概览中选择一个具体项目，以查看全角色的实时能力排名。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
