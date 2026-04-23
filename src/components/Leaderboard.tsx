import React, { useState, useMemo, useEffect } from 'react';
import { Character, CharacterTraitCategory } from '../constants';
import { Trophy, ArrowUp, ArrowDown, Search, Activity, Shield, Zap, Target, RefreshCcw, ChevronRight, Plus, Trash2, Edit3, Check, X, Calculator, Maximize2, Minimize2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CharacterComparison } from './CharacterComparison';

interface CustomMetric {
  id: string;
  name: string;
  role: 'Survivor' | 'Hunter';
  traitLabels: string[];
  authorId: string;
}

interface Props {
  characters: Character[];
  onRefresh?: () => void;
  isAdmin?: boolean;
  initialTrait?: { role: 'Survivor' | 'Hunter', label: string } | null;
  onUpdate?: (charId: string, data: Partial<Character>) => Promise<void>;
}

export const Leaderboard = ({ characters, onRefresh, isAdmin, initialTrait, onUpdate }: Props) => {
  const [showComparison, setShowComparison] = useState(false);
  const [role, setRole] = useState<'Survivor' | 'Hunter'>(initialTrait?.role || 'Survivor');
  const [selectedTrait, setSelectedTrait] = useState<{ category: string, label: string } | null>(() => {
    if (initialTrait) {
      return { category: '', label: initialTrait.label };
    }
    return null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);
  const [selectedCustomMetric, setSelectedCustomMetric] = useState<CustomMetric | null>(null);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [newMetric, setNewMetric] = useState<{ name: string, traitLabels: string[] }>({ name: '', traitLabels: [] });
  const [editingRemark, setEditingRemark] = useState<{ charId: string, traitLabel: string, valueStr: string, currentRemark: string } | null>(null);
  const [leaderboardConfig, setLeaderboardConfig] = useState<{ survivorTraits: CharacterTraitCategory[], hunterTraits: CharacterTraitCategory[] }>({ survivorTraits: [], hunterTraits: [] });
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Disable body scroll when full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreen]);

  // Fetch leaderboard config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_configs', 'leaderboard'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLeaderboardConfig({
          survivorTraits: data.survivorTraits || [],
          hunterTraits: data.hunterTraits || []
        });
      } else {
        // Fallback to base characters if config doesn't exist
        const survivorBase = characters.find(c => c.id === 'base_survivor');
        const hunterBase = characters.find(c => c.id === 'base_hunter');
        setLeaderboardConfig({
          survivorTraits: survivorBase?.traits || [],
          hunterTraits: hunterBase?.traits || []
        });
      }
    }, (error) => {
      console.error("Error fetching leaderboard config:", error);
    });
    return () => unsub();
  }, [characters]);

  // Fetch custom metrics
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_metrics'), (snapshot) => {
      const metrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomMetric));
      setCustomMetrics(metrics.filter(m => m.role === role));
    });
    return () => unsub();
  }, [role]);

  // Fetch character remarks (independent per trait value)
  const [traitRemarks, setTraitRemarks] = useState<Record<string, string>>({});
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'trait_remarks'), (snapshot) => {
      const remarks: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        remarks[doc.id] = doc.data().remark;
      });
      setTraitRemarks(remarks);
    });
    return () => unsub();
  }, []);

  // Update state if initialTrait changes (e.g. from comparison page)
  React.useEffect(() => {
    if (initialTrait) {
      setRole(initialTrait.role);
      setSelectedTrait({ category: '', label: initialTrait.label });
    }
  }, [initialTrait]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    // Small delay to show the animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleCreateMetric = async () => {
    if (!newMetric.name || newMetric.traitLabels.length === 0) return;
    if (!auth.currentUser) {
      alert("请先登录以保存自定义项。");
      return;
    }

    try {
      await addDoc(collection(db, 'custom_metrics'), {
        name: newMetric.name,
        role: role,
        traitLabels: newMetric.traitLabels,
        authorId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
      setNewMetric({ name: '', traitLabels: [] });
      setShowMetricForm(false);
    } catch (err) {
      console.error("Error creating custom metric:", err);
    }
  };

  const handleDeleteMetric = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("确定要删除这个自定义项吗？")) return;
    try {
      await deleteDoc(doc(db, 'custom_metrics', id));
      if (selectedCustomMetric?.id === id) {
        setSelectedCustomMetric(null);
      }
    } catch (err) {
      console.error("Error deleting custom metric:", err);
    }
  };

  const handleSaveRemark = async () => {
    if (!editingRemark) return;
    const remarkId = `${editingRemark.charId}_${editingRemark.traitLabel}_${editingRemark.valueStr}`.replace(/[.#$/[\]]/g, '_');
    try {
      await setDoc(doc(db, 'trait_remarks', remarkId), {
        charId: editingRemark.charId,
        traitLabel: editingRemark.traitLabel,
        valueStr: editingRemark.valueStr,
        remark: editingRemark.currentRemark,
        updatedAt: serverTimestamp()
      });
      setEditingRemark(null);
    } catch (err) {
      console.error("Error saving remark:", err);
    }
  };

  const factionCharacters = useMemo(() => {
    return characters.filter(c => c.role === role && !c.id.startsWith('base_'));
  }, [characters, role]);

  // Helper to extract numeric value for sorting
  const extractValue = (valStr: string): number => {
    if (!valStr || valStr === 'N/A') return -Infinity;
    // Handle cases like "4.64 / 4.82" by taking the first number if not already split
    // But since we split before calling this, it should be fine.
    // We use a more robust regex for numbers
    const match = valStr.match(/(-?\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : -Infinity;
  };

  const handleSaveConfig = async (newConfig: { survivorTraits: CharacterTraitCategory[], hunterTraits: CharacterTraitCategory[] }) => {
    try {
      await setDoc(doc(db, 'system_configs', 'leaderboard'), {
        ...newConfig,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving leaderboard config:", err);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newConfig = { ...leaderboardConfig };
    const traits = role === 'Survivor' ? newConfig.survivorTraits : newConfig.hunterTraits;
    traits.push({ category: newCategoryName.trim(), items: [] });
    handleSaveConfig(newConfig);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (index: number) => {
    if (!window.confirm("确定要删除这个分类及其所有项目吗？")) return;
    const newConfig = { ...leaderboardConfig };
    const traits = role === 'Survivor' ? newConfig.survivorTraits : newConfig.hunterTraits;
    traits.splice(index, 1);
    handleSaveConfig(newConfig);
  };

  const handleAddItem = (catIndex: number) => {
    if (!newItemLabel.trim()) return;
    const newConfig = { ...leaderboardConfig };
    const traits = role === 'Survivor' ? newConfig.survivorTraits : newConfig.hunterTraits;
    traits[catIndex].items.push({ label: newItemLabel.trim(), value: '0' });
    handleSaveConfig(newConfig);
    setNewItemLabel('');
    setActiveCategoryIndex(null);
  };

  const handleDeleteItem = (catIndex: number, itemIndex: number) => {
    const newConfig = { ...leaderboardConfig };
    const traits = role === 'Survivor' ? newConfig.survivorTraits : newConfig.hunterTraits;
    traits[catIndex].items.splice(itemIndex, 1);
    handleSaveConfig(newConfig);
  };

  const currentTraits = useMemo(() => {
    return role === 'Survivor' ? leaderboardConfig.survivorTraits : leaderboardConfig.hunterTraits;
  }, [leaderboardConfig, role]);

  const traitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!currentTraits) return counts;

    currentTraits.forEach(cat => {
      cat.items.forEach(item => {
        const label = item.label;
        const uniqueValues = new Set<number>();
        factionCharacters.forEach(char => {
          const matchingItems = char.traits?.flatMap(t => t.items).filter(i => i.label === label) || [];
          matchingItems.forEach(charItem => {
            if (charItem && charItem.value && charItem.value !== 'N/A') {
              // Support multiple values split by '/' or other separators
              const parts = charItem.value.split(/[/／、,，]/);
              parts.forEach(part => {
                const numVal = extractValue(part.trim());
                if (numVal !== -Infinity) {
                  uniqueValues.add(numVal);
                }
              });
            }
          });
        });
        counts[label] = uniqueValues.size;
      });
    });
    return counts;
  }, [currentTraits, factionCharacters]);

  const groupedRankedData = useMemo(() => {
    if (!selectedTrait && !selectedCustomMetric) return [];

    const explodedData: any[] = [];

    factionCharacters.forEach(char => {
      if (selectedCustomMetric) {
        const charTraits = char.traits?.flatMap(t => t.items) || [];
        const values = selectedCustomMetric.traitLabels.map(label => {
          const item = charTraits.find(i => i.label === label);
          return item ? extractValue(item.value) : 0;
        });
        
        const validValues = values.filter(v => v !== -Infinity);
        if (validValues.length > 0) {
          const numericValue = validValues.reduce((sum, v) => sum + v, 0);
          explodedData.push({
            id: char.id,
            name: char.name,
            title: char.title,
            imageUrl: char.imageUrl,
            value: numericValue.toString(),
            numericValue
          });
        }
      } else if (selectedTrait) {
        const matchingItems = char.traits?.flatMap(t => t.items).filter(i => i.label === selectedTrait.label) || [];
        
        if (matchingItems.length > 0) {
          matchingItems.forEach(item => {
            if (item && item.value && item.value !== 'N/A') {
              // Support multiple values split by '/', '／', '、', or commas
              const parts = item.value.split(/[/／、,，]/);
              parts.forEach(part => {
                const trimmedPart = part.trim();
                if (!trimmedPart) return;
                
                const numVal = extractValue(trimmedPart);
                // Only add if it contains a valid number
                if (numVal !== -Infinity) {
                  explodedData.push({
                    id: char.id,
                    name: char.name,
                    title: char.title,
                    imageUrl: char.imageUrl,
                    value: trimmedPart,
                    numericValue: numVal
                  });
                }
              });
            }
          });
        }
      }
    });

    const sortedData = explodedData.sort((a, b) => {
      if (a.numericValue === b.numericValue) {
        // Find respective character objects to get their secondary sort criteria
        const charA = characters.find(c => c.id === a.id);
        const charB = characters.find(c => c.id === b.id);
        const orderA = charA?.order ?? 999;
        const orderB = charB?.order ?? 999;
        
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      }
      if (a.numericValue === -Infinity) return 1;
      if (b.numericValue === -Infinity) return -1;
      
      return sortOrder === 'asc' ? a.numericValue - b.numericValue : b.numericValue - a.numericValue;
    });

    const groups: { rank: number, value: string, numericValue: number, characters: any[] }[] = [];
    
    let currentRank = 1;
    sortedData.forEach((item, index) => {
      if (item.value === 'N/A' || item.numericValue === -Infinity) {
        return;
      }

      if (index > 0 && item.numericValue === sortedData[index - 1].numericValue) {
        const lastGroup = groups[groups.length - 1];
        lastGroup.characters.push(item);
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

    return groups;
  }, [factionCharacters, selectedTrait, selectedCustomMetric, sortOrder]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border pb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-serif font-bold text-accent cyber-glow-text flex items-center gap-4">
              <Trophy className="w-10 h-10 text-gold" /> 庄园能力排行榜
            </h2>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-2 px-4 py-2 border transition-all font-mono text-xs font-bold uppercase tracking-widest ${
                showComparison 
                  ? 'bg-accent text-bg border-accent shadow-[0_0_15px_rgba(255,0,60,0.4)]' 
                  : 'bg-card/50 border-border text-muted hover:text-accent hover:border-accent'
              }`}
            >
              <Zap className={`w-4 h-4 ${showComparison ? 'animate-pulse' : ''}`} />
              {showComparison ? '返回排行榜_BACK' : 'VS 对比系统_VS_COMPARE'}
            </button>
          </div>
          <p className="text-muted text-xs font-mono mt-2 uppercase tracking-widest md:ml-4">Neural Leaderboard System v2.1</p>
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

      {showComparison ? (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <CharacterComparison allCharacters={characters} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Base Info Section */}
          <div className={`${isFullScreen ? 'hidden' : 'lg:col-span-4'} space-y-6`}>
            <div className="bg-card/30 border border-border p-6 cyber-border relative overflow-hidden flex flex-col h-[800px]">
              <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                <Activity className="w-24 h-24" />
              </div>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-serif text-accent flex items-center gap-2">
                  <Shield className="w-5 h-5" /> 阵营基础数值概览
                </h3>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingConfig(!isEditingConfig)}
                      className={`p-1.5 border transition-all ${isEditingConfig ? 'bg-accent border-accent text-bg shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'border-accent/30 text-accent hover:bg-accent/10'}`}
                      title="管理概览项目"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowMetricForm(prev => !prev)}
                    className={`p-1.5 border transition-all ${showMetricForm ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(255,0,60,0.3)]' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                    title="创建自定义计算项"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditingConfig && isAdmin && (
                <div className="mb-6 p-4 bg-accent/5 border border-accent/30 space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-accent uppercase font-bold">管理概览项目</span>
                    <button onClick={() => setIsEditingConfig(false)} className="text-muted hover:text-accent"><X className="w-3 h-3" /></button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="新分类名称..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-bg/50 border border-border p-2 text-xs font-mono outline-none focus:border-accent"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-accent text-bg text-[10px] font-mono font-bold hover:bg-accent/80"
                    >
                      添加分类
                    </button>
                  </div>
                </div>
              )}

              {showMetricForm && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/30 space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-primary uppercase">创建自定义计算项</span>
                    <button onClick={() => setShowMetricForm(false)} className="text-muted hover:text-primary"><X className="w-3 h-3" /></button>
                  </div>
                  <input 
                    type="text"
                    placeholder="计算项名称 (如: 综合生存力)"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                    className="w-full bg-bg/50 border border-border p-2 text-xs font-mono outline-none focus:border-primary"
                  />
                  <div className="max-h-40 overflow-y-auto border border-border/30 p-2 space-y-1 bg-bg/20">
                    {currentTraits?.flatMap(t => t.items).map(item => (
                      <label key={item.label} className="flex items-center gap-2 text-[10px] font-mono text-muted hover:text-text cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newMetric.traitLabels.includes(item.label)}
                          onChange={(e) => {
                            const labels = e.target.checked 
                              ? [...newMetric.traitLabels, item.label]
                              : newMetric.traitLabels.filter(l => l !== item.label);
                            setNewMetric({ ...newMetric, traitLabels: labels });
                          }}
                          className="w-3 h-3 accent-primary"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  <button 
                    onClick={handleCreateMetric}
                    disabled={!newMetric.name || newMetric.traitLabels.length === 0}
                    className="w-full py-2 bg-primary text-white text-[10px] font-mono hover:bg-primary/80 disabled:opacity-50"
                  >
                    保存计算项_SAVE
                  </button>
                </div>
              )}
              
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {/* Custom Metrics Section */}
                {customMetrics.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-accent font-bold uppercase tracking-widest border-b border-accent/20 pb-1 flex items-center gap-2">
                      <Calculator className="w-3 h-3" /> 自定义计算项
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {customMetrics.map((metric) => (
                        <div 
                          key={metric.id} 
                          onClick={() => {
                            setSelectedCustomMetric(metric);
                            setSelectedTrait(null);
                          }}
                          className={`flex justify-between items-center p-3 border transition-all cursor-pointer group ${
                            selectedCustomMetric?.id === metric.id 
                              ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(255,0,60,0.2)]' 
                              : 'bg-bg/20 border-border/30 text-text/80 hover:border-accent/50 hover:bg-bg/40'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-mono font-bold">{metric.name}</span>
                            <span className="text-[8px] text-muted uppercase tracking-tighter">
                              {metric.traitLabels.join(' + ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <button 
                                onClick={(e) => handleDeleteMetric(metric.id, e)}
                                className="p-1 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {selectedCustomMetric?.id === metric.id && <Activity className="w-4 h-4 text-accent animate-pulse" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentTraits && currentTraits.length > 0 ? (
                  <>
                    {currentTraits.map((cat, i) => (
                      <div key={i} className="space-y-3">
                        <div className="text-xs text-primary font-bold uppercase tracking-widest border-b border-primary/20 pb-1 flex justify-between items-center">
                          <span>{cat.category}</span>
                          {isEditingConfig && isAdmin && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setActiveCategoryIndex(activeCategoryIndex === i ? null : i)}
                                className="text-accent hover:text-accent/80"
                                title="添加项目"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategory(i)}
                                className="text-primary hover:text-primary/80"
                                title="删除分类"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditingConfig && isAdmin && activeCategoryIndex === i && (
                          <div className="flex gap-2 p-2 bg-accent/5 border border-accent/20 animate-in slide-in-from-top-1">
                            <input 
                              type="text"
                              placeholder="新项目名称..."
                              value={newItemLabel}
                              onChange={(e) => setNewItemLabel(e.target.value)}
                              className="flex-1 bg-bg/50 border border-border p-1 text-[10px] font-mono outline-none focus:border-accent"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleAddItem(i)}
                              className="px-2 py-1 bg-accent text-bg text-[10px] font-mono font-bold"
                            >
                              添加
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-1">
                          {cat.items.map((item, j) => (
                            <div 
                              key={j} 
                              onClick={() => {
                                if (!isEditingConfig) {
                                  setSelectedTrait({ category: cat.category, label: item.label });
                                  setSelectedCustomMetric(null);
                                }
                              }}
                              className={`flex justify-between items-center p-3 border transition-all group ${
                                selectedTrait?.label === item.label 
                                  ? 'bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(255,0,60,0.2)]' 
                                  : 'bg-bg/20 border-border/30 text-text/80 hover:border-accent/50 hover:bg-bg/40'
                              } ${isEditingConfig ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              <span className="text-sm font-mono font-bold">{item.label}</span>
                              <div className="flex items-center gap-2">
                                {isEditingConfig && isAdmin ? (
                                  <button 
                                    onClick={() => handleDeleteItem(i, j)}
                                    className="p-1 text-muted hover:text-primary"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <>
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${
                                      selectedTrait?.label === item.label 
                                        ? 'bg-accent/20 border-accent/50 text-accent' 
                                        : 'bg-bg/50 border-border/50 text-muted group-hover:text-text/80'
                                    }`}>
                                      {traitCounts[item.label] || 0} 项
                                    </span>
                                    {selectedTrait?.label === item.label && <Activity className="w-4 h-4 text-accent animate-pulse" />}
                                  </>
                                )}
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
          <div className={`${isFullScreen ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
            {selectedTrait || selectedCustomMetric ? (
              <div className={`flex flex-col ${isFullScreen ? 'fixed inset-0 z-[9999] bg-bg p-4 md:p-8 overflow-hidden' : 'bg-card/30 border border-border h-[800px] p-6 cyber-border'}`}>
                <div className={`flex justify-between items-start mb-4 border-b border-border pb-4 flex-shrink-0 ${isFullScreen ? 'max-w-7xl mx-auto w-full' : ''}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent animate-pulse" />
                      <div className="text-[10px] text-primary font-bold uppercase tracking-[0.1em]">
                        {selectedCustomMetric ? '自定义计算' : selectedTrait?.category}
                      </div>
                    </div>
                    <h3 className={`${isFullScreen ? 'text-4xl' : 'text-2xl'} font-serif text-accent cyber-glow-text`}>
                      {selectedCustomMetric ? selectedCustomMetric.name : selectedTrait?.label} 排行榜
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1 text-right">
                      <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-2 px-3 py-1 bg-bg/50 border border-border hover:border-accent group transition-all"
                      >
                        {sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-accent" /> : <ArrowUp className="w-3.5 h-3.5 text-accent" />}
                        <span className="text-[10px] font-mono text-muted group-hover:text-accent">{sortOrder === 'desc' ? '降序' : '升序'}</span>
                      </button>
                      <div className="text-[9px] font-mono text-muted uppercase opacity-60">TOTAL: {factionCharacters.length}</div>
                    </div>
                    
                    <button
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className="p-2 border border-accent/50 bg-accent/5 text-accent hover:bg-accent hover:text-bg transition-all flex items-center justify-center"
                      title={isFullScreen ? "退出全屏" : "全屏模式"}
                    >
                      {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className={`flex-grow overflow-y-auto custom-scrollbar ${isFullScreen ? 'px-2 max-w-7xl mx-auto w-full' : 'pr-2'}`}>
                  <div className="grid grid-cols-1 gap-1.5 pb-4">
                    {groupedRankedData.map((group) => (
                      <div 
                        key={group.rank} 
                        className={`flex items-center gap-3 p-2 border transition-all ${
                          group.rank === 1 ? 'bg-gold/10 border-gold/50' : 
                          group.rank === 2 ? 'bg-accent/5 border-accent/20' :
                          group.rank === 3 ? 'bg-primary/5 border-primary/30' :
                          'bg-bg/40 border-border/30'
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-10 text-center font-mono font-bold flex-shrink-0">
                          {group.rank === 1 ? <span className="text-gold text-xl">1</span> :
                           group.rank === 2 ? <span className="text-accent text-lg">2</span> :
                           group.rank === 3 ? <span className="text-primary text-base">3</span> :
                           <span className="text-muted text-sm">{group.rank}</span>}
                        </div>
                        
                        {/* Characters */}
                        <div className="flex flex-wrap gap-x-3 gap-y-2 flex-grow py-1">
                          {group.characters.map((char, idx) => {
                            const traitLabel = selectedTrait?.label || selectedCustomMetric?.name || 'custom';
                            const remarkId = `${char.id}_${traitLabel}_${char.value}`.replace(/[.#$/[\]]/g, '_');
                            const remark = traitRemarks[remarkId] || '';
                            const isEditing = editingRemark?.charId === char.id && editingRemark?.valueStr === char.value;

                            return (
                              <div key={`${char.id}-${idx}`} className={`flex flex-col items-center gap-1 group relative ${isFullScreen ? 'w-28' : 'w-20'}`}>
                                <div 
                                  className={`aspect-square w-full cyber-border overflow-hidden flex-shrink-0 cursor-pointer transition-all ${isAdmin ? 'hover:ring-1 hover:ring-accent' : ''}`}
                                  onClick={() => {
                                    if (isAdmin) {
                                      setEditingRemark({ 
                                        charId: char.id, 
                                        traitLabel: traitLabel,
                                        valueStr: char.value,
                                        currentRemark: remark 
                                      });
                                    }
                                  }}
                                >
                                  <img src={char.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                </div>
                                <div className="w-full text-center">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        autoFocus
                                        type="text"
                                        value={editingRemark.currentRemark}
                                        onChange={(e) => setEditingRemark({ ...editingRemark, currentRemark: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveRemark();
                                          if (e.key === 'Escape') setEditingRemark(null);
                                        }}
                                        className="w-full bg-bg border border-accent text-[10px] px-1 py-0.5 outline-none font-mono"
                                        placeholder="..."
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex flex-col overflow-hidden leading-tight">
                                      <div className={`${isFullScreen ? 'text-xs' : 'text-[10px]'} font-bold text-accent group-hover:text-primary transition-colors truncate w-full tracking-tighter uppercase`}>
                                        {char.title}
                                      </div>
                                      {remark && (
                                        <div className={`${isFullScreen ? 'text-[10px]' : 'text-[8px]'} text-primary font-mono opacity-80 truncate w-full tracking-tighter`}>
                                          [{remark}]
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Value */}
                        <div className="text-right flex-shrink-0 min-w-[80px]">
                          <div className="text-lg font-mono font-bold text-accent leading-none">
                            {group.value.split(/[（(]/)[0].trim()}
                          </div>
                          {group.value && (group.value.includes('(') || group.value.includes('（')) && (
                            <div className="text-[9px] text-muted font-normal leading-tight mt-0.5 max-w-[100px] ml-auto opacity-70">
                              {group.value.substring(group.value.search(/[（(]/))}
                            </div>
                          )}
                          {group.rank === 1 && <div className="text-[8px] text-gold font-bold uppercase tracking-widest mt-1">TOP RANK</div>}
                        </div>
                      </div>
                    ))}
                  </div>
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
      )}
    </div>
  );
};
