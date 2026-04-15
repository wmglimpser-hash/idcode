import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tag as TagIcon, Plus, Trash2, Save, X, Edit2, Check, Filter, User as UserIcon, Shield, LayoutGrid, Table as TableIcon, Search, ExternalLink, ChevronRight, Info, ShieldCheck, Download, FileText, LogOut, Skull } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Tag, SURVIVOR_TRAITS_MODERN_TEMPLATE, HUNTER_TRAITS_TEMPLATE, Character, TalentDefinition, CharacterTraitCategory, EXCLUDED_SURVIVOR_TRAITS, EXCLUDED_HUNTER_TRAITS } from '../constants';
import { renameTagGlobal, deleteTagGlobal } from '../services/tagService';

interface TagManagementProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

type ViewMode = 'matrix' | 'gallery';

export const TagManagement = ({ user, userProfile }: TagManagementProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [talents, setTalents] = useState<TalentDefinition[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [matrixRole, setMatrixRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [survivorTraits, setSurvivorTraits] = useState<CharacterTraitCategory[]>(SURVIVOR_TRAITS_MODERN_TEMPLATE);
  const [hunterTraits, setHunterTraits] = useState<CharacterTraitCategory[]>(HUNTER_TRAITS_TEMPLATE);
  const [customStats, setCustomStats] = useState<string[]>(['存在感', '技能冷却', '技能范围', '充能速度', '博弈能力', '牵制时长', '辅助能力']);
  const [newCustomStat, setNewCustomStat] = useState('');
  const [editingTrait, setEditingTrait] = useState<{ role: 'Survivor' | 'Hunter', categoryIndex: number, itemIndex?: number } | null>(null);
  const [traitEditForm, setTraitEditForm] = useState({ label: '', value: '' });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTagForSearch, setSelectedTagForSearch] = useState<Tag | null>(null);
  const [searchResults, setSearchResults] = useState<{ characters: Character[], talents: TalentDefinition[] }>({ characters: [], talents: [] });
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const [form, setForm] = useState<Partial<Tag>>({
    name: '',
    color: '#00f3ff',
    affectedRole: 'Survivor',
    affectedStats: []
  });

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_configs', 'trait_templates'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.survivor) setSurvivorTraits(data.survivor);
        if (data.hunter) setHunterTraits(data.hunter);
        if (data.customStats) setCustomStats(data.customStats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_configs/trait_templates');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tags'), (snapshot) => {
      const loadedTags = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];
      setTags(loadedTags);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tags');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeChars = onSnapshot(collection(db, 'characters'), (snapshot) => {
      setCharacters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'characters');
    });
    const unsubscribeTalents = onSnapshot(collection(db, 'talent_definitions'), (snapshot) => {
      setTalents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TalentDefinition)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'talent_definitions');
    });
    return () => {
      unsubscribeChars();
      unsubscribeTalents();
    };
  }, []);

  useEffect(() => {
    if (selectedTagForSearch) {
      const tagName = selectedTagForSearch.name;
      const matchedChars = characters.filter(c => 
        c.skills?.some(s => s.tags?.includes(tagName)) || 
        c.presence?.some(p => p.tags?.includes(tagName))
      );
      const matchedTalents = talents.filter(t => t.tags?.includes(tagName));
      setSearchResults({ characters: matchedChars, talents: matchedTalents });
    }
  }, [selectedTagForSearch, characters, talents]);

  useEffect(() => {
    if (selectedTagForSearch && searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTagForSearch]);

  const handleExportResults = () => {
    if (!selectedTagForSearch) return;
    
    const tagName = selectedTagForSearch.name;
    let content = `标签关联内容导出: ${tagName}\n`;
    content += `导出时间: ${new Date().toLocaleString()}\n`;
    content += `==========================================\n\n`;

    // Characters
    const survivors = searchResults.characters.filter(c => c.role === 'Survivor');
    const hunters = searchResults.characters.filter(c => c.role === 'Hunter');

    if (survivors.length > 0) {
      content += `【求生者角色档案 SURVIVORS】\n`;
      survivors.forEach(c => {
        content += `------------------------------------------\n`;
        content += `角色: ${c.title} - ${c.name}\n`;
        content += `定位: ${c.type}\n`;
        content += `关联特质:\n`;
        c.skills.filter(s => s.tags?.includes(tagName)).forEach(s => {
          content += `  - [外在特质] ${s.name}: ${s.description}\n`;
        });
        content += `\n`;
      });
    }

    if (hunters.length > 0) {
      content += `【监管者角色档案 HUNTERS】\n`;
      hunters.forEach(c => {
        content += `------------------------------------------\n`;
        content += `角色: ${c.title} - ${c.name}\n`;
        content += `定位: ${c.type}\n`;
        content += `关联技能/存在感:\n`;
        c.skills.filter(s => s.tags?.includes(tagName)).forEach(s => {
          content += `  - [外在特质] ${s.name}: ${s.description}\n`;
        });
        c.presence?.filter(p => p.tags?.includes(tagName)).forEach(p => {
          content += `  - [${p.tier}阶技能] ${p.name}: ${p.description}\n`;
        });
        content += `\n`;
      });
    }

    // Talents
    const survivorTalents = searchResults.talents.filter(t => t.role === 'Survivor');
    const hunterTalents = searchResults.talents.filter(t => t.role === 'Hunter');

    if (survivorTalents.length > 0) {
      content += `【求生者天赋定义 SURVIVOR_TALENTS】\n`;
      survivorTalents.forEach(t => {
        content += `------------------------------------------\n`;
        content += `天赋: ${t.name} (${t.nodeId})\n`;
        content += `描述: ${t.description}\n`;
        if (t.effect) content += `效果: ${t.effect}\n`;
        content += `\n`;
      });
    }

    if (hunterTalents.length > 0) {
      content += `【监管者天赋定义 HUNTER_TALENTS】\n`;
      hunterTalents.forEach(t => {
        content += `------------------------------------------\n`;
        content += `天赋: ${t.name} (${t.nodeId})\n`;
        content += `描述: ${t.description}\n`;
        if (t.effect) content += `效果: ${t.effect}\n`;
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `标签关联_${tagName}_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!form.name || !user) {
      alert("请填写标签名称");
      return;
    }
    
    const executeSave = async () => {
      setSaving(true);
      try {
        if (editingId) {
          const oldTag = tags.find(t => t.id === editingId);
          if (oldTag && oldTag.name !== form.name) {
            await renameTagGlobal(oldTag.name, form.name!);
          }
        }

        const docId = editingId || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await setDoc(doc(db, 'tags', docId), {
          ...form,
          authorId: user.uid,
          updatedAt: serverTimestamp()
        });
        setShowAddForm(false);
        setEditingId(null);
        setForm({ name: '', color: '#00f3ff', affectedRole: 'Survivor', affectedStats: [] });
        setConfirmModal(prev => ({ ...prev, show: false }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'tags');
      } finally {
        setSaving(false);
      }
    };

    if (editingId) {
      const oldTag = tags.find(t => t.id === editingId);
      if (oldTag && oldTag.name !== form.name) {
        setConfirmModal({
          show: true,
          title: '确认更改名称',
          message: `检测到标签名称已更改。是否要全局更新所有使用 "${oldTag.name}" 的角色和天赋为 "${form.name}"？`,
          onConfirm: executeSave,
          type: 'info'
        });
        return;
      }
    }

    executeSave();
  };

  const handleDelete = async (id: string) => {
    const tagToDelete = tags.find(t => t.id === id);
    if (!tagToDelete) return;

    setConfirmModal({
      show: true,
      title: '确认删除标签',
      message: `确定要删除标签 "${tagToDelete.name}" 吗？此操作将同时从所有角色和天赋中移除该标签。`,
      type: 'danger',
      onConfirm: async () => {
        setSaving(true);
        try {
          await deleteTagGlobal(tagToDelete.name);
          await deleteDoc(doc(db, 'tags', id));
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `tags/${id}`);
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const toggleStat = (stat: string) => {
    setForm(prev => {
      const stats = prev.affectedStats || [];
      if (stats.includes(stat)) {
        return { ...prev, affectedStats: stats.filter(s => s !== stat) };
      } else {
        return { ...prev, affectedStats: [...stats, stat] };
      }
    });
  };

  const availableStats = [
    ...(form.affectedRole === 'Survivor' ? survivorTraits : hunterTraits)
      .flatMap(c => c.items
        .filter(i => form.affectedRole !== 'Survivor' || !EXCLUDED_SURVIVOR_TRAITS.includes(i.label))
        .map(i => i.label)
      ),
    ...customStats
  ].filter((v, i, a) => a.indexOf(v) === i);

  const handleAddCustomStat = async () => {
    if (!newCustomStat.trim() || !isContributor) return;
    const updatedStats = [...customStats, newCustomStat.trim()].filter((v, i, a) => a.indexOf(v) === i);
    try {
      setSaving(true);
      await setDoc(doc(db, 'system_configs', 'trait_templates'), {
        customStats: updatedStats
      }, { merge: true });
      setNewCustomStat('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/trait_templates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomStat = async (statToDelete: string) => {
    if (!isContributor) return;
    
    setConfirmModal({
      show: true,
      title: '确认删除属性',
      message: `确定要删除属性 "${statToDelete}" 吗？此操作将从所有标签的关联属性中移除该项。`,
      type: 'danger',
      onConfirm: async () => {
        const updatedStats = customStats.filter(s => s !== statToDelete);
        try {
          setSaving(true);
          await setDoc(doc(db, 'system_configs', 'trait_templates'), {
            customStats: updatedStats
          }, { merge: true });

          // Update all tags that use this stat
          const tagsToUpdate = tags.filter(t => t.affectedStats?.includes(statToDelete));
          const updatePromises = tagsToUpdate.map(tag => {
            const newStats = tag.affectedStats?.filter(s => s !== statToDelete) || [];
            return setDoc(doc(db, 'tags', tag.id), { ...tag, affectedStats: newStats }, { merge: true });
          });
          await Promise.all(updatePromises);
          
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'system_configs/trait_templates');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleRemoveTagFromStat = async (stat: string, tagId: string) => {
    if (!isContributor) return;
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      const newStats = tag.affectedStats.filter(s => s !== stat);
      try {
        await setDoc(doc(db, 'tags', tag.id), {
          ...tag,
          affectedStats: newStats,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tags/${tag.id}`);
      }
    }
  };

  const handleSaveTrait = async () => {
    if (!editingTrait || !isContributor) return;
    const { role, categoryIndex, itemIndex } = editingTrait;
    const template = role === 'Survivor' ? [...survivorTraits] : [...hunterTraits];
    
    try {
      setSaving(true);
      
      if (itemIndex !== undefined) {
        // Editing an item
        const oldLabel = template[categoryIndex].items[itemIndex].label;
        const newLabel = traitEditForm.label.trim();
        const newValue = traitEditForm.value.trim();

        if (!newLabel) return;

        template[categoryIndex].items[itemIndex] = { label: newLabel, value: newValue };

        // If label changed, update tags that reference it
        if (oldLabel !== newLabel) {
          const tagsToUpdate = tags.filter(t => t.affectedStats?.includes(oldLabel));
          for (const tag of tagsToUpdate) {
            const newStats = tag.affectedStats.map(s => s === oldLabel ? newLabel : s);
            await setDoc(doc(db, 'tags', tag.id), { ...tag, affectedStats: newStats }, { merge: true });
          }
        }
      } else {
        // Editing a category name
        const newCategoryName = traitEditForm.label.trim();
        if (!newCategoryName) return;
        template[categoryIndex].category = newCategoryName;
      }

      await setDoc(doc(db, 'system_configs', 'trait_templates'), {
        [role.toLowerCase()]: template
      }, { merge: true });

      setEditingTrait(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system_configs/trait_templates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTraitItem = async (role: 'Survivor' | 'Hunter', categoryIndex: number, itemIndex: number) => {
    if (!isContributor) return;
    const template = role === 'Survivor' ? [...survivorTraits] : [...hunterTraits];
    const itemToDelete = template[categoryIndex].items[itemIndex];
    
    setConfirmModal({
      show: true,
      title: '确认删除特质项目',
      message: `确定要删除特质项目 "${itemToDelete.label}" 吗？`,
      type: 'danger',
      onConfirm: async () => {
        template[categoryIndex].items.splice(itemIndex, 1);

        try {
          setSaving(true);
          await setDoc(doc(db, 'system_configs', 'trait_templates'), {
            [role.toLowerCase()]: template
          }, { merge: true });

          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'system_configs/trait_templates');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleAddTraitItem = async (role: 'Survivor' | 'Hunter', categoryIndex: number) => {
    if (!isContributor) return;
    const template = role === 'Survivor' ? [...survivorTraits] : [...hunterTraits];
    const newItem = { label: '新特质项目', value: '0' };
    template[categoryIndex].items.push(newItem);

    try {
      setSaving(true);
      await setDoc(doc(db, 'system_configs', 'trait_templates'), {
        [role.toLowerCase()]: template
      }, { merge: true });

      // Enter edit mode for the new item
      setEditingTrait({ role, categoryIndex, itemIndex: template[categoryIndex].items.length - 1 });
      setTraitEditForm({ label: newItem.label, value: newItem.value });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system_configs/trait_templates');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTraitCategory = async (role: 'Survivor' | 'Hunter') => {
    if (!isContributor) return;
    const template = role === 'Survivor' ? [...survivorTraits] : [...hunterTraits];
    const newCategory = { category: '新特质分类', items: [] };
    template.push(newCategory);

    try {
      setSaving(true);
      await setDoc(doc(db, 'system_configs', 'trait_templates'), {
        [role.toLowerCase()]: template
      }, { merge: true });

      // Enter edit mode for the new category
      setEditingTrait({ role, categoryIndex: template.length - 1 });
      setTraitEditForm({ label: newCategory.category, value: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system_configs/trait_templates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTraitCategory = async (role: 'Survivor' | 'Hunter', categoryIndex: number) => {
    if (!isContributor) return;
    const template = role === 'Survivor' ? [...survivorTraits] : [...hunterTraits];
    const catToDelete = template[categoryIndex];

    setConfirmModal({
      show: true,
      title: '确认删除特质分类',
      message: `确定要删除特质分类 "${catToDelete.category}" 吗？`,
      type: 'danger',
      onConfirm: async () => {
        template.splice(categoryIndex, 1);

        try {
          setSaving(true);
          await setDoc(doc(db, 'system_configs', 'trait_templates'), {
            [role.toLowerCase()]: template
          }, { merge: true });

          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'system_configs/trait_templates');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-serif text-accent">统一标签系统</h2>
          <p className="text-muted font-mono text-sm tracking-widest uppercase">全局标签管理与影响因素定义</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-card/50 p-1 border border-border">
            <button 
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-text'}`}
            >
              <TableIcon size={16} /> 表格模式_MATRIX
            </button>
            <button 
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-all ${viewMode === 'gallery' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-text'}`}
            >
              <LayoutGrid size={16} /> 标签模式_GALLERY
            </button>
          </div>

          {isContributor && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', color: '#00f3ff', affectedRole: 'Survivor', affectedStats: [] });
                setShowAddForm(true);
              }}
              className="px-6 py-2.5 bg-accent text-bg font-bold font-mono text-sm uppercase tracking-widest hover:bg-accent/80 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> 新增标签
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-card/50 border border-accent p-8 space-y-6 animate-in zoom-in-95 duration-300 cyber-border">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-accent">{editingId ? '编辑标签' : '新增标签'}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-text"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm text-muted font-mono uppercase tracking-widest font-bold">标签名称 NAME</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full bg-bg border border-border px-5 py-4 text-base focus:border-accent outline-none text-text font-bold" 
                  placeholder="例如：加速、破译、控制..."
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm text-muted font-mono uppercase tracking-widest font-bold">标签颜色 COLOR</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={form.color} 
                    onChange={e => setForm({...form, color: e.target.value})} 
                    className="w-14 h-14 bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={form.color} 
                    onChange={e => setForm({...form, color: e.target.value})} 
                    className="flex-1 bg-bg border border-border px-5 py-3 text-sm font-mono focus:border-accent outline-none text-text"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-muted font-mono uppercase tracking-widest font-bold">影响阵营 AFFECTED_ROLE</label>
                <div className="flex gap-3">
                  {(['Survivor', 'Hunter'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setForm({...form, affectedRole: role, affectedStats: []})}
                      className={`flex-1 py-3 text-xs font-mono uppercase tracking-widest border transition-all ${
                        form.affectedRole === role ? 'bg-accent text-bg border-accent font-bold' : 'bg-bg text-muted border-border hover:border-accent/50'
                      }`}
                    >
                      {role === 'Survivor' ? '求生者' : '监管者'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-muted font-mono uppercase tracking-widest font-bold">影响属性 AFFECTED_STATS (可多选)</label>
              
              {isContributor && (
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text"
                    value={newCustomStat}
                    onChange={e => setNewCustomStat(e.target.value)}
                    placeholder="新增自定义属性..."
                    className="flex-1 bg-bg border border-border px-4 py-2 text-xs font-mono outline-none focus:border-accent"
                  />
                  <button 
                    onClick={handleAddCustomStat}
                    disabled={!newCustomStat.trim() || saving}
                    className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-xs font-mono hover:bg-accent hover:text-bg transition-all disabled:opacity-50"
                  >
                    添加
                  </button>
                </div>
              )}

              <div className="bg-bg border border-border p-5 h-[320px] overflow-y-auto grid grid-cols-2 gap-3 custom-scrollbar">
                {availableStats.map(stat => (
                  <div key={stat} className="relative group">
                    <button
                      onClick={() => toggleStat(stat)}
                      className={`w-full px-3 py-2.5 text-xs text-left font-mono transition-all border ${
                        form.affectedStats?.includes(stat) ? 'bg-accent/20 text-accent border-accent font-bold' : 'bg-card/50 text-muted border-border/50 hover:border-accent/30'
                      }`}
                    >
                      {stat}
                    </button>
                    {isContributor && customStats.includes(stat) && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteCustomStat(stat);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-primary z-20 transition-all"
                        title="删除属性"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-border/50">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="px-8 py-3 bg-accent text-bg font-bold flex items-center gap-2 hover:bg-accent/80 disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
            >
              <Save className="w-5 h-5" /> {editingId ? '更新标签' : '保存标签'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <div className="space-y-8 animate-in fade-in duration-500">
        {viewMode === 'matrix' ? (
          <div className="space-y-8">
            <div className="flex gap-6 border-b border-border">
              <button 
                onClick={() => setMatrixRole('Survivor')}
                className={`pb-3 px-8 text-sm font-mono uppercase tracking-widest transition-all flex items-center gap-3 ${
                  matrixRole === 'Survivor' ? 'text-accent border-b-2 border-accent font-bold' : 'text-muted hover:text-text'
                }`}
              >
                <UserIcon size={16} /> 求生者阵营 SURVIVORS
              </button>
              <button 
                onClick={() => setMatrixRole('Hunter')}
                className={`pb-3 px-8 text-sm font-mono uppercase tracking-widest transition-all flex items-center gap-3 ${
                  matrixRole === 'Hunter' ? 'text-primary border-b-2 border-primary font-bold' : 'text-muted hover:text-text'
                }`}
              >
                <Shield size={16} /> 监管者阵营 HUNTERS
              </button>
            </div>

            {/* Matrix Table */}
            <div className="bg-card/30 cyber-border overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center bg-bg/50">
                <h3 className="text-xl font-serif text-text flex items-center gap-3">
                  <div className={`w-1.5 h-6 ${matrixRole === 'Survivor' ? 'bg-accent' : 'bg-primary'}`} />
                  {matrixRole === 'Survivor' ? '求生者特质详情 SURVIVOR_TRAITS' : '监管者特质详情 HUNTER_TRAITS'}
                </h3>
                {isContributor && (
                  <button 
                    onClick={() => handleAddTraitCategory(matrixRole)}
                    className={`px-4 py-2 border border-dashed text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${matrixRole === 'Survivor' ? 'border-accent/50 text-accent hover:bg-accent/10' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                  >
                    <Plus size={14} /> 添加分类 ADD_CATEGORY
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-bg/30">
                      <th className="px-5 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold w-48">分类 CATEGORY</th>
                      <th className="px-5 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold w-64">特质项目 TRAIT_ITEM</th>
                      <th className="px-5 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold w-24">基础值 BASE</th>
                      <th className="px-5 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted font-bold">关联标签 ASSOCIATED_TAGS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(matrixRole === 'Survivor' ? survivorTraits : hunterTraits).map((cat, catIdx) => {
                      const filteredItems = cat.items
                        .map((item, idx) => ({ ...item, originalIdx: idx }))
                        .filter(item => {
                          if (matrixRole === 'Survivor') return !EXCLUDED_SURVIVOR_TRAITS.includes(item.label);
                          if (matrixRole === 'Hunter') return !EXCLUDED_HUNTER_TRAITS.includes(item.label);
                          return true;
                        });
                      
                      if (filteredItems.length === 0) return null;
                      
                      const rowSpan = Math.max(1, filteredItems.length);
                      const isEditingCat = editingTrait?.role === matrixRole && editingTrait?.categoryIndex === catIdx && editingTrait?.itemIndex === undefined;
                      
                      return (
                        <React.Fragment key={`${matrixRole}-${catIdx}`}>
                          {filteredItems.length === 0 ? (
                            <tr className="border-b border-border/50 group hover:bg-white/5 transition-colors">
                              <td className="px-5 py-5 border-r border-border/50">
                                <div className="flex items-center justify-between group/cat">
                                  {isEditingCat ? (
                                    <input 
                                      type="text" 
                                      value={traitEditForm.label}
                                      onChange={e => setTraitEditForm({ ...traitEditForm, label: e.target.value })}
                                      className="bg-bg border border-accent px-2 py-1 text-sm font-serif text-text outline-none w-full"
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="text-sm font-serif text-text font-bold">{cat.category}</span>
                                  )}
                                  {isContributor && (
                                    <div className="flex items-center gap-1">
                                      {isEditingCat ? (
                                        <button onClick={handleSaveTrait} className="p-1 text-accent"><Check size={12} /></button>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => {
                                              setEditingTrait({ role: matrixRole, categoryIndex: catIdx });
                                              setTraitEditForm({ label: cat.category, value: '' });
                                            }}
                                            className="p-1 text-muted hover:text-accent opacity-0 group-hover/cat:opacity-100"
                                          >
                                            <Edit2 size={10} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTraitCategory(matrixRole, catIdx)}
                                            className="p-1 text-muted hover:text-primary opacity-0 group-hover/cat:opacity-100"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                          <button 
                                            onClick={() => handleAddTraitItem(matrixRole, catIdx)}
                                            className="p-1 text-muted hover:text-accent opacity-0 group-hover/cat:opacity-100"
                                            title="添加项目"
                                          >
                                            <Plus size={10} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td colSpan={3} className="px-5 py-5 text-xs font-mono italic text-muted/30">暂无项目_NO_ITEMS</td>
                            </tr>
                          ) : (
                            filteredItems.map((item, itemIdx) => {
                              const isEditing = editingTrait?.role === matrixRole && editingTrait?.categoryIndex === catIdx && editingTrait?.itemIndex === item.originalIdx;
                              const associatedTags = tags.filter(t => t.affectedStats?.includes(item.label));
                              
                              return (
                                <tr key={`${matrixRole}-${catIdx}-${item.originalIdx}`} className="border-b border-border/50 group hover:bg-white/5 transition-colors">
                                  {itemIdx === 0 && (
                                    <td rowSpan={rowSpan} className="px-5 py-5 border-r border-border/50 align-top bg-bg/10">
                                      <div className="flex items-center justify-between group/cat">
                                        {isEditingCat ? (
                                          <input 
                                            type="text" 
                                            value={traitEditForm.label}
                                            onChange={e => setTraitEditForm({ ...traitEditForm, label: e.target.value })}
                                            className="bg-bg border border-accent px-2 py-1 text-sm font-serif text-text outline-none w-full"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="text-sm font-serif text-text font-bold">{cat.category}</span>
                                        )}
                                        {isContributor && (
                                          <div className="flex items-center gap-1">
                                            {isEditingCat ? (
                                              <button onClick={handleSaveTrait} className="p-1 text-accent"><Check size={12} /></button>
                                            ) : (
                                              <>
                                                <button 
                                                  onClick={() => {
                                                    setEditingTrait({ role: matrixRole, categoryIndex: catIdx });
                                                    setTraitEditForm({ label: cat.category, value: '' });
                                                  }}
                                                  className="p-1 text-muted hover:text-accent opacity-0 group-hover/cat:opacity-100"
                                                >
                                                  <Edit2 size={10} />
                                                </button>
                                                <button 
                                                  onClick={() => handleDeleteTraitCategory(matrixRole, catIdx)}
                                                  className="p-1 text-muted hover:text-primary opacity-0 group-hover/cat:opacity-100"
                                                >
                                                  <Trash2 size={10} />
                                                </button>
                                                <button 
                                                  onClick={() => handleAddTraitItem(matrixRole, catIdx)}
                                                  className="p-1 text-muted hover:text-accent opacity-0 group-hover/cat:opacity-100"
                                                  title="添加项目"
                                                >
                                                  <Plus size={10} />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-5 py-5 border-r border-border/50">
                                    {isEditing ? (
                                      <input 
                                        type="text" 
                                        value={traitEditForm.label}
                                        onChange={e => setTraitEditForm({ ...traitEditForm, label: e.target.value })}
                                        className="bg-bg border border-accent px-2 py-1 text-sm font-serif text-text outline-none w-full"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        {item.label}
                                        {isContributor && (
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                              onClick={() => {
                                                setEditingTrait({ role: matrixRole, categoryIndex: catIdx, itemIndex: item.originalIdx });
                                                setTraitEditForm({ label: item.label, value: item.value });
                                              }}
                                              className="p-1 text-muted hover:text-accent"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteTraitItem(matrixRole, catIdx, item.originalIdx)}
                                              className="p-1 text-muted hover:text-primary"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-5 text-sm font-mono text-muted/80">
                                    {isEditing ? (
                                      <input 
                                        type="text" 
                                        value={traitEditForm.value}
                                        onChange={e => setTraitEditForm({ ...traitEditForm, value: e.target.value })}
                                        className="bg-bg border border-accent px-2 py-1 text-sm font-mono text-muted outline-none w-full"
                                      />
                                    ) : (
                                      item.value
                                    )}
                                  </td>
                                  <td className="px-5 py-5">
                                    {isEditing ? (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={handleSaveTrait}
                                          className="px-3 py-1 bg-accent text-bg text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-accent/80 transition-all"
                                        >
                                          保存 SAVE
                                        </button>
                                        <button 
                                          onClick={() => setEditingTrait(null)}
                                          className="px-3 py-1 bg-card border border-border text-muted text-[10px] font-mono uppercase tracking-widest hover:text-text transition-all"
                                        >
                                          取消 CANCEL
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2.5 items-center">
                                        {associatedTags.map(tag => (
                                          <div 
                                            key={tag.id} 
                                            className="flex items-center gap-2 px-3 py-1.5 bg-bg border border-border group/tag shadow-sm"
                                            style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
                                          >
                                            <span className="text-xs font-mono text-text font-bold">{tag.name}</span>
                                            {isContributor && (
                                              <button 
                                                onClick={() => handleRemoveTagFromStat(item.label, tag.id)}
                                                className="p-1 text-muted hover:text-primary transition-colors"
                                              >
                                                <X size={12} />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tags.map(tag => (
                <div 
                  key={tag.id} 
                  onClick={() => setSelectedTagForSearch(tag)}
                  className={`bg-card/30 cyber-border p-6 hover:border-accent transition-all group relative cursor-pointer ${selectedTagForSearch?.id === tag.id ? 'border-accent ring-1 ring-accent/30 shadow-[0_0_20px_rgba(0,243,255,0.1)]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: tag.color }} />
                      <h3 className="text-xl font-serif text-text">{tag.name}</h3>
                    </div>
                    {isContributor && (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(tag.id);
                            setForm(tag);
                            setShowAddForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 text-muted hover:text-accent transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tag.id);
                          }}
                          className="p-1.5 text-muted hover:text-primary transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      {tag.affectedRole === 'Survivor' ? <UserIcon className="w-4 h-4 text-accent" /> : <Shield className="w-4 h-4 text-primary" />}
                      <span className="text-xs font-mono text-muted uppercase tracking-widest font-bold">
                        {tag.affectedRole === 'Survivor' ? '求生者阵营' : '监管者阵营'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tag.affectedStats?.map(stat => (
                        <span key={stat} className="text-xs font-mono px-2.5 py-1 bg-bg border border-border text-muted/90 font-medium">
                          {stat}
                        </span>
                      ))}
                      {(!tag.affectedStats || tag.affectedStats.length === 0) && (
                        <span className="text-xs font-mono italic text-muted/40">未定义影响属性</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center text-[10px] font-mono text-muted/40 uppercase tracking-tighter">
                    <span>UID: {tag.id.slice(-8)}</span>
                    <span>UPDATE: {tag.updatedAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {tags.length === 0 && !showAddForm && (
                <div className="col-span-full py-20 text-center border border-dashed border-border/50">
                  <TagIcon className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                  <p className="text-muted font-mono text-sm uppercase tracking-widest">暂无标签数据_NO_TAGS_FOUND</p>
                </div>
              )}
            </div>

            {/* Search Results Section */}
            {selectedTagForSearch && (
              <div ref={searchResultsRef} className="mt-12 border-t border-border pt-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-1.5 h-10 bg-accent" />
                    <div>
                      <h3 className="text-3xl font-serif text-text flex items-center gap-4">
                        <Search className="text-accent" size={28} /> 标签关联内容: <span className="text-accent">{selectedTagForSearch.name}</span>
                      </h3>
                      <p className="text-sm font-mono text-muted uppercase tracking-[0.2em] mt-2 font-bold">FOUND {searchResults.characters.length} CHARACTERS & {searchResults.talents.length} TALENTS</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleExportResults}
                      className="text-accent hover:bg-accent hover:text-bg flex items-center gap-3 text-xs font-mono uppercase tracking-widest border border-accent px-6 py-2 transition-all font-bold"
                    >
                      <Download className="w-5 h-5" /> 导出关联内容_EXPORT
                    </button>
                    <button 
                      onClick={() => setSelectedTagForSearch(null)}
                      className="text-muted hover:text-text flex items-center gap-3 text-xs font-mono uppercase tracking-widest border border-border px-6 py-2 hover:border-accent transition-all"
                    >
                      <LogOut className="w-5 h-5" /> 关闭搜索_CLOSE
                    </button>
                  </div>
                </div>

                <div className="space-y-16">
                  {/* Faction Grouping: Survivors */}
                  {(searchResults.characters.some(c => c.role === 'Survivor') || searchResults.talents.some(t => t.role === 'Survivor')) && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
                        <h4 className="text-xl font-serif text-accent flex items-center gap-3 px-6">
                          <ShieldCheck className="w-6 h-6" /> 求生者阵营关联 SURVIVOR_RESOURCES
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Survivor Characters */}
                        <div className="space-y-6">
                          <h5 className="text-xs font-mono uppercase tracking-[0.3em] text-muted flex items-center gap-2 border-b border-border/50 pb-2 font-bold">
                            角色档案 CHARACTERS
                          </h5>
                          <div className="flex flex-wrap gap-4">
                            {searchResults.characters.filter(c => c.role === 'Survivor').map(char => (
                              <div key={char.id} className="relative group">
                                {/* Icon */}
                                <div className="w-16 h-16 bg-bg border border-border overflow-hidden cursor-help hover:border-accent transition-all shadow-lg">
                                  <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover transition-all" referrerPolicy="no-referrer" />
                                </div>
                                
                                {/* Hover Detail Card */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-card border border-accent p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-all translate-y-2 group-hover:translate-y-0">
                                  <div className="flex gap-4 items-start mb-4">
                                    <div className="w-14 h-14 bg-bg border border-border overflow-hidden flex-shrink-0">
                                      <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[10px] font-serif text-accent mb-0.5">{char.title}</div>
                                      <div className="text-base font-bold text-text">{char.name}</div>
                                      <div className="text-[9px] font-mono text-muted uppercase tracking-widest">{char.type}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-4 pl-2 border-l-2 border-accent/20 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {char.skills.filter(s => s.tags?.includes(selectedTagForSearch.name)).map((skill, sIdx) => (
                                      <div key={sIdx} className="space-y-1.5">
                                        <div className="text-xs font-bold text-accent flex items-center gap-2">
                                          <div className="w-1 h-1 bg-accent rounded-full" />
                                          {skill.name}
                                        </div>
                                        <p className="text-[11px] text-muted leading-relaxed font-mono whitespace-pre-wrap">{skill.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-accent" />
                                </div>
                              </div>
                            ))}
                            {searchResults.characters.filter(c => c.role === 'Survivor').length === 0 && (
                              <div className="w-full py-10 text-center border border-dashed border-border/20 text-muted/20 font-mono text-[10px] uppercase tracking-widest">无关联角色</div>
                            )}
                          </div>
                        </div>

                        {/* Survivor Talents */}
                        <div className="space-y-6">
                          <h5 className="text-xs font-mono uppercase tracking-[0.3em] text-muted flex items-center gap-2 border-b border-border/50 pb-2 font-bold">
                            天赋定义 TALENTS
                          </h5>
                          <div className="flex flex-wrap gap-3">
                            {searchResults.talents.filter(t => t.role === 'Survivor').map(talent => (
                              <div key={talent.id} className="relative group">
                                {/* Talent Chip */}
                                <div className="px-4 py-2 bg-card/40 border border-border hover:border-accent transition-all cursor-help flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3 text-accent" />
                                  <span className="text-xs font-bold text-text">{talent.name}</span>
                                </div>

                                {/* Hover Detail Card */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-card border border-accent p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-all translate-y-2 group-hover:translate-y-0">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="text-lg font-bold text-text">{talent.name}</div>
                                    <div className="text-[10px] font-mono text-muted bg-bg px-2 py-1 border border-border font-bold">{talent.nodeId}</div>
                                  </div>
                                  <p className="text-xs text-muted/80 font-mono leading-relaxed mb-4 whitespace-pre-wrap">{talent.description}</p>
                                  {talent.effect && (
                                    <div className="text-[11px] font-mono text-accent/80 bg-accent/5 p-3 border-l-2 border-accent">
                                      <span className="text-[9px] uppercase opacity-50 block mb-1">具体效果 EFFECT:</span>
                                      {talent.effect}
                                    </div>
                                  )}
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-accent" />
                                </div>
                              </div>
                            ))}
                            {searchResults.talents.filter(t => t.role === 'Survivor').length === 0 && (
                              <div className="w-full py-10 text-center border border-dashed border-border/20 text-muted/20 font-mono text-[10px] uppercase tracking-widest">无关联天赋</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Faction Grouping: Hunters */}
                  {(searchResults.characters.some(c => c.role === 'Hunter') || searchResults.talents.some(t => t.role === 'Hunter')) && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                        <h4 className="text-xl font-serif text-primary flex items-center gap-3 px-6">
                          <Skull className="w-6 h-6" /> 监管者阵营关联 HUNTER_RESOURCES
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Hunter Characters */}
                        <div className="space-y-6">
                          <h5 className="text-xs font-mono uppercase tracking-[0.3em] text-muted flex items-center gap-2 border-b border-border/50 pb-2 font-bold">
                            角色档案 CHARACTERS
                          </h5>
                          <div className="flex flex-wrap gap-4">
                            {searchResults.characters.filter(c => c.role === 'Hunter').map(char => (
                              <div key={char.id} className="relative group">
                                {/* Icon */}
                                <div className="w-16 h-16 bg-bg border border-border overflow-hidden cursor-help hover:border-primary transition-all shadow-lg">
                                  <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover transition-all" referrerPolicy="no-referrer" />
                                </div>
                                
                                {/* Hover Detail Card */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-card border border-primary p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-all translate-y-2 group-hover:translate-y-0">
                                  <div className="flex gap-4 items-start mb-4">
                                    <div className="w-14 h-14 bg-bg border border-border overflow-hidden flex-shrink-0">
                                      <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[10px] font-serif text-primary mb-0.5">{char.title}</div>
                                      <div className="text-base font-bold text-text">{char.name}</div>
                                      <div className="text-[9px] font-mono text-muted uppercase tracking-widest">{char.type}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-4 pl-2 border-l-2 border-primary/20 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {char.skills.filter(s => s.tags?.includes(selectedTagForSearch.name)).map((skill, sIdx) => (
                                      <div key={`s-${sIdx}`} className="space-y-1.5">
                                        <div className="text-xs font-bold text-primary flex items-center gap-2">
                                          <div className="w-1 h-1 bg-primary rounded-full" />
                                          [外在特质] {skill.name}
                                        </div>
                                        <p className="text-[11px] text-muted leading-relaxed font-mono whitespace-pre-wrap">{skill.description}</p>
                                      </div>
                                    ))}
                                    {char.presence?.filter(p => p.tags?.includes(selectedTagForSearch.name)).map((p, pIdx) => (
                                      <div key={`p-${pIdx}`} className="space-y-1.5">
                                        <div className="text-xs font-bold text-gold flex items-center gap-2">
                                          <div className="w-1 h-1 bg-gold rounded-full" />
                                          [{p.tier}阶技能] {p.name}
                                        </div>
                                        <p className="text-[11px] text-muted leading-relaxed font-mono whitespace-pre-wrap">{p.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary" />
                                </div>
                              </div>
                            ))}
                            {searchResults.characters.filter(c => c.role === 'Hunter').length === 0 && (
                              <div className="w-full py-10 text-center border border-dashed border-border/20 text-muted/20 font-mono text-[10px] uppercase tracking-widest">无关联角色</div>
                            )}
                          </div>
                        </div>

                        {/* Hunter Talents */}
                        <div className="space-y-6">
                          <h5 className="text-xs font-mono uppercase tracking-[0.3em] text-muted flex items-center gap-2 border-b border-border/50 pb-2 font-bold">
                            天赋定义 TALENTS
                          </h5>
                          <div className="flex flex-wrap gap-3">
                            {searchResults.talents.filter(t => t.role === 'Hunter').map(talent => (
                              <div key={talent.id} className="relative group">
                                {/* Talent Chip */}
                                <div className="px-4 py-2 bg-card/40 border border-border hover:border-primary transition-all cursor-help flex items-center gap-2">
                                  <Skull className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-bold text-text">{talent.name}</span>
                                </div>

                                {/* Hover Detail Card */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-card border border-primary p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-all translate-y-2 group-hover:translate-y-0">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="text-lg font-bold text-text">{talent.name}</div>
                                    <div className="text-[10px] font-mono text-muted bg-bg px-2 py-1 border border-border font-bold">{talent.nodeId}</div>
                                  </div>
                                  <p className="text-xs text-muted/80 font-mono leading-relaxed mb-4 whitespace-pre-wrap">{talent.description}</p>
                                  {talent.effect && (
                                    <div className="text-[11px] font-mono text-primary/80 bg-primary/5 p-3 border-l-2 border-primary">
                                      <span className="text-[9px] uppercase opacity-50 block mb-1">具体效果 EFFECT:</span>
                                      {talent.effect}
                                    </div>
                                  )}
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary" />
                                </div>
                              </div>
                            ))}
                            {searchResults.talents.filter(t => t.role === 'Hunter').length === 0 && (
                              <div className="w-full py-10 text-center border border-dashed border-border/20 text-muted/20 font-mono text-[10px] uppercase tracking-widest">无关联天赋</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className={`text-xl font-serif font-bold ${confirmModal.type === 'danger' ? 'text-primary' : 'text-accent'}`}>
                {confirmModal.title}
              </h3>
              <p className="text-sm text-muted font-mono leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-6 py-2 border border-border text-muted text-xs font-mono hover:text-text transition-colors"
              >
                取消_CANCEL
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`px-6 py-2 font-mono text-xs text-white transition-all hover:scale-105 ${
                  confirmModal.type === 'danger' ? 'bg-primary' : 'bg-accent text-bg'
                }`}
              >
                确认_CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
