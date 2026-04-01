import React, { useState, useEffect, useMemo } from 'react';
import { Character, CharacterTraitCategory } from '../constants';
import { 
  Swords, 
  ShieldCheck, 
  Clock, 
  Users, 
  Activity, 
  Zap, 
  Heart, 
  AlertTriangle,
  ChevronRight,
  UserCircle,
  Skull,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  allCharacters: Character[];
}

type SurvivorStatus = 'healthy' | 'wounded' | 'downed' | 'chaired' | 'eliminated';

interface SurvivorSlot {
  character: Character | null;
  status: SurvivorStatus;
  isSelf: boolean;
}

export const CombatSimulator = ({ allCharacters }: Props) => {
  const [selectedHunter, setSelectedHunter] = useState<Character | null>(null);
  const [survivorSlots, setSurvivorSlots] = useState<SurvivorSlot[]>([
    { character: null, status: 'healthy', isSelf: true },
    { character: null, status: 'healthy', isSelf: false },
    { character: null, status: 'healthy', isSelf: false },
    { character: null, status: 'healthy', isSelf: false },
  ]);
  
  const [gameTime, setGameTime] = useState(0); // in seconds
  const [decodingProgress, setDecodingProgress] = useState(0); // 0-500% (5 machines)
  const [hunterPresence, setHunterPresence] = useState(0); // 0, 1, 2
  const [hasBorrowedTime, setHasBorrowedTime] = useState(true);
  const [hasDetention, setHasDetention] = useState(true);
  
  const survivors = useMemo(() => allCharacters.filter(c => c.role === 'Survivor' && !c.id.startsWith('base_')), [allCharacters]);
  const hunters = useMemo(() => allCharacters.filter(c => c.role === 'Hunter' && !c.id.startsWith('base_')), [allCharacters]);

  const selfSlot = survivorSlots.find(s => s.isSelf);
  const selfCharacter = selfSlot?.character;

  // Helper to get numeric value from trait string (e.g., "3.8米/秒" -> 3.8)
  const parseValue = (val: string) => {
    const match = val.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Dynamic Trait Calculation Logic
  const calculateTraits = (baseTraits: CharacterTraitCategory[] | undefined): CharacterTraitCategory[] => {
    if (!baseTraits) return [];
    
    // Deep clone base traits
    const currentTraits: CharacterTraitCategory[] = JSON.parse(JSON.stringify(baseTraits));
    
    // Apply modifiers based on game state
    currentTraits.forEach(category => {
      category.items.forEach(item => {
        let numericValue = parseValue(item.value);
        let unit = item.value.replace(/[\d.]/g, '');
        
        // Example Rule: Mechanic (特蕾西) Debuff
        if (selfCharacter?.id === 's10' && item.label === '密码机破译时长') {
          const woundedCount = survivorSlots.filter(s => s.status === 'wounded' || s.status === 'downed' || s.status === 'chaired').length;
          if (woundedCount > 0) {
            // Each wounded teammate reduces decoding speed by 35% (stacks)
            // Speed = BaseSpeed / (1 - 0.35 * count) -> Time = BaseTime / (1 - 0.35 * count)
            // Actually in ID5 it's a speed reduction, so time increases.
            // Simplified: Time = BaseTime * (1 + 0.45 * woundedCount)
            numericValue = numericValue * (1 + 0.45 * woundedCount);
          }
        }

        // Example Rule: Hunter Presence Speed
        if (selectedHunter && item.label === '移动速度' && selfCharacter?.role === 'Hunter') {
          if (hunterPresence === 1) numericValue += 0.1;
          if (hunterPresence === 2) numericValue += 0.2;
          
          // Detention (一刀切) movement speed buff (5%)
          if (hasDetention && decodingProgress >= 500) {
            numericValue *= 1.05;
          }
        }

        // Example Rule: Borrowed Time (回光返照) speed buff
        if (selfCharacter?.role === 'Survivor' && hasBorrowedTime && decodingProgress >= 500 && item.label === '移动速度') {
          // In game it's 50% for 5s, but here we simulate the "active" state or a general buff
          numericValue *= 1.5;
        }

        // Example Rule: Game Time Scaling (e.g. late game acceleration)
        if (gameTime > 180 && item.label === '密码机破译时长') {
          numericValue *= 0.9; // 10% faster after 3 mins
        }

        // Update the value string
        if (numericValue > 0) {
          item.value = `${numericValue.toFixed(2)}${unit}`;
        }
      });
    });

    return currentTraits;
  };

  const dynamicTraits = useMemo(() => calculateTraits(selfCharacter?.traits), [selfCharacter, survivorSlots, gameTime, hunterPresence, selectedHunter]);

  const updateSurvivor = (index: number, charId: string) => {
    const char = survivors.find(c => c.id === charId) || null;
    const newSlots = [...survivorSlots];
    newSlots[index].character = char;
    setSurvivorSlots(newSlots);
  };

  const updateStatus = (index: number, status: SurvivorStatus) => {
    const newSlots = [...survivorSlots];
    newSlots[index].status = status;
    setSurvivorSlots(newSlots);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-accent flex items-center gap-3">
            <Swords className="w-6 h-6" /> 实战模拟器_COMBAT_SIM
          </h2>
          <p className="text-xs font-mono text-muted mt-1 uppercase tracking-widest">动态特质演算系统 v1.2</p>
        </div>
        <div className="flex items-center gap-4 bg-card/50 px-4 py-2 border border-border">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted uppercase font-mono">当前演算目标</span>
            <span className="text-sm font-bold text-primary">{selfCharacter?.title || '未选择'}</span>
          </div>
          <div className="w-10 h-10 bg-bg border border-primary/30 flex items-center justify-center">
            {selfCharacter ? (
              <img src={selfCharacter.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserCircle className="w-6 h-6 text-muted" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          {/* Character Selection */}
          <section className="bg-card/30 border border-border p-6 space-y-6">
            <h3 className="text-sm font-bold text-text font-mono uppercase tracking-widest border-l-2 border-primary pl-3">
              角色配置_UNITS
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted uppercase font-mono">监管者 HUNTER</label>
                <select 
                  className="w-full bg-bg border border-border text-sm p-2 outline-none focus:border-accent"
                  value={selectedHunter?.id || ''}
                  onChange={(e) => setSelectedHunter(hunters.find(h => h.id === e.target.value) || null)}
                >
                  <option value="">选择监管者...</option>
                  {hunters.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-muted uppercase font-mono">求生者队伍 SURVIVORS</label>
                {survivorSlots.map((slot, i) => (
                  <div key={i} className={`p-3 border ${slot.isSelf ? 'border-accent/50 bg-accent/5' : 'border-border bg-bg/20'} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted">{slot.isSelf ? '本人 (SELF)' : `队友 ${i} (TEAMMATE)`}</span>
                      <div className="flex gap-1">
                        {(['healthy', 'wounded', 'downed', 'chaired', 'eliminated'] as SurvivorStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(i, s)}
                            className={`w-5 h-5 flex items-center justify-center border transition-colors ${
                              slot.status === s 
                                ? 'bg-primary border-primary text-white' 
                                : 'border-border text-muted hover:border-text'
                            }`}
                            title={s}
                          >
                            {s === 'healthy' && <Heart className="w-3 h-3" />}
                            {s === 'wounded' && <Activity className="w-3 h-3" />}
                            {s === 'downed' && <AlertTriangle className="w-3 h-3" />}
                            {s === 'chaired' && <Timer className="w-3 h-3" />}
                            {s === 'eliminated' && <Skull className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <select 
                      className="w-full bg-bg border border-border text-xs p-1 outline-none focus:border-accent"
                      value={slot.character?.id || ''}
                      onChange={(e) => updateSurvivor(i, e.target.value)}
                    >
                      <option value="">选择求生者...</option>
                      {survivors.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Game State */}
          <section className="bg-card/30 border border-border p-6 space-y-6">
            <h3 className="text-sm font-bold text-text font-mono uppercase tracking-widest border-l-2 border-accent pl-3">
              局内状态_GAME_STATE
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>局内时间 TIMELINE</span>
                  <span className="text-accent">{Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="600" 
                  value={gameTime} 
                  onChange={(e) => setGameTime(parseInt(e.target.value))}
                  className="w-full h-1 bg-border appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>破译总进度 DECODING</span>
                  <span className="text-primary">{decodingProgress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  value={decodingProgress} 
                  onChange={(e) => setDecodingProgress(parseInt(e.target.value))}
                  className="w-full h-1 bg-border appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted uppercase font-mono">监管者存在感 PRESENCE</label>
                <div className="flex gap-2">
                  {[0, 1, 2].map(p => (
                    <button
                      key={p}
                      onClick={() => setHunterPresence(p as 0 | 1 | 2)}
                      className={`flex-1 py-1 border font-mono text-xs transition-all ${
                        hunterPresence === p 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-border text-muted hover:border-primary'
                      }`}
                    >
                      阶 {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted uppercase font-mono">终极天赋 TALENTS</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHasBorrowedTime(!hasBorrowedTime)}
                    className={`py-1 border font-mono text-[10px] transition-all ${
                      hasBorrowedTime 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'border-border text-muted'
                    }`}
                  >
                    回光返照 (S)
                  </button>
                  <button
                    onClick={() => setHasDetention(!hasDetention)}
                    className={`py-1 border font-mono text-[10px] transition-all ${
                      hasDetention 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'border-border text-muted'
                    }`}
                  >
                    挽留 (H)
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Dynamic Results */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card/40 border border-border p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-muted opacity-20">实时演算结果_LIVE_CALC</div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-bg border border-accent/30 p-1">
                {selfCharacter ? (
                  <img src={selfCharacter.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    <UserCircle className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-serif text-accent">{selfCharacter?.title || '请选择演算目标'}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{selfCharacter?.role === 'Survivor' ? '求生者' : '监管者'}</span>
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{selfCharacter?.type}</span>
                </div>
              </div>
            </div>

            {selfCharacter ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {dynamicTraits.map((cat, i) => (
                  <div key={i} className="space-y-4">
                    <h3 className="text-primary font-bold mb-2 border-b border-primary/30 pb-1 font-mono text-sm">
                      {cat.category}
                    </h3>
                    <div className="space-y-2">
                      {cat.items.map((item, j) => {
                        const baseItem = selfCharacter.traits?.find(c => c.category === cat.category)?.items.find(it => it.label === item.label);
                        const isModified = baseItem && baseItem.value !== item.value;
                        
                        return (
                          <div key={j} className={`flex justify-between items-center py-1 border-b border-border/30 last:border-0 ${isModified ? 'bg-primary/5 px-2 -mx-2' : ''}`}>
                            <span className="text-muted text-xs font-mono">{item.label}</span>
                            <div className="text-right">
                              <span className={`font-bold text-xs font-mono ${isModified ? 'text-accent' : 'text-text'}`}>
                                {item.value}
                              </span>
                              {isModified && baseItem && (
                                <div className="text-[9px] text-muted font-mono line-through opacity-50">
                                  原值: {baseItem.value}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-muted space-y-4">
                <Timer className="w-12 h-12 opacity-10" />
                <p className="text-sm font-mono uppercase tracking-widest">等待选择演算目标...</p>
              </div>
            )}
          </div>

          {/* Active Modifiers Panel */}
          {selfCharacter && (
            <div className="bg-card/20 border border-border p-6">
              <h3 className="text-xs font-bold text-muted font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> 当前生效修正_ACTIVE_MODIFIERS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Example Modifier Cards */}
                {selfCharacter.id === 's10' && survivorSlots.some(s => s.status !== 'healthy' && s.status !== 'eliminated') && (
                  <div className="p-3 bg-primary/10 border border-primary/30 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-primary">胆怯 (Debuff)</div>
                      <div className="text-[10px] text-muted font-mono mt-1">每有一名队友受伤/倒地/在椅上，破译速度降低45%</div>
                    </div>
                  </div>
                )}
                {gameTime > 180 && (
                  <div className="p-3 bg-accent/10 border border-accent/30 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-accent">对局加速 (System)</div>
                      <div className="text-[10px] text-muted font-mono mt-1">对局进行至3分钟后，全员破译速度提升10%</div>
                    </div>
                  </div>
                )}
                {selfCharacter.role === 'Hunter' && hunterPresence > 0 && (
                  <div className="p-3 bg-primary/10 border border-primary/30 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-primary">存在感提升 (Buff)</div>
                      <div className="text-[10px] text-muted font-mono mt-1">监管者移动速度随存在感阶级提升</div>
                    </div>
                  </div>
                )}
                {selfCharacter.role === 'Hunter' && hasDetention && decodingProgress >= 500 && (
                  <div className="p-3 bg-primary/20 border border-primary/50 flex items-start gap-3">
                    <Skull className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-primary">挽留 (Active)</div>
                      <div className="text-[10px] text-muted font-mono mt-1">大门通电后，监管者普通攻击造成双倍伤害，移速+5%</div>
                    </div>
                  </div>
                )}
                {selfCharacter.role === 'Survivor' && hasBorrowedTime && decodingProgress >= 500 && (
                  <div className="p-3 bg-accent/20 border border-accent/50 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-accent">回光返照 (Active)</div>
                      <div className="text-[10px] text-muted font-mono mt-1">大门通电后，求生者恢复一格健康值并获得50%加速</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
