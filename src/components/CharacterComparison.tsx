import React, { useState, useMemo, useEffect } from 'react';
import { Character } from '../constants';
import { ShieldCheck, Swords, Zap, Timer, Move, Target, ChevronRight, Plus, Trash2, Settings2, X, Check, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterComparisonProps {
  allCharacters: Character[];
}

interface Preset {
  id: string;
  name: string;
  distance: number;
  description: string;
  survivorLabel: string;
  hunterLabel: string;
}

const DEFAULT_PRESETS: Preset[] = [
  { 
    id: 'flat', 
    name: '平地追击', 
    distance: 10, 
    description: '基础平地追击场景',
    survivorLabel: '跑动速度',
    hunterLabel: '移动速度'
  },
  { 
    id: 'vault', 
    name: '翻窗对比', 
    distance: 0, 
    description: '对比双方翻越窗户的时长',
    survivorLabel: '快速翻窗时长',
    hunterLabel: '跨过窗户时长'
  },
  { 
    id: 'pallet', 
    name: '板区博弈', 
    distance: 0, 
    description: '求生者翻板与监管者踩板时长对比',
    survivorLabel: '快速翻板时长',
    hunterLabel: '摧毁木板时长'
  },
];

export const CharacterComparison = ({ allCharacters }: CharacterComparisonProps) => {
  const survivors = useMemo(() => allCharacters.filter(c => c.role === 'Survivor'), [allCharacters]);
  const hunters = useMemo(() => allCharacters.filter(c => c.role === 'Hunter'), [allCharacters]);

  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string>(survivors[0]?.id || '');
  const [selectedHunterId, setSelectedHunterId] = useState<string>(hunters[0]?.id || '');
  const [distance, setDistance] = useState<number>(10);
  const [survivorLabel, setSurvivorLabel] = useState<string>('跑动速度');
  const [hunterLabel, setHunterLabel] = useState<string>('移动速度');
  
  const [rankingOpen, setRankingOpen] = useState<'Survivor' | 'Hunter' | null>(null);
  
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('vs_comparison_presets');
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });
  
  const [activePresetId, setActivePresetId] = useState<string | null>('flat');
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<Preset>>({ 
    name: '', 
    distance: 10, 
    description: '',
    survivorLabel: '跑动速度',
    hunterLabel: '移动速度'
  });

  useEffect(() => {
    localStorage.setItem('vs_comparison_presets', JSON.stringify(presets));
  }, [presets]);

  const selectedSurvivor = useMemo(() => survivors.find(s => s.id === selectedSurvivorId), [survivors, selectedSurvivorId]);
  const selectedHunter = useMemo(() => hunters.find(h => h.id === selectedHunterId), [hunters, selectedHunterId]);

  const parseStat = (char: Character | undefined, label: string): { value: number, unit: string } => {
    if (!char || !char.traits) return { value: 0, unit: '' };
    
    for (const category of char.traits) {
      const item = category.items.find(i => i.label === label || i.label.includes(label));
      if (item) {
        const match = item.value.match(/(\d+(\.\d+)?)/);
        const unit = item.value.includes('米/秒') ? 'm/s' : item.value.includes('秒') ? 's' : '';
        return { 
          value: match ? parseFloat(match[1]) : 0,
          unit
        };
      }
    }
    return { value: 0, unit: '' };
  };

  const getRankedList = (role: 'Survivor' | 'Hunter', label: string) => {
    const chars = role === 'Survivor' ? survivors : hunters;
    return chars
      .map(char => {
        const stat = parseStat(char, label);
        return { char, stat };
      })
      .filter(item => item.stat.value > 0)
      .sort((a, b) => {
        if (a.stat.unit === 'm/s') return b.stat.value - a.stat.value;
        return a.stat.value - b.stat.value;
      });
  };

  const sStat = useMemo(() => parseStat(selectedSurvivor, survivorLabel), [selectedSurvivor, survivorLabel]);
  const hStat = useMemo(() => parseStat(selectedHunter, hunterLabel), [selectedHunter, hunterLabel]);

  const isSpeedComparison = sStat.unit === 'm/s' && hStat.unit === 'm/s';

  const chaseTime = useMemo(() => {
    if (!isSpeedComparison) return null;
    if (hStat.value <= sStat.value) return Infinity;
    return distance / (hStat.value - sStat.value);
  }, [hStat.value, sStat.value, distance, isSpeedComparison]);

  const timeDiff = useMemo(() => {
    if (isSpeedComparison) return null;
    return hStat.value - sStat.value;
  }, [hStat.value, sStat.value, isSpeedComparison]);

  const handleApplyPreset = (preset: Preset) => {
    setDistance(preset.distance);
    setSurvivorLabel(preset.survivorLabel);
    setHunterLabel(preset.hunterLabel);
    setActivePresetId(preset.id);
  };

  const handleAddPreset = () => {
    if (!newPreset.name) return;
    const preset: Preset = {
      id: Date.now().toString(),
      name: newPreset.name,
      distance: newPreset.distance || 0,
      description: newPreset.description || '',
      survivorLabel: newPreset.survivorLabel || '跑动速度',
      hunterLabel: newPreset.hunterLabel || '移动速度',
    };
    setPresets([...presets, preset]);
    setNewPreset({ name: '', distance: 10, description: '', survivorLabel: '跑动速度', hunterLabel: '移动速度' });
    setShowAddModal(false);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-accent cyber-glow-text">VS 对比分析</h2>
          <p className="text-muted font-mono text-xs uppercase tracking-widest">VS COMPARISON_V1.1</p>
        </div>
        
        {/* Presets Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[10px] text-muted font-mono uppercase tracking-widest mr-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> 场景预设:
          </div>
          {presets.map(preset => (
            <div key={preset.id} className="relative group">
              <button
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all flex items-center gap-2 ${
                  activePresetId === preset.id 
                    ? 'bg-accent text-bg border-accent font-bold' 
                    : 'bg-bg/50 text-muted border-border hover:border-accent/50'
                }`}
              >
                {preset.name}
              </button>
              {isEditingPresets && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                  className="absolute -top-2 -right-2 bg-primary text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2 h-2" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 text-muted hover:text-accent transition-colors border border-dashed border-border hover:border-accent"
            title="添加预设"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditingPresets(!isEditingPresets)}
            className={`p-1 transition-colors ${isEditingPresets ? 'text-primary' : 'text-muted hover:text-accent'}`}
            title="管理预设"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Survivor Selection */}
        <div className="bg-card/30 border border-border p-6 space-y-2 relative">
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-widest mb-2">
            <ShieldCheck className="w-4 h-4" /> 选择求生者
          </div>
          
          <select 
            value={selectedSurvivorId}
            onChange={(e) => setSelectedSurvivorId(e.target.value)}
            className="w-full bg-bg border border-border px-4 py-2 text-sm font-mono focus:border-accent outline-none mb-2"
          >
            {survivors.map(s => (
              <option key={s.id} value={s.id}>{s.title} - {s.name}</option>
            ))}
          </select>

          {selectedSurvivor && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-bg/50 p-6 border border-border/50 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-mono uppercase tracking-wider">{survivorLabel}</span>
                    <button 
                      onClick={() => setRankingOpen(rankingOpen === 'Survivor' ? null : 'Survivor')}
                      className={`transition-colors ${rankingOpen === 'Survivor' ? 'text-white' : 'text-accent hover:text-white'}`}
                      title="查看排行榜"
                    >
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-2xl font-serif text-accent cyber-glow-text">{sStat.value} <span className="text-xs font-mono opacity-60">{sStat.unit}</span></span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000 shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" 
                    style={{ width: `${Math.min(100, (sStat.value / (sStat.unit === 'm/s' ? 6 : 3)) * 100)}%` }} 
                  />
                </div>

                {/* Inline Ranking Dropdown */}
                <AnimatePresence>
                  {rankingOpen === 'Survivor' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 z-20 bg-card border border-accent/30 shadow-2xl mt-1 max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      <div className="p-2 border-b border-border bg-accent/10 flex justify-between items-center sticky top-0 z-10">
                        <span className="text-[10px] font-mono text-accent uppercase tracking-widest">{survivorLabel} 排行</span>
                        <button onClick={() => setRankingOpen(null)}><X className="w-3 h-3 text-muted" /></button>
                      </div>
                      {getRankedList('Survivor', survivorLabel).map((item, idx) => (
                        <button
                          key={item.char.id}
                          onClick={() => {
                            setSelectedSurvivorId(item.char.id);
                            setRankingOpen(null);
                          }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-accent/10 transition-colors border-b border-border/30 last:border-0 ${
                            selectedSurvivorId === item.char.id ? 'bg-accent/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-muted w-4">{idx + 1}</span>
                            <img src={item.char.imageUrl} className="w-8 h-8 object-cover border border-border" referrerPolicy="no-referrer" />
                            <div className="text-left">
                              <div className="text-xs font-serif text-text">{item.char.name}</div>
                              <div className="text-[9px] text-muted font-mono uppercase">{item.char.title}</div>
                            </div>
                          </div>
                          <div className="text-xs font-mono text-accent">{item.stat.value} {item.stat.unit}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border border-border overflow-hidden relative group bg-bg/30 flex items-center justify-center">
                <img 
                  src={selectedSurvivor.imageUrl} 
                  className="w-full h-auto object-contain transition-all duration-500" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4">
                  <div className="text-accent font-serif text-xl">{selectedSurvivor.name}</div>
                  <div className="text-muted text-[10px] font-mono uppercase">{selectedSurvivor.title}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Comparison Result */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-card/50 border border-primary/30 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-primary/10 transition-all" />
            
            <div className="text-center space-y-6 relative z-10">
              <div className="text-[10px] text-primary font-mono uppercase tracking-[0.3em] mb-2">
                {isSpeedComparison ? '追击效率分析' : '动作时长对比'}
              </div>
              
              {isSpeedComparison && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-muted text-xs font-mono">初始距离 (M)</div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setDistance(Math.max(1, distance - 1)); setActivePresetId(null); }}
                      className="w-8 h-8 border border-border flex items-center justify-center hover:border-primary transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={distance}
                      onChange={(e) => { setDistance(Math.max(1, parseInt(e.target.value) || 1)); setActivePresetId(null); }}
                      className="w-20 bg-transparent border-b border-border text-center text-2xl font-serif text-text focus:border-primary outline-none"
                    />
                    <button 
                      onClick={() => { setDistance(distance + 1); setActivePresetId(null); }}
                      className="w-8 h-8 border border-border flex items-center justify-center hover:border-primary transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="py-8 border-y border-border/50">
                <div className="text-muted text-xs font-mono mb-4">
                  {isSpeedComparison ? '预计击中所需时长' : '监管者动作领先/落后'}
                </div>
                <div className="text-5xl font-serif text-primary cyber-glow-text">
                  {isSpeedComparison ? (
                    <>
                      {chaseTime === Infinity ? '∞' : chaseTime?.toFixed(2)}
                      <span className="text-sm ml-2">SEC</span>
                    </>
                  ) : (
                    <>
                      {timeDiff && timeDiff > 0 ? '+' : ''}{timeDiff?.toFixed(2)}
                      <span className="text-sm ml-2">SEC</span>
                    </>
                  )}
                </div>
                {isSpeedComparison && chaseTime === Infinity && (
                  <div className="text-[10px] text-primary mt-2 font-mono">监管者速度不足以追上求生者</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg/50 border border-border text-left">
                  <div className="text-xs text-muted font-mono uppercase mb-2 tracking-wider">
                    {isSpeedComparison ? '速度差' : '求生者数值'}
                  </div>
                  <div className="text-2xl font-serif text-accent cyber-glow-text">
                    {isSpeedComparison 
                      ? `${(hStat.value - sStat.value).toFixed(2)}`
                      : `${sStat.value}`
                    }
                    <span className="text-xs font-mono ml-1 opacity-60">{sStat.unit}</span>
                  </div>
                </div>
                <div className="p-4 bg-bg/50 border border-border text-left">
                  <div className="text-xs text-muted font-mono uppercase mb-2 tracking-wider">
                    {isSpeedComparison ? '追击难度' : '监管者数值'}
                  </div>
                  <div className={`text-2xl font-serif cyber-glow-text ${isSpeedComparison ? (chaseTime && chaseTime < 15 ? 'text-green-400' : chaseTime && chaseTime < 30 ? 'text-yellow-400' : 'text-primary') : 'text-primary'}`}>
                    {isSpeedComparison 
                      ? (chaseTime && chaseTime < 15 ? '容易' : chaseTime && chaseTime < 30 ? '中等' : '困难')
                      : `${hStat.value}`
                    }
                    {!isSpeedComparison && <span className="text-xs font-mono ml-1 opacity-60">{hStat.unit}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg/30 border border-border p-6 space-y-4">
            <h4 className="text-xs text-muted font-mono uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3" /> 战术建议
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-xs leading-relaxed">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-1" />
                <span className="text-muted">
                  {isSpeedComparison ? (
                    chaseTime && chaseTime < 15 
                      ? "监管者优势明显，建议直接追击。求生者需寻找板窗区进行牵制。" 
                      : "追击时间较长，监管者建议利用技能缩短距离，或考虑换人追击。"
                  ) : (
                    timeDiff && timeDiff < 0
                      ? "监管者交互速度快于求生者，可以尝试在交互点进行博弈或直接过窗。"
                      : "求生者交互更具优势，监管者建议利用封窗或踩板加速天赋应对。"
                  )}
                </span>
              </li>
              <li className="flex gap-3 text-xs leading-relaxed">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-1" />
                <span className="text-muted">
                  计算结果仅包含基础数值，未计算天赋（如：狩猎本能、破窗理论）及实体能力加成。
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Hunter Selection */}
        <div className="bg-card/30 border border-border p-6 space-y-2 relative">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest mb-2">
            <Swords className="w-4 h-4" /> 选择监管者
          </div>
          
          <select 
            value={selectedHunterId}
            onChange={(e) => setSelectedHunterId(e.target.value)}
            className="w-full bg-bg border border-border px-4 py-2 text-sm font-mono focus:border-primary outline-none mb-2"
          >
            {hunters.map(h => (
              <option key={h.id} value={h.id}>{h.title} - {h.name}</option>
            ))}
          </select>

          {selectedHunter && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-bg/50 p-6 border border-border/50 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-mono uppercase tracking-wider">{hunterLabel}</span>
                    <button 
                      onClick={() => setRankingOpen(rankingOpen === 'Hunter' ? null : 'Hunter')}
                      className={`transition-colors ${rankingOpen === 'Hunter' ? 'text-white' : 'text-primary hover:text-white'}`}
                      title="查看排行榜"
                    >
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-2xl font-serif text-primary cyber-glow-text">{hStat.value} <span className="text-xs font-mono opacity-60">{hStat.unit}</span></span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                    style={{ width: `${Math.min(100, (hStat.value / (hStat.unit === 'm/s' ? 6 : 3)) * 100)}%` }} 
                  />
                </div>

                {/* Inline Ranking Dropdown */}
                <AnimatePresence>
                  {rankingOpen === 'Hunter' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 z-20 bg-card border border-primary/30 shadow-2xl mt-1 max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      <div className="p-2 border-b border-border bg-primary/10 flex justify-between items-center sticky top-0 z-10">
                        <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{hunterLabel} 排行</span>
                        <button onClick={() => setRankingOpen(null)}><X className="w-3 h-3 text-muted" /></button>
                      </div>
                      {getRankedList('Hunter', hunterLabel).map((item, idx) => (
                        <button
                          key={item.char.id}
                          onClick={() => {
                            setSelectedHunterId(item.char.id);
                            setRankingOpen(null);
                          }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0 ${
                            selectedHunterId === item.char.id ? 'bg-primary/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-muted w-4">{idx + 1}</span>
                            <img src={item.char.imageUrl} className="w-8 h-8 object-cover border border-border" referrerPolicy="no-referrer" />
                            <div className="text-left">
                              <div className="text-xs font-serif text-text">{item.char.name}</div>
                              <div className="text-[9px] text-muted font-mono uppercase">{item.char.title}</div>
                            </div>
                          </div>
                          <div className="text-xs font-mono text-primary">{item.stat.value} {item.stat.unit}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border border-border overflow-hidden relative group bg-bg/30 flex items-center justify-center">
                <img 
                  src={selectedHunter.imageUrl} 
                  className="w-full h-auto object-contain transition-all duration-500" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4">
                  <div className="text-primary font-serif text-xl">{selectedHunter.name}</div>
                  <div className="text-muted text-[10px] font-mono uppercase">{selectedHunter.title}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Preset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border p-6 w-full max-w-md space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif text-accent">添加对比预设</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted font-mono uppercase">预设名称</label>
                  <input 
                    type="text" 
                    value={newPreset.name}
                    onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="例如: 翻窗博弈"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-mono uppercase">求生者数据项</label>
                    <select 
                      value={newPreset.survivorLabel}
                      onChange={(e) => setNewPreset({ ...newPreset, survivorLabel: e.target.value })}
                      className="w-full bg-bg border border-border px-3 py-2 text-xs font-mono focus:border-accent outline-none"
                    >
                      <option value="跑动速度">跑动速度</option>
                      <option value="快速翻窗时长">快速翻窗时长</option>
                      <option value="快速翻板时长">快速翻板时长</option>
                      <option value="放板时间">放板时间</option>
                      <option value="密码机破译时长">破译时长</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-mono uppercase">监管者数据项</label>
                    <select 
                      value={newPreset.hunterLabel}
                      onChange={(e) => setNewPreset({ ...newPreset, hunterLabel: e.target.value })}
                      className="w-full bg-bg border border-border px-3 py-2 text-xs font-mono focus:border-accent outline-none"
                    >
                      <option value="移动速度">移动速度</option>
                      <option value="跨过窗户时长">跨过窗户时长</option>
                      <option value="摧毁木板时长">摧毁木板时长</option>
                      <option value="普通攻击前摇">攻击前摇</option>
                      <option value="被砸眩晕时长">被砸眩晕时长</option>
                    </select>
                  </div>
                </div>

                {newPreset.survivorLabel === '跑动速度' && newPreset.hunterLabel === '移动速度' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-mono uppercase">初始距离 (M)</label>
                    <input 
                      type="number" 
                      value={newPreset.distance}
                      onChange={(e) => setNewPreset({ ...newPreset, distance: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] text-muted font-mono uppercase">描述 (可选)</label>
                  <textarea 
                    value={newPreset.description}
                    onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none min-h-[60px]"
                    placeholder="预设场景描述..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleAddPreset}
                  className="flex-1 bg-accent text-bg py-2 text-sm font-bold hover:bg-accent/80 transition-colors"
                >
                  确认添加
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-border text-muted py-2 text-sm font-mono hover:bg-border/30 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
