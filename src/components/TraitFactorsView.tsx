import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TraitFactor, CharacterTraitItem, COLORS, Character, DEFAULT_TAG_CONFIG } from '../constants';
import { Plus, Trash2, ArrowLeft, Info, AlertCircle, CheckCircle2, Activity, Zap } from 'lucide-react';

interface Props {
  characterId: string;
  characterName: string;
  category: string;
  allCharacters?: Character[];
  baseItems: CharacterTraitItem[];
  onBack: () => void;
}

export const TraitFactorsView = ({ characterId, characterName, category, allCharacters, baseItems, onBack }: Props) => {
  const [localFactors, setLocalFactors] = useState<TraitFactor[]>([]);
  const [globalTalents, setGlobalTalents] = useState<TraitFactor[]>([]);
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFactors, setActiveFactors] = useState<Set<string>>(new Set());
  const [availableTags, setAvailableTags] = useState<{name: string, type: string, color?: string}[]>([]);

  const factors = [...localFactors, ...globalTalents];

  const character = allCharacters?.find(c => c.id === characterId);

  // Collect available tags
  useEffect(() => {
    const tags: {name: string, type: string, color?: string}[] = [];
    
    // 1. Character Skills (External Traits)
    if (character?.skills) {
      character.skills.forEach(skill => {
        tags.push({ name: skill.name, type: 'external_trait' });
      });
    }

    // 2. Dynamic Tags from Firestore
    const unsubTags = onSnapshot(collection(db, 'tags'), (snapshot) => {
      const dynamicTags = snapshot.docs.map(doc => {
        const data = doc.data();
        const isRelevant = data.affectedRole === 'Both' || data.affectedRole === character?.role;
        return isRelevant ? { name: data.name, type: 'other', color: data.color } : null;
      }).filter(Boolean) as {name: string, type: string, color?: string}[];

      setAvailableTags(prev => {
        const skillTags = tags.filter(t => t.type === 'external_trait');
        const talentTags = prev.filter(t => t.type === 'talent');
        return [...skillTags, ...talentTags, ...dynamicTags];
      });
    });

    // 3. Talents
    const unsubTalents = onSnapshot(collection(db, 'talent_definitions'), (snapshot) => {
      const talentTags = snapshot.docs.map(doc => ({
        name: doc.data().name as string,
        type: 'talent'
      }));
      
      setAvailableTags(prev => {
        const otherTags = prev.filter(t => t.type !== 'talent');
        return [...otherTags, ...talentTags];
      });
    });

    return () => {
      unsubTags();
      unsubTalents();
    };
  }, [character]);
  const baseCharacter = allCharacters?.find(c => 
    c.id === (character?.role === 'Survivor' ? 'base_survivor' : 'base_hunter')
  );

  // Sync allocated points from talent system
  useEffect(() => {
    if (!auth.currentUser) return;
    const role = character?.role || 'Survivor';
    const unsub = onSnapshot(doc(db, 'user_talent_allocations', `${auth.currentUser.uid}_${role}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().allocatedPoints || {};
        setAllocatedPoints(data);
        
        // Auto-activate factors for allocated talents
        setActiveFactors(prev => {
          const next = new Set(prev);
          // We'll handle the actual activation in the talent definitions listener 
          // because we need the talent IDs and their target stats
          return next;
        });
      } else {
        setAllocatedPoints({});
      }
    }, (err) => {
      console.error("Error fetching allocations:", err);
    });
    return () => unsub();
  }, [character?.role]);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEffect, setNewEffect] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newSourceType, setNewSourceType] = useState<'external_trait' | 'talent' | 'auxiliary_trait' | 'other'>('external_trait');
  const [newType, setNewType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [newTargetStat, setNewTargetStat] = useState('');
  const [newModifier, setNewModifier] = useState('');
  const [adding, setAdding] = useState(false);

  const toggleFactor = (factorId: string) => {
    setActiveFactors(prev => {
      const next = new Set(prev);
      if (next.has(factorId)) {
        next.delete(factorId);
      } else {
        next.add(factorId);
      }
      return next;
    });
  };

  const calculateModifiedValue = (baseValue: string, itemFactors: TraitFactor[]) => {
    const activeItemFactors = itemFactors.filter(f => activeFactors.has(f.id));
    if (!activeItemFactors.length) return baseValue;

    // Extract numerical value and unit
    const match = baseValue.match(/([\d.]+)([^\d]*)/);
    if (!match) return baseValue;

    let value = parseFloat(match[1]);
    const unit = match[2];

    let additiveModifier = 0;
    let multiplicativeModifier = 1;
    let percentAdditiveModifier = 0;

    activeItemFactors.forEach(f => {
      if (!f.modifier) return;
      
      const modMatch = f.modifier.match(/([+\-x])([\d.]+)(%?)/);
      if (!modMatch) return;

      const op = modMatch[1];
      const modVal = parseFloat(modMatch[2]);
      const isPercent = modMatch[3] === '%';

      if (op === '+') {
        if (isPercent) percentAdditiveModifier += modVal;
        else additiveModifier += modVal;
      } else if (op === '-') {
        if (isPercent) percentAdditiveModifier -= modVal;
        else additiveModifier -= modVal;
      } else if (op === 'x') {
        multiplicativeModifier *= modVal;
      }
    });

    value = (value + additiveModifier) * (1 + percentAdditiveModifier / 100) * multiplicativeModifier;

    // Format back to string with 2 decimal places if needed
    const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
    return `${formattedValue}${unit}`;
  };

  useEffect(() => {
    const q = query(
      collection(db, 'trait_factors'),
      where('characterId', '==', characterId),
      where('category', '==', category),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeFactors = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TraitFactor[];
      setLocalFactors(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching factors:", err);
      setError('无法加载影响因素数据。');
      setLoading(false);
    });

    const qTalents = query(
      collection(db, 'talent_definitions')
    );

    const unsubscribeTalents = onSnapshot(qTalents, (snapshot) => {
      const charRole = character?.role || 'Survivor';
      const newGlobalTalents: TraitFactor[] = [];
      const autoActiveIds: string[] = [];

      snapshot.docs.forEach(doc => {
        const talent = doc.data() as any;
        const talentId = doc.id;
        const targetRole = talent.targetRole || talent.role;
        const isRelevant = targetRole === charRole || targetRole === 'Both';

        if (isRelevant && talent.targetStats && talent.targetStats.length > 0) {
          const isAllocated = allocatedPoints[talentId] > 0;
          
          talent.targetStats.forEach((stat: string, index: number) => {
            const factorId = `talent_${talentId}_${index}`;
            newGlobalTalents.push({
              id: factorId,
              name: talent.name,
              effect: talent.effect || talent.description,
              source: '天赋系统',
              sourceType: 'talent',
              type: 'positive',
              targetStat: stat,
              modifier: talent.modifier || '',
              characterId: characterId,
              category: category,
              updatedAt: talent.updatedAt || serverTimestamp()
            } as TraitFactor);

            if (isAllocated) {
              autoActiveIds.push(factorId);
            }
          });
        }
      });

      setGlobalTalents(newGlobalTalents);
      
      // Sync active factors with allocated talents
      if (autoActiveIds.length > 0) {
        setActiveFactors(prev => {
          const next = new Set(prev);
          autoActiveIds.forEach(id => next.add(id));
          return next;
        });
      }
    });

    return () => {
      unsubscribeFactors();
      unsubscribeTalents();
    };
  }, [characterId, category, character?.role, allocatedPoints]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEffect) return;

    setAdding(true);
    try {
      await addDoc(collection(db, 'trait_factors'), {
        characterId,
        category,
        name: newName,
        effect: newEffect,
        source: newSource || '未知来源',
        sourceType: newSourceType,
        type: newType,
        targetStat: newTargetStat,
        modifier: newModifier,
        updatedAt: serverTimestamp()
      });
      setNewName('');
      setNewEffect('');
      setNewSource('');
      setNewSourceType('external_trait');
      setNewType('neutral');
      setNewTargetStat('');
      setNewModifier('');
    } catch (err) {
      console.error("Error adding factor:", err);
      alert('添加失败，请重试。');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个影响因素吗？')) return;
    try {
      await deleteDoc(doc(db, 'trait_factors', id));
    } catch (err) {
      console.error("Error deleting factor:", err);
      alert('删除失败。');
    }
  };

  const renderFactorCell = (factorList: TraitFactor[], itemLabel: string, type: 'external_trait' | 'talent' | 'auxiliary_trait' | 'other') => (
    <div className="space-y-4">
      {factorList.map(f => (
        <div key={f.id} className="flex items-start justify-between gap-2 group/item">
          <label className="flex items-start gap-3 cursor-pointer flex-1">
            <input 
              type="checkbox" 
              className="mt-1.5 w-4 h-4 accent-accent"
              checked={activeFactors.has(f.id)}
              onChange={() => toggleFactor(f.id)}
            />
            <div className="flex flex-col">
              <span className={`text-sm font-bold transition-colors ${activeFactors.has(f.id) ? 'text-accent' : 'text-text/80 group-hover:text-text'}`}>
                {f.name}
              </span>
              <span className="text-xs text-muted leading-relaxed mt-1">{f.modifier ? `[${f.modifier}] ` : ''}{f.effect}</span>
            </div>
          </label>
          <button 
            onClick={(e) => { e.preventDefault(); handleDelete(f.id); }}
            className="text-muted hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity p-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      {/* Inline Add Dropdown */}
      <div className="mt-3 pt-3 border-t border-border/20">
        <select 
          onChange={async (e) => {
            const tagName = e.target.value;
            if (!tagName) return;
            const tag = availableTags.find(t => t.name === tagName);
            if (!tag) return;
            
            try {
              await addDoc(collection(db, 'trait_factors'), {
                characterId,
                category,
                name: tag.name,
                effect: `影响 ${itemLabel}`,
                source: tag.name,
                sourceType: type,
                type: 'neutral',
                targetStat: itemLabel,
                modifier: '',
                updatedAt: serverTimestamp()
              });
              e.target.value = '';
            } catch (err) {
              console.error("Error quick-adding factor:", err);
            }
          }}
          className="text-[11px] bg-bg/50 border border-border/50 px-2 py-1 font-mono text-muted hover:text-accent hover:border-accent outline-none transition-colors w-full"
        >
          <option value="">+ 添加{type === 'external_trait' ? '特质' : type === 'talent' ? '天赋' : '因素'}</option>
          {availableTags.filter(t => (type === 'other' ? t.type === 'other' : t.type === type)).map(t => (
            <option key={`inline-${itemLabel}-${t.name}`} value={t.name}>{t.name}</option>
          ))}
          {type === 'auxiliary_trait' && (
            <>
              <option value="传送">传送</option>
              <option value="闪现">闪现</option>
              <option value="窥视者">窥视者</option>
              <option value="巡视者">巡视者</option>
              <option value="兴奋">兴奋</option>
              <option value="失常">失常</option>
              <option value="移形">移形</option>
            </>
          )}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-accent transition-colors font-mono text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> 返回详情_BACK
        </button>
        <div className="text-right">
          <h2 className="text-xl font-serif text-accent">{category}</h2>
          <p className="text-xs text-muted font-mono uppercase tracking-tighter">影响因素分析_FACTORS FOR {characterName}</p>
        </div>
      </div>

      {/* Dynamic Modifiers Table */}
      <section className="bg-card/30 border border-border p-8 cyber-border overflow-x-auto">
        <h3 className="text-lg font-bold text-primary font-mono mb-8 flex items-center gap-3 uppercase tracking-widest">
          <Zap className="w-5 h-5" /> 动态修正预览_DYNAMIC_MODIFIERS
        </h3>
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted font-mono uppercase tracking-widest">
              <th className="p-4 font-normal w-[15%]">特质项目</th>
              <th className="p-4 font-normal w-[10%]">基础数值</th>
              <th className="p-4 font-normal w-[20%]">外在特质</th>
              <th className="p-4 font-normal w-[20%]">天赋因素</th>
              <th className="p-4 font-normal w-[20%]">监管者辅助特质</th>
              <th className="p-4 font-normal w-[15%] text-accent">影响后的数值</th>
            </tr>
          </thead>
          <tbody>
            {baseItems.map((item, idx) => {
              const relevantFactors = factors.filter(f => 
                f.targetStat === item.label ||
                (!f.targetStat && (
                  f.effect.includes(item.label) || 
                  item.label.includes(f.name) ||
                  (category.includes('破译') && f.effect.includes('破译')) ||
                  (category.includes('移动') && f.effect.includes('速度'))
                ))
              );

              const externalTraits = relevantFactors.filter(f => f.sourceType === 'external_trait' || !f.sourceType);
              const talentFactors = relevantFactors.filter(f => f.sourceType === 'talent');
              const auxiliaryTraits = relevantFactors.filter(f => f.sourceType === 'auxiliary_trait');

              const modifiedValue = calculateModifiedValue(item.value, relevantFactors);
              const hasChange = modifiedValue !== item.value;

              const baseCat = baseCharacter?.traits?.find(bc => 
                bc.category.split(' ')[0] === category.split(' ')[0]
              );
              const baseItem = baseCat?.items.find(bi => bi.label === item.label);
              const isBaseDifferent = character?.role === 'Survivor' && baseItem && baseItem.value !== item.value;

              return (
                <tr key={idx} className={`border-b border-border/30 last:border-0 transition-colors ${isBaseDifferent ? 'bg-primary/5' : 'hover:bg-bg/50'}`}>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text uppercase tracking-widest">{item.label}</span>
                      {isBaseDifferent && baseItem && (
                        <span className="text-[10px] text-muted font-mono line-through opacity-50">标准: {baseItem.value}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <span className={`text-sm font-mono ${isBaseDifferent ? 'text-primary' : 'text-muted'}`}>{item.value}</span>
                  </td>
                  <td className="p-4 align-top border-l border-border/20">{renderFactorCell(externalTraits, item.label, 'external_trait')}</td>
                  <td className="p-4 align-top border-l border-border/20">{renderFactorCell(talentFactors, item.label, 'talent')}</td>
                  <td className="p-4 align-top border-l border-border/20">{renderFactorCell(auxiliaryTraits, item.label, 'auxiliary_trait')}</td>
                  <td className="p-4 align-top border-l border-border/20 bg-accent/5">
                    <div className="flex flex-col gap-2">
                      <span className={`text-lg font-bold font-mono ${hasChange ? 'text-accent' : 'text-text'}`}>
                        {modifiedValue}
                      </span>
                      {hasChange && (
                        <span className="text-xs text-accent/70 font-mono">
                          ({item.value} → {modifiedValue})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Add Form */}
      <section className="bg-card/30 border border-border p-6 cyber-border">
        <h3 className="text-sm font-bold text-text font-mono mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Plus className="w-4 h-4" /> 录入新因素_INPUT_NEW_FACTOR
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">因素名称 NAME</label>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：庄园老友"
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">影响效果 EFFECT</label>
            <input 
              type="text"
              value={newEffect}
              onChange={(e) => setNewEffect(e.target.value)}
              placeholder="例如：受击加速延长2秒"
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">来源类型 SOURCE TYPE</label>
            <select 
              value={newSourceType}
              onChange={(e) => setNewSourceType(e.target.value as any)}
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
            >
              <option value="external_trait">外在特质</option>
              <option value="talent">天赋因素</option>
              <option value="auxiliary_trait">监管者辅助特质</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">来源 SOURCE (下拉选择标签)</label>
            <div className="relative group">
              <select 
                value={newSource}
                onChange={(e) => {
                  const selectedTag = availableTags.find(t => t.name === e.target.value);
                  setNewSource(e.target.value);
                  if (selectedTag) {
                    setNewSourceType(selectedTag.type as any);
                  }
                }}
                className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors appearance-none"
              >
                <option value="">-- 选择特质/天赋标签 --</option>
                <optgroup label="统一标签 UNIFIED_TAGS">
                  {availableTags.filter(t => t.type === 'other').map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="外在特质 EXTERNAL_TRAITS">
                  {availableTags.filter(t => t.type === 'external_trait').map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="天赋系统 TALENTS">
                  {availableTags.filter(t => t.type === 'talent').map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="其他 OTHERS">
                  <option value="监管者辅助特质">辅助特质</option>
                  <option value="其他">其他</option>
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted">
                <Info className="w-3 h-3" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">或手动输入来源 (MANUAL)</label>
            <input 
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="例如：破窗理论"
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">目标属性 TARGET_STAT</label>
            <select 
              value={newTargetStat}
              onChange={(e) => setNewTargetStat(e.target.value)}
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
            >
              <option value="">自动匹配 (模糊搜索)</option>
              {baseItems.map(item => (
                <option key={item.label} value={item.label}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">修正值 MODIFIER (e.g. +10%, -2, x1.1)</label>
            <input 
              type="text"
              value={newModifier}
              onChange={(e) => setNewModifier(e.target.value)}
              placeholder="例如：+2 或 -10% 或 x1.1"
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 items-end lg:col-span-2">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-muted uppercase font-mono tracking-widest">类型 TYPE</label>
              <select 
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
              >
                <option value="positive">正面 (+)</option>
                <option value="negative">负面 (-)</option>
                <option value="neutral">中性 (=)</option>
              </select>
            </div>
            <button 
              type="submit"
              disabled={adding}
              className="bg-primary text-white px-4 py-2 hover:bg-primary/80 transition-all disabled:opacity-50 flex items-center justify-center h-[38px]"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
