import React, { useState, useMemo } from 'react';
import { Character, CharacterTraitCategory } from '../constants';
import { Trophy, ArrowUp, ArrowDown, Search, Activity, Shield, Zap, Target, RefreshCcw } from 'lucide-react';

interface Props {
  characters: Character[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export const Leaderboard = ({ characters, onRefresh, isAdmin }: Props) => {
  const [role, setRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [selectedTrait, setSelectedTrait] = useState<{ category: string, label: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    // Small delay to show the animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const baseInfo = useMemo(() => {
    const id = role === 'Survivor' ? 'base_survivor' : 'base_hunter';
    return characters.find(c => c.id === id);
  }, [characters, role]);

  const factionCharacters = useMemo(() => {
    return characters.filter(c => c.role === role && !c.id.startsWith('base_'));
  }, [characters, role]);

  // Helper to extract numeric value for sorting
  const extractValue = (valStr: string): number => {
    if (!valStr || valStr === 'N/A') return -Infinity;
    const match = valStr.match(/(-?\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : -Infinity;
  };

  const traitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!baseInfo?.traits) return counts;

    baseInfo.traits.forEach(cat => {
      cat.items.forEach(item => {
        const label = item.label;
        const uniqueValues = new Set<number>();
        factionCharacters.forEach(char => {
          const charItem = char.traits?.flatMap(t => t.items).find(i => i.label === label);
          if (charItem && charItem.value && charItem.value !== 'N/A') {
            const numVal = extractValue(charItem.value);
            if (numVal !== -Infinity) {
              uniqueValues.add(numVal);
            }
          }
        });
        counts[label] = uniqueValues.size;
      });
    });
    return counts;
  }, [baseInfo, factionCharacters]);

  const groupedRankedData = useMemo(() => {
    if (!selectedTrait) return [];

    const data = factionCharacters
      .map(char => {
        // Find item by label across all categories to avoid category name mismatch
        const item = char.traits?.flatMap(t => t.items).find(i => i.label === selectedTrait.label);
        
        return {
          id: char.id,
          name: char.name,
          title: char.title,
          imageUrl: char.imageUrl,
          value: item ? item.value : 'N/A',
          numericValue: item ? extractValue(item.value) : -Infinity
        };
      })
      .sort((a, b) => {
        if (a.numericValue === b.numericValue) return 0;
        // Always put N/A (-Infinity) at the bottom regardless of sort order
        if (a.numericValue === -Infinity) return 1;
        if (b.numericValue === -Infinity) return -1;
        
        return sortOrder === 'asc' ? a.numericValue - b.numericValue : b.numericValue - a.numericValue;
      });

    const groups: { rank: number, value: string, numericValue: number, characters: typeof data }[] = [];
    
    let currentRank = 1;
    data.forEach((item, index) => {
      // Skip characters with N/A or Infinity values from being ranked normally
      if (item.value === 'N/A' || item.numericValue === -Infinity) {
        groups.push({
          rank: 999, // Unranked
          value: 'N/A',
          numericValue: item.numericValue,
          characters: [item]
        });
        return;
      }

      if (index > 0 && item.numericValue === data[index - 1].numericValue) {
        groups[groups.length - 1].characters.push(item);
      } else {
        groups.push({
          rank: currentRank,
          value: item.value,
          numericValue: item.numericValue,
          characters: [item]
        });
        currentRank++;
      }
    });

    // Filter out unranked if needed, or keep them at the bottom
    return groups.filter(g => g.rank !== 999);
  }, [factionCharacters, selectedTrait, sortOrder]);

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

        <div className="flex items-center gap-4">
          {isAdmin && onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-border bg-card/50 text-muted hover:text-accent hover:border-accent transition-all group ${isRefreshing ? 'opacity-50' : ''}`}
              title="同步并刷新排序"
            >
              <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          )}
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
              {baseInfo?.traits && baseInfo.traits.length > 0 ? (
                <>
                  {baseInfo.traits.map((cat, i) => (
                    <div key={i} className="space-y-3">
                      <div className="text-xs text-primary font-bold uppercase tracking-widest border-b border-primary/20 pb-1">
                        {cat.category}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {cat.items.map((item, j) => (
                          <div 
                            key={j} 
                            onClick={() => setSelectedTrait({ category: cat.category, label: item.label })}
                            className={`flex justify-between items-center p-3 border transition-all cursor-pointer group ${
                              selectedTrait?.label === item.label 
                                ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(255,0,60,0.2)]' 
                                : 'bg-bg/20 border-border/30 text-text/80 hover:border-accent/50 hover:bg-bg/40'
                            }`}
                          >
                            <span className="text-sm font-mono font-bold">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${
                                selectedTrait?.label === item.label 
                                  ? 'bg-accent/20 border-accent/50 text-accent' 
                                  : 'bg-bg/50 border-border/50 text-muted group-hover:text-text/80'
                              }`}>
                                {traitCounts[item.label] || 0} 项
                              </span>
                              {selectedTrait?.label === item.label && <Activity className="w-4 h-4 text-accent animate-pulse" />}
                            </div>
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
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bg/50 border border-border hover:border-accent/50 text-xs font-mono text-muted hover:text-accent transition-all"
                  >
                    {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                    {sortOrder === 'desc' ? '降序排列 (从大到小)' : '升序排列 (从小到大)'}
                  </button>
                  <div className="text-[10px] font-mono text-muted">共 {factionCharacters.length} 名成员</div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {groupedRankedData.map((group) => (
                  <div 
                    key={group.rank} 
                    className={`flex items-center gap-6 p-4 border transition-all ${
                      group.rank === 1 ? 'bg-gold/10 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 
                      group.rank === 2 ? 'bg-accent/5 border-accent/30' :
                      group.rank === 3 ? 'bg-primary/5 border-primary/30' :
                      'bg-bg/40 border-border/50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-12 text-center font-mono font-bold flex-shrink-0">
                      {group.rank === 1 ? <span className="text-gold text-2xl">1</span> :
                       group.rank === 2 ? <span className="text-accent text-xl">2</span> :
                       group.rank === 3 ? <span className="text-primary text-lg">3</span> :
                       <span className="text-muted text-lg">{group.rank}</span>}
                    </div>
                    
                    {/* Characters (Parallel) */}
                    <div className="flex flex-wrap gap-4 flex-grow">
                      {groupedRankedData.length === 1 ? (
                        <div className="flex items-center gap-3 bg-bg/40 px-6 py-3 border border-border/30 hover:border-accent/50 transition-all group">
                          <div className="flex flex-col justify-center">
                            <div className="text-lg font-bold text-accent group-hover:text-primary transition-colors tracking-widest">
                              {role === 'Survivor' ? '所有求生者' : '所有监管者'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        group.characters.map(char => (
                          <div key={char.id} className="flex items-center gap-3 bg-bg/40 p-2 border border-border/30 hover:border-accent/50 transition-all group min-w-[120px]">
                            <div className="w-12 h-12 cyber-border overflow-hidden flex-shrink-0">
                              <img src={char.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="text-sm font-bold text-accent group-hover:text-primary transition-colors">{char.title}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <div className="text-xl font-mono font-bold text-accent">{group.value}</div>
                      {group.rank === 1 && <div className="text-[8px] text-gold font-bold uppercase tracking-widest">TOP RANK</div>}
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
