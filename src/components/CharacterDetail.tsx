import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Character, COLORS, Tag, EXCLUDED_SURVIVOR_TRAITS, EXCLUDED_HUNTER_TRAITS } from '../constants';
import { Shield, Zap, Heart, Users, Search, Activity, Target, Layers, Cpu, Edit3, Trash2, Save, X, Plus, Clock, Tag as TagIcon, Download, FileText, Copy, LogOut } from 'lucide-react';
import { CharacterTraitCategory } from '../constants';
import { exportCharacterCardToMarkdown, sanitizeFileName } from '../services/exportService';

type DetailTab = 'traits' | 'external' | 'mechanics';

interface Props {
  character: Character;
  allCharacters?: Character[];
  onEdit?: (char: Character) => void;
  onDelete?: (char: Character) => void;
  onViewFactors?: (category: string) => void;
  onViewTalent?: (char: Character) => void;
  onViewAuxiliaryTrait?: (char: Character) => void;
  onUpdate?: (charId: string, data: Partial<Character>) => Promise<void>;
}

export const CharacterDetail = ({ 
  character, 
  allCharacters, 
  onEdit, 
  onDelete, 
  onViewFactors, 
  onViewTalent, 
  onViewAuxiliaryTrait,
  onUpdate 
}: Props) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('traits');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'visual' | 'text'>('visual');
  const [editingSection, setEditingSection] = useState<DetailTab | null>(null);
  const [saving, setSaving] = useState(false);

  // Local state for editing
  const [editTraits, setEditTraits] = useState<CharacterTraitCategory[]>([]);
  const [editSkills, setEditSkills] = useState<{ name: string; description: string; icon?: string; tags?: string[]; cooldown?: string; cost?: string }[]>([]);
  const [editPresence, setEditPresence] = useState<{ tier: number; name: string; description: string; cooldown?: string; tags?: string[]; icon?: string }[]>([]);
  const [editMechanics, setEditMechanics] = useState<{ title: string; content: string; icon?: string }[]>([]);
  const [editLinkedMechanics, setEditLinkedMechanics] = useState<{ characterId: string; mechanicIndex: number }[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [skillsImportMode, setSkillsImportMode] = useState(false);
  const [skillsImportText, setSkillsImportText] = useState('');
  const [presenceImportMode, setPresenceImportMode] = useState(false);
  const [presenceImportText, setPresenceImportText] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tags'), (snapshot) => {
      const tags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
      setAvailableTags(tags);
    });
    return () => unsub();
  }, []);

  const canEdit = !!onEdit;

  const generatePlainText = () => {
    let text = `【角色档案：${character.title} - ${character.name}】\n`;
    text += `========================================\n`;
    text += `阵营：${character.role === 'Survivor' ? '求生者' : '监管者'}\n`;
    text += `定位：${character.type}\n`;
    text += `排序ID：${character.order}\n\n`;
    
    text += `【背景描述】\n${character.description}\n\n`;
    
    text += `【核心属性】\n`;
    character.traits?.forEach(cat => {
      text += `--- ${cat.category} ---\n`;
      cat.items.forEach(item => {
        text += `${item.label}: ${item.value}\n`;
      });
    });
    text += `\n`;
    
    text += `【外在特质】\n`;
    character.skills?.forEach(skill => {
      text += `名称：${skill.name}\n`;
      if (skill.cooldown) text += `冷却：${skill.cooldown}\n`;
      if (skill.cost) text += `消耗：${skill.cost}\n`;
      text += `描述：${skill.description}\n`;
      if (skill.tags?.length) text += `标签：#${skill.tags.join(' #')}\n`;
      text += `--------------------\n`;
    });
    
    if (character.role === 'Hunter' && character.presence) {
      text += `\n【存在感阶级】\n`;
      character.presence.forEach(p => {
        text += `${p.tier}阶：${p.name}\n`;
        if (p.cooldown) text += `冷却：${p.cooldown}\n`;
        text += `描述：${p.description}\n`;
        if (p.tags?.length) text += `标签：#${p.tags.join(' #')}\n`;
        text += `--------------------\n`;
      });
    }
    
    if (character.role === 'Survivor' && character.mechanics) {
      text += `\n【核心机制】\n`;
      character.mechanics.forEach(mech => {
        text += `标题：${mech.title}\n`;
        text += `内容：${mech.content}\n`;
        text += `--------------------\n`;
      });
    }
    
    return text;
  };

  const startEditing = (section: DetailTab) => {
    if (section === 'traits') setEditTraits(JSON.parse(JSON.stringify(character.traits || [])));
    if (section === 'external') setEditSkills(JSON.parse(JSON.stringify(character.skills || [])));
    if (section === 'mechanics') {
      if (character.role === 'Hunter') {
        const basePresence = [
          { tier: 0, name: '0阶', description: '', cooldown: '', tags: [] },
          { tier: 1, name: '1阶', description: '', cooldown: '', tags: [] },
          { tier: 2, name: '2阶', description: '', cooldown: '', tags: [] }
        ];
        const currentPresence = character.presence || [];
        const finalPresence = basePresence.map((p, i) => {
          const existing = currentPresence.find(cp => cp.tier === p.tier);
          return existing || p;
        });
        setEditPresence(JSON.parse(JSON.stringify(finalPresence)));
      } else {
        setEditMechanics(JSON.parse(JSON.stringify(character.mechanics || [])));
        setEditLinkedMechanics(JSON.parse(JSON.stringify(character.linkedMechanics || [])));
      }
    }
    setEditingSection(section);
  };

  const handleSaveSection = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      const data: Partial<Character> = {};
      if (editingSection === 'traits') data.traits = editTraits;
      if (editingSection === 'external') data.skills = editSkills;
      if (editingSection === 'mechanics') {
        if (character.role === 'Hunter') {
          data.presence = editPresence;
        } else {
          data.mechanics = editMechanics;
          data.linkedMechanics = editLinkedMechanics;
        }
      }
      
      await onUpdate(character.id, data);
      setEditingSection(null);
      setSkillsImportMode(false);
      setSkillsImportText('');
    } catch (error) {
      console.error("Failed to save section:", error);
      alert("保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  const parseSkillsOnly = (text: string) => {
    const skills: any[] = [];
    // Pre-process: Join icon URLs with the following line if they are separated by a newline
    const normalizedText = text.replace(/(\[.*?\])\s*\n/g, '$1 ');
    // Split by newline followed by an icon or a name pattern (something followed by a colon)
    const skillBlocks = normalizedText.split(/\n(?=\[|[^:\n]+[:：])/).filter(b => b.trim());
    
    skillBlocks.forEach(block => {
      // Format: [iconUrl] Name: Description #tag1 #tag2
      let icon = '';
      const iconMatch = block.match(/\[(.*?)\]/);
      if (iconMatch) {
        icon = iconMatch[1].trim();
        block = block.replace(/\[.*?\]/, '').trim();
      }

      const tags: string[] = [];
      const tagMatches = block.match(/#(\S+)/g);
      if (tagMatches) {
        tagMatches.forEach(t => tags.push(t.substring(1)));
        block = block.replace(/#\S+/g, '').trim();
      }

      const [name, ...descParts] = block.split(/[:：]/);
      if (name && descParts.length > 0) {
        const skillName = name.trim();
        const existingIdx = skills.findIndex(s => s.name === skillName);
        const skillData = { 
          name: skillName, 
          description: descParts.join(':').trim(),
          icon,
          tags
        };
        if (existingIdx >= 0) {
          skills[existingIdx] = skillData;
        } else {
          skills.push(skillData);
        }
      }
    });
    return skills;
  };

  const handleSkillsSmartImport = () => {
    if (!skillsImportText.trim()) return;
    const parsedSkills = parseSkillsOnly(skillsImportText);
    if (parsedSkills.length > 0) {
      const newSkills = [...editSkills];
      parsedSkills.forEach(ps => {
        const idx = newSkills.findIndex(s => s.name === ps.name);
        if (idx >= 0) {
          newSkills[idx] = { ...newSkills[idx], ...ps };
        } else {
          newSkills.push(ps);
        }
      });
      setEditSkills(newSkills);
      setSkillsImportText('');
      setSkillsImportMode(false);
    }
  };

  const handlePresenceSmartImport = () => {
    if (!presenceImportText.trim()) return;
    
    let newPresence = [...editPresence];
    // Pre-process: Replace </br> with \n and join icon URLs with the following line
    const normalizedText = presenceImportText
      .replace(/<\/br>/gi, '\n')
      .replace(/(\[.*?\])\s*\n/g, '$1 ');
    
    // Split by tier pattern at the start of a line
    const blocks = normalizedText.trim().split(/\n(?=\d阶)/);
    
    blocks.forEach(block => {
      const tierMatch = block.match(/^(\d)阶/);
      if (tierMatch) {
        const tier = parseInt(tierMatch[1]);
        let content = block.replace(/^\d阶[:：]/, '').trim();
        
        // Extract Icon
        let icon = '';
        const iconMatch = content.match(/\[(.*?)\]/);
        if (iconMatch) {
          icon = iconMatch[1].trim();
          content = content.replace(/\[.*?\]/, '').trim();
        }

        // Extract Tags
        const tags: string[] = [];
        const tagMatches = content.match(/#(\S+)/g);
        if (tagMatches) {
          tagMatches.forEach(t => {
            const tagName = t.substring(1);
            if (!tags.includes(tagName)) tags.push(tagName);
          });
          content = content.replace(/#\S+/g, '').trim();
        }

        // Extract Cooldown
        let cooldown = '';
        const cdMatch = content.match(/\|?\s*(?:冷却|CD)[:：]\s*([^#|\[]+)/i);
        if (cdMatch) {
          cooldown = cdMatch[1].trim();
          content = content.replace(/\|?\s*(?:冷却|CD)[:：]\s*[^#|\[]+/i, '').trim();
        }

        // Extract Name and Description
        const [name, ...descParts] = content.split(/[:：]/);
        if (name && descParts.length > 0) {
          const skillName = name.trim();
          const skillDesc = descParts.join(':').trim();
          
          // Find if we should update or append
          // If it's one of the initial empty ones (name is "0阶", "1阶", "2阶" and description is empty)
          const emptyIdx = newPresence.findIndex(p => p.tier === tier && p.name === `${tier}阶` && !p.description);
          
          if (emptyIdx >= 0) {
            newPresence[emptyIdx] = {
              tier,
              name: skillName,
              description: skillDesc,
              cooldown,
              tags,
              icon
            };
          } else {
            // Check if an item with same tier and name already exists
            const existingIdx = newPresence.findIndex(p => p.tier === tier && p.name === skillName);
            if (existingIdx >= 0) {
              newPresence[existingIdx] = {
                tier,
                name: skillName,
                description: skillDesc,
                cooldown,
                tags,
                icon
              };
            } else {
              newPresence.push({
                tier,
                name: skillName,
                description: skillDesc,
                cooldown,
                tags,
                icon
              });
            }
          }
        }
      }
    });

    // Sort by tier
    newPresence.sort((a, b) => a.tier - b.tier);

    setEditPresence(newPresence);
    setPresenceImportText('');
    setPresenceImportMode(false);
  };

  const baseCharacter = allCharacters?.find(c => 
    c.id === (character.role === 'Survivor' ? 'base_survivor' : 'base_hunter')
  );

  const tabs = [
    { id: 'traits', label: '特质详情', icon: <Activity className="w-4 h-4" /> },
    { id: 'external', label: '外在特质', icon: <Target className="w-4 h-4" /> },
    { id: 'mechanics', label: character.role === 'Hunter' ? '存在感' : '专属机制', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left: Image and Basic Info */}
      <div className="lg:col-span-4 space-y-6">
        <div className="relative group overflow-hidden rounded-2xl shadow-sm bg-bg/30 flex items-center justify-center">
          <img 
            src={character.imageUrl} 
            alt={character.name} 
            className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-sans font-bold tracking-tight font-bold text-slate-800 dark:text-slate-100 mb-1">
              {character.title}
            </h1>
            <p className="text-xl text-text font-medium italic opacity-70 tracking-tighter">{character.name}</p>
          </div>
          <div className="absolute top-4 right-4 bg-primary px-2 py-1 text-xs font-medium text-white">
            ID: {String(character.order !== undefined ? character.order : character.id).padStart(4, '0')}
          </div>
          
          {onEdit && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
              <button 
                onClick={() => onEdit(character)}
                className="px-3 py-1.5 bg-slate-800 dark:bg-slate-200 text-bg hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 font-medium text-xs font-bold uppercase tracking-widest"
              >
                <Edit3 className="w-3.5 h-3.5" />
                编辑档案_EDIT
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 bg-card border border-border text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200 transition-all shadow-lg flex items-center gap-2 font-medium text-xs font-bold uppercase tracking-widest"
              >
                <Download className="w-3.5 h-3.5" />
                导出档案_EXPORT
              </button>
              {onDelete && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 font-medium text-xs font-bold uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除档案_DELETE
                </button>
              )}
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-bg/90 z-[100] flex items-center justify-center p-6">
            <div className="bg-card border border-primary p-8 max-w-md w-full rounded-2xl shadow-sm animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-sans font-bold tracking-tight text-primary mb-4 flex items-center gap-3">
                <Trash2 className="w-6 h-6" /> 确认删除档案？
              </h3>
              <p className="text-muted text-sm font-medium mb-8 leading-relaxed">
                您正在尝试删除角色 <span className="text-slate-800 dark:text-slate-100 font-bold">{character.title} ({character.name})</span> 的档案。此操作不可逆，所有关联数据将被永久移除。
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-border text-muted hover:text-text hover:border-text transition-all font-medium text-xs tracking-widest"
                >
                  取消_CANCEL
                </button>
                <button 
                  onClick={() => {
                    onDelete?.(character);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-3 bg-primary text-white hover:bg-primary/80 transition-all font-medium text-xs tracking-widest"
                >
                  确认删除_CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 bg-bg/95 z-[100] flex items-start justify-center p-6 overflow-y-auto custom-scrollbar">
            <div className="bg-card border border-slate-800 dark:border-slate-200 p-8 max-w-5xl w-full my-8 flex flex-col rounded-2xl shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-6">
                  <h3 className="text-2xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Download className="w-6 h-6" /> 角色档案导出_EXPORT_DOSSIER
                  </h3>
                  <div className="flex bg-bg/50 p-1 border border-border">
                    <button 
                      onClick={() => setExportMode('visual')}
                      className={`px-3 py-1 text-[10px] font-medium transition-all ${exportMode === 'visual' ? 'bg-slate-800 dark:bg-slate-200 text-bg' : 'text-muted hover:text-text'}`}
                    >
                      视觉模式_VISUAL
                    </button>
                    <button 
                      onClick={() => setExportMode('text')}
                      className={`px-3 py-1 text-[10px] font-medium transition-all ${exportMode === 'text' ? 'bg-slate-800 dark:bg-slate-200 text-bg' : 'text-muted hover:text-text'}`}
                    >
                      文本模式_TEXT
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-muted hover:text-slate-800 dark:text-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8 font-medium text-sm">
                {exportMode === 'visual' ? (
                  <>
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <div className="text-slate-800 dark:text-slate-100 border-b border-slate-800 dark:border-slate-200/30 pb-1 mb-2 uppercase tracking-widest text-xs">基础信息_BASIC_INFO</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-muted">称号:</span> {character.title}</div>
                        <div><span className="text-muted">姓名:</span> {character.name}</div>
                        <div><span className="text-muted">阵营:</span> {character.role === 'Survivor' ? '求生者' : '监管者'}</div>
                        <div><span className="text-muted">定位:</span> {character.type}</div>
                        <div><span className="text-muted">排序ID:</span> {character.order}</div>
                      </div>
                      <div className="mt-4">
                        <span className="text-muted block mb-1">背景描述:</span>
                        <p className="text-text/80 leading-relaxed whitespace-pre-wrap">{character.description}</p>
                      </div>
                    </div>

                    {/* Traits */}
                    <div className="space-y-4">
                      <div className="text-slate-800 dark:text-slate-100 border-b border-slate-800 dark:border-slate-200/30 pb-1 mb-2 uppercase tracking-widest text-xs">核心属性_CORE_TRAITS</div>
                      {character.traits?.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="text-primary text-xs font-bold">{cat.category}</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {cat.items.map((item, i) => (
                              <div key={i} className="flex justify-between border-b border-border/30 pb-1">
                                <span className="text-muted text-[10px]">{item.label}</span>
                                <span className="text-text text-[10px]">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                      <div className="text-slate-800 dark:text-slate-100 border-b border-slate-800 dark:border-slate-200/30 pb-1 mb-2 uppercase tracking-widest text-xs">外在特质_EXTERNAL_TRAITS</div>
                      {character.skills?.map((skill, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/5 dark:bg-slate-200/5 border border-slate-800 dark:border-slate-200/20 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-800 dark:text-slate-100 font-bold">{skill.name}</span>
                            <div className="flex gap-2">
                              {skill.cooldown && <span className="text-[10px] bg-bg px-1 border border-border">CD: {skill.cooldown}</span>}
                              {skill.cost && <span className="text-[10px] bg-bg px-1 border border-border">消耗: {skill.cost}</span>}
                            </div>
                          </div>
                          <p className="text-xs text-text/80 leading-relaxed whitespace-pre-wrap">{skill.description}</p>
                          {skill.tags && skill.tags.length > 0 && (
                            <div className="flex gap-1">
                              {skill.tags.map(tag => (
                                <span key={tag} className="text-[9px] text-muted border border-border/50 px-1">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Presence (Hunter Only) */}
                    {character.role === 'Hunter' && character.presence && (
                      <div className="space-y-4">
                        <div className="text-slate-800 dark:text-slate-100 border-b border-slate-800 dark:border-slate-200/30 pb-1 mb-2 uppercase tracking-widest text-xs">存在感阶级_PRESENCE</div>
                        {character.presence.map((p, idx) => (
                          <div key={idx} className="p-3 bg-primary/5 border border-primary/20 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-primary font-bold">{p.tier}阶: {p.name}</span>
                              {p.cooldown && <span className="text-[10px] bg-bg px-1 border border-border">CD: {p.cooldown}</span>}
                            </div>
                            <p className="text-xs text-text/80 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                            {p.tags && p.tags.length > 0 && (
                              <div className="flex gap-1">
                                {p.tags.map(tag => (
                                  <span key={tag} className="text-[9px] text-muted border border-border/50 px-1">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mechanics (Survivor Only) */}
                    {character.role === 'Survivor' && character.mechanics && (
                      <div className="space-y-4">
                        <div className="text-slate-800 dark:text-slate-100 border-b border-slate-800 dark:border-slate-200/30 pb-1 mb-2 uppercase tracking-widest text-xs">核心机制_MECHANICS</div>
                        {character.mechanics.map((mech, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/5 dark:bg-slate-200/5 border border-slate-800 dark:border-slate-200/20 space-y-2">
                            <div className="text-slate-800 dark:text-slate-100 font-bold">{mech.title}</div>
                            <p className="text-xs text-text/80 leading-relaxed whitespace-pre-wrap">{mech.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-bg/50 border border-border p-6 relative group">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatePlainText());
                      }}
                      className="absolute top-4 right-4 p-2 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all flex items-center gap-2 text-[10px] font-medium"
                    >
                      <Copy className="w-3 h-3" /> 复制文本_COPY
                    </button>
                    <pre className="text-xs text-text/80 whitespace-pre-wrap font-medium leading-relaxed">
                      {generatePlainText()}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between items-center">
                <div className="flex gap-4 flex-1 max-w-2xl">
                  <button 
                    onClick={() => {
                      const fileName = exportCharacterCardToMarkdown(character, availableTags);
                      alert(`角色资料卡导出成功！\n- 角色: ${character.title} ${character.name}\n- 文件名: ${fileName}`);
                    }}
                    className="flex-1 py-3 bg-slate-800 dark:bg-slate-200 text-bg hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> 导出为 Markdown_MD
                  </button>
                  <button 
                    onClick={() => {
                      const dataStr = JSON.stringify(character, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const rawName = `${character.title}_${character.name}_档案.json`;
                      const safeName = sanitizeFileName(rawName);
                      link.download = safeName;
                      link.click();
                      URL.revokeObjectURL(url);
                      alert(`角色 JSON 导出成功！\n- 角色: ${character.title} ${character.name}\n- 文件名: ${safeName}`);
                    }}
                    className="flex-1 py-3 bg-slate-800 dark:bg-slate-200 text-bg hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> 导出为 JSON_JSON
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-bg border border-border text-text hover:border-slate-800 dark:border-slate-200 transition-all font-medium text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 打印档案_PRINT
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-3 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all font-medium text-xs font-bold tracking-widest flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> 退出页面_EXIT
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card/50 border border-border p-6 rounded-none rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <span className="text-muted uppercase text-xs font-medium tracking-widest">阵营 FACTION</span>
            <span className="text-primary font-bold font-medium text-sm">{character.role === 'Survivor' ? '求生者' : '监管者'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted uppercase text-xs font-medium tracking-widest">定位 TYPE</span>
            <span className="text-text font-medium text-sm">{character.type}</span>
          </div>
          
          <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
            <button 
              onClick={() => onViewTalent?.(character)}
              className="w-full py-2 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-colors font-medium text-sm font-bold flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> 天赋页面_TALENT
            </button>
            {character.role === 'Hunter' && (
              <button 
                onClick={() => onViewAuxiliaryTrait?.(character)}
                className="w-full py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-colors font-medium text-sm font-bold flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> 辅助特质_AUXILIARY
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Tabs and Content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-card/50 p-1 border border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`flex-1 min-w-[100px] py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300 relative group overflow-hidden ${
                activeTab === tab.id 
                  ? 'text-slate-800 dark:text-slate-100' 
                  : 'text-muted hover:text-text'
              }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-slate-800/10 dark:bg-slate-200/10 border-b-2 border-slate-800 dark:border-slate-200" />
              )}
              <div className={`${activeTab === tab.id ? 'text-slate-800 dark:text-slate-100' : 'text-muted group-hover:text-primary'} transition-colors`}>
                {tab.icon}
              </div>
              <span className="text-xs font-bold tracking-widest uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8 animate-in fade-in duration-500">
          {activeTab === 'traits' && (
            <section className="bg-card/40 border border-border p-8 rounded-none rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-[10px] font-medium text-muted opacity-20">系统分析_V2.0</div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Activity className="w-6 h-6" /> 核心特质分析
                </h2>
                {canEdit && (
                  <div className="flex gap-2">
                    {editingSection === 'traits' ? (
                      <>
                        <button 
                          onClick={() => setEditingSection(null)}
                          className="px-3 py-1 bg-bg border border-border text-muted hover:text-text transition-all font-medium text-[10px] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> 取消_CANCEL
                        </button>
                        <button 
                          onClick={handleSaveSection}
                          disabled={saving}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary/80 transition-all font-medium text-[10px] flex items-center gap-1 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" /> {saving ? '保存中...' : '保存_SAVE'}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => startEditing('traits')}
                        className="px-3 py-1 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-[10px] flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> 单独编辑_EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {editingSection === 'traits' ? (
                <div className="space-y-6">
                  {editTraits.map((cat, catIdx) => (
                    <div key={catIdx} className="p-4 bg-bg/20 border border-border">
                      <div className="flex justify-between items-center mb-4">
                        <input 
                          type="text"
                          value={cat.category}
                          onChange={(e) => {
                            const newTraits = [...editTraits];
                            newTraits[catIdx].category = e.target.value;
                            setEditTraits(newTraits);
                          }}
                          className="bg-transparent border-b border-border text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium text-sm flex-1 mr-4"
                        />
                        <button 
                          onClick={() => {
                            const newTraits = [...editTraits];
                            newTraits[catIdx].items.push({ label: '', value: '' });
                            setEditTraits(newTraits);
                          }}
                          className="text-[10px] text-slate-800 dark:text-slate-100 hover:text-white flex items-center gap-1 font-medium"
                        >
                          <Plus className="w-3 h-3" /> 添加属性
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cat.items
                          .map((item, originalIdx) => ({ ...item, originalIdx }))
                          .filter(item => {
                            if (character.role === 'Survivor') return !EXCLUDED_SURVIVOR_TRAITS.includes(item.label);
                            if (character.role === 'Hunter') return !EXCLUDED_HUNTER_TRAITS.includes(item.label);
                            return true;
                          })
                          .map((item) => (
                          <div key={item.originalIdx} className="flex items-center gap-2 bg-card/30 p-2 border border-border/50">
                            <input 
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const newTraits = [...editTraits];
                                newTraits[catIdx].items[item.originalIdx].label = e.target.value;
                                setEditTraits(newTraits);
                              }}
                              className="w-24 bg-transparent text-xs text-muted outline-none border-r border-border/30 pr-2"
                            />
                            <input 
                              type="text"
                              value={item.value}
                              onChange={(e) => {
                                const newTraits = [...editTraits];
                                newTraits[catIdx].items[item.originalIdx].value = e.target.value;
                                setEditTraits(newTraits);
                              }}
                              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                              placeholder="数值"
                            />
                            <button 
                              onClick={() => {
                                const newTraits = [...editTraits];
                                newTraits[catIdx].items = newTraits[catIdx].items.filter((_, idx) => idx !== item.originalIdx);
                                setEditTraits(newTraits);
                              }}
                              className="text-muted hover:text-primary"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditTraits([...editTraits, { category: '新分类', items: [] }])}
                    className="w-full py-2 border border-dashed border-border text-muted hover:text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200 transition-all font-medium text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 添加新分类_ADD_CATEGORY
                  </button>
                </div>
              ) : character.traits && character.traits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-medium text-sm">
                  {character.traits.filter(cat => cat.items.length > 0).map((cat, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-primary font-bold mb-2 border-b border-primary/30 pb-1 flex justify-between items-center">
                        <span>{cat.category}</span>
                        {onViewFactors && (
                          <button 
                            onClick={() => onViewFactors(cat.category)}
                            className="text-[10px] text-slate-800 dark:text-slate-100 hover:text-white transition-colors flex items-center gap-1 font-medium uppercase tracking-tighter"
                          >
                            影响因素_FACTORS <Search className="w-3 h-3" />
                          </button>
                        )}
                      </h3>
                      <div className="space-y-1">
                        {cat.items
                          .filter(item => {
                            if (character.role === 'Survivor') return !EXCLUDED_SURVIVOR_TRAITS.includes(item.label);
                            if (character.role === 'Hunter') return !EXCLUDED_HUNTER_TRAITS.includes(item.label);
                            return true;
                          })
                          .map((item, j) => {
                          const baseCat = baseCharacter?.traits?.find(bc => 
                            bc.category.split(' ')[0] === cat.category.split(' ')[0]
                          );
                          const baseItem = baseCat?.items.find(bi => bi.label === item.label);
                          const isDifferent = character.role === 'Survivor' && baseItem && baseItem.value !== item.value;

                          return (
                            <BaseStatItem 
                              key={j} 
                              label={item.label} 
                              value={item.value} 
                              isDifferent={!!isDifferent}
                              baseValue={character.role === 'Survivor' ? baseItem?.value : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-text/80 leading-relaxed font-medium text-sm border-l-2 border-primary pl-4 py-2 bg-primary/5">
                    {character.description}
                  </p>
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border text-muted">
                    <p className="text-sm font-medium uppercase tracking-widest">暂无详细特质数据</p>
                    <p className="text-xs mt-2">请在录入页面完善该角色的特质信息</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'external' && (
            <section className="bg-card/40 border border-border p-8 rounded-none rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Target className="w-6 h-6" /> 核心能力模块
                </h2>
                {canEdit && (
                  <div className="flex gap-2">
                    {editingSection === 'external' ? (
                      <>
                        <button 
                          onClick={() => setSkillsImportMode(!skillsImportMode)}
                          className={`px-3 py-1 border transition-all font-medium text-[10px] flex items-center gap-1 ${
                            skillsImportMode ? 'bg-slate-800 dark:bg-slate-200 text-bg border-slate-800 dark:border-slate-200' : 'bg-bg border-border text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200'
                          }`}
                        >
                          <Zap className="w-3 h-3" /> 智能识别_SMART
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSection(null);
                            setSkillsImportMode(false);
                          }}
                          className="px-3 py-1 bg-bg border border-border text-muted hover:text-text transition-all font-medium text-[10px] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> 取消_CANCEL
                        </button>
                        <button 
                          onClick={handleSaveSection}
                          disabled={saving}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary/80 transition-all font-medium text-[10px] flex items-center gap-1 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" /> {saving ? '保存中...' : '保存_SAVE'}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => startEditing('external')}
                        className="px-3 py-1 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-[10px] flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> 单独编辑_EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingSection === 'external' && skillsImportMode && (
                <div className="mb-6 p-4 bg-slate-800/5 dark:bg-slate-200/5 border border-slate-800 dark:border-slate-200/30 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-medium text-slate-800 dark:text-slate-100 uppercase tracking-widest">智能识别导入 (SMART_IMPORT)</span>
                    <span className="text-[9px] text-muted font-medium">格式: [图标URL] 名称: 描述 #标签</span>
                  </div>
                  <textarea 
                    rows={4}
                    value={skillsImportText}
                    onChange={(e) => setSkillsImportText(e.target.value)}
                    placeholder="粘贴特质文本，例如：&#10;[https://example.com/icon.png] 羸弱: 身体虚弱，板窗交互速度降低 #负面 #交互"
                    className="w-full bg-bg/50 border border-border p-3 text-xs text-text font-medium outline-none focus:border-slate-800 dark:border-slate-200 resize-none mb-3"
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setSkillsImportText('');
                        setSkillsImportMode(false);
                      }}
                      className="text-[10px] font-medium text-muted hover:text-text"
                    >
                      取消_CANCEL
                    </button>
                    <button 
                      onClick={handleSkillsSmartImport}
                      className="px-4 py-1 bg-slate-800 dark:bg-slate-200 text-bg text-[10px] font-medium font-bold hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all"
                    >
                      识别并添加_IMPORT
                    </button>
                  </div>
                </div>
              )}

              {editingSection === 'external' ? (
                <div className="space-y-6">
                  {editSkills.map((skill, idx) => (
                    <div key={idx} className="p-4 bg-bg/20 border border-border relative group">
                      <button 
                        onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-transparent border border-border flex items-center justify-center text-muted relative group/icon overflow-hidden">
                          {skill.icon ? (
                            <img src={skill.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Target className="w-6 h-6" />
                          )}
                          <input 
                            type="text"
                            value={skill.icon || ''}
                            onChange={(e) => {
                              const newSkills = [...editSkills];
                              newSkills[idx].icon = e.target.value;
                              setEditSkills(newSkills);
                            }}
                            placeholder="图标URL"
                            className="absolute inset-0 opacity-0 group-hover/icon:opacity-100 bg-bg/90 text-[8px] font-medium p-1 outline-none transition-opacity"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <input 
                            type="text"
                            value={skill.name}
                            onChange={(e) => {
                              const newSkills = [...editSkills];
                              newSkills[idx].name = e.target.value;
                              setEditSkills(newSkills);
                            }}
                            placeholder="特质名称"
                            className="w-full bg-transparent border-b border-border text-text font-bold mb-2 outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted font-medium uppercase">冷却:</span>
                              <input 
                                type="text"
                                value={skill.cooldown || ''}
                                onChange={(e) => {
                                  const newSkills = [...editSkills];
                                  newSkills[idx].cooldown = e.target.value;
                                  setEditSkills(newSkills);
                                }}
                                placeholder="如: 120s"
                                className="flex-1 bg-transparent border-b border-border text-slate-800 dark:text-slate-100 outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted font-medium uppercase">消耗:</span>
                              <input 
                                type="text"
                                value={skill.cost || ''}
                                onChange={(e) => {
                                  const newSkills = [...editSkills];
                                  newSkills[idx].cost = e.target.value;
                                  setEditSkills(newSkills);
                                }}
                                placeholder="如: 1层"
                                className="flex-1 bg-transparent border-b border-border text-slate-800 dark:text-slate-100 outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium text-xs"
                              />
                            </div>
                          </div>
                          <textarea 
                            rows={3}
                            value={skill.description}
                            onChange={(e) => {
                              const newSkills = [...editSkills];
                              newSkills[idx].description = e.target.value;
                              setEditSkills(newSkills);
                            }}
                            placeholder="特质描述..."
                            className="w-full bg-transparent text-xs text-muted outline-none resize-none font-medium"
                          />
                          
                          {/* Tag Selection */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                            {availableTags.map(tag => {
                              const isSelected = skill.tags?.includes(tag.name);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => {
                                    const newSkills = [...editSkills];
                                    const currentTags = newSkills[idx].tags || [];
                                    if (isSelected) {
                                      newSkills[idx].tags = currentTags.filter(t => t !== tag.name);
                                    } else {
                                      newSkills[idx].tags = [...currentTags, tag.name];
                                    }
                                    setEditSkills(newSkills);
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-medium border transition-all flex items-center gap-1 ${
                                    isSelected 
                                      ? 'bg-slate-800 dark:bg-slate-200/20 border-slate-800 dark:border-slate-200 text-slate-800 dark:text-slate-100' 
                                      : 'bg-bg border-border text-muted hover:border-slate-800 dark:border-slate-200/50'
                                  }`}
                                  style={tag.color ? { 
                                    borderColor: isSelected ? `${tag.color}CC` : `${tag.color}40`, 
                                    color: isSelected ? tag.color : undefined,
                                    backgroundColor: isSelected ? `${tag.color}20` : undefined
                                  } : {}}
                                >
                                  <TagIcon className="w-2.5 h-2.5" />
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditSkills([...editSkills, { name: '新特质', description: '' }])}
                    className="w-full py-2 border border-dashed border-border text-muted hover:text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200 transition-all font-medium text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 添加新特质_ADD_TRAIT
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {character.skills.map((skill, index) => (
                    <div key={index} className="group bg-bg/20 border border-border p-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 relative flex gap-4">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      {skill.icon && (
                        <div className="w-12 h-12 flex-shrink-0 bg-transparent border border-border p-1 group-hover:scale-110 transition-transform">
                          <img src={skill.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                          <span className="text-primary opacity-50 text-sm">0{index + 1}</span> {skill.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-1 mb-2">
                          {skill.cooldown && (
                            <span className="text-[10px] font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> CD: {skill.cooldown}
                            </span>
                          )}
                          {skill.cost && (
                            <span className="text-[10px] font-medium text-gold flex items-center gap-1">
                              <Zap className="w-3 h-3" /> COST: {skill.cost}
                            </span>
                          )}
                        </div>
                        <p className="text-muted text-sm mt-2 leading-relaxed font-medium">
                          {skill.description}
                        </p>
                        {skill.tags && skill.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {skill.tags.map((tagName, tIdx) => {
                              const tag = availableTags.find(t => t.name === tagName);
                              return (
                                <span 
                                  key={tIdx}
                                  className="px-2 py-0.5 text-[10px] font-medium border border-slate-800 dark:border-slate-200/30 text-slate-800 dark:text-slate-100 bg-slate-800/5 dark:bg-slate-200/5 flex items-center gap-1"
                                  style={tag?.color ? { borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}10` } : {}}
                                >
                                  <TagIcon className="w-2.5 h-2.5" />
                                  {tagName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'mechanics' && (
            <section className="bg-card/40 border border-border p-8 rounded-none rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Cpu className="w-6 h-6" /> {character.role === 'Hunter' ? '存在感阶级解析' : '专属机制解析'}
                </h2>
                {canEdit && (
                  <div className="flex gap-2">
                    {editingSection === 'mechanics' ? (
                      <>
                        {character.role === 'Hunter' && (
                          <button 
                            onClick={() => setPresenceImportMode(!presenceImportMode)}
                            className={`px-3 py-1 border transition-all font-medium text-[10px] flex items-center gap-1 ${
                              presenceImportMode ? 'bg-slate-800 dark:bg-slate-200 text-bg border-slate-800 dark:border-slate-200' : 'bg-bg border-border text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200'
                            }`}
                          >
                            <Zap className="w-3 h-3" /> 智能识别_SMART
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingSection(null);
                            setPresenceImportMode(false);
                          }}
                          className="px-3 py-1 bg-bg border border-border text-muted hover:text-text transition-all font-medium text-[10px] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> 取消_CANCEL
                        </button>
                        <button 
                          onClick={handleSaveSection}
                          disabled={saving}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary/80 transition-all font-medium text-[10px] flex items-center gap-1 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" /> {saving ? '保存中...' : '保存_SAVE'}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => startEditing('mechanics')}
                        className="px-3 py-1 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-[10px] flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> 单独编辑_EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingSection === 'mechanics' ? (
                <div className="space-y-8">
                  {presenceImportMode && character.role === 'Hunter' && (
                    <div className="p-4 bg-slate-800/5 dark:bg-slate-200/5 border border-slate-800 dark:border-slate-200/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-medium text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-3 h-3" /> 存在感识别导入_PRESENCE_IMPORT
                        </label>
                        <span className="text-[9px] text-muted font-medium">格式: 0阶: [图标URL] 技能名: 描述 | 冷却: 10s #标签</span>
                      </div>
                      <textarea 
                        rows={4}
                        value={presenceImportText}
                        onChange={(e) => setPresenceImportText(e.target.value)}
                        placeholder="在此粘贴存在感描述文本，例如：&#10;0阶：[https://example.com/icon.png] 传火：描述内容 | 冷却：未知"
                        className="w-full bg-bg/50 border border-border p-3 text-xs text-text font-medium outline-none focus:border-slate-800 dark:border-slate-200 transition-colors"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setPresenceImportText('');
                            setPresenceImportMode(false);
                          }}
                          className="px-3 py-1 text-[10px] font-medium text-muted hover:text-text"
                        >
                          取消_CANCEL
                        </button>
                        <button 
                          onClick={handlePresenceSmartImport}
                          className="px-4 py-1 bg-slate-800 dark:bg-slate-200 text-bg text-[10px] font-medium font-bold hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all"
                        >
                          确认识别_CONFIRM
                        </button>
                      </div>
                    </div>
                  )}
                  {character.role === 'Hunter' ? (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <button 
                          onClick={() => {
                            setEditPresence([...editPresence, { tier: 0, name: '', description: '', tags: [] }]);
                          }}
                          className="px-3 py-1 bg-slate-800/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-100 border border-slate-800 dark:border-slate-200/30 hover:bg-slate-800/20 dark:hover:bg-slate-200/20 transition-all font-medium text-[10px] flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> 添加存在感项目_ADD_ITEM
                        </button>
                      </div>
                      {editPresence.map((p, idx) => (
                        <div key={idx} className="p-4 bg-bg/20 border border-border space-y-4 relative group">
                          <button 
                            onClick={() => {
                              setEditPresence(editPresence.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-2 right-2 p-1 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            title="删除项目"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex-shrink-0 flex items-center justify-center text-primary font-bold font-medium relative group/icon">
                              {p.icon ? (
                                <img src={p.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] opacity-50">TIER</span>
                                  <select 
                                    value={p.tier}
                                    onChange={(e) => {
                                      const newP = [...editPresence];
                                      newP[idx].tier = parseInt(e.target.value);
                                      setEditPresence(newP);
                                    }}
                                    className="bg-transparent text-primary outline-none text-center appearance-none cursor-pointer"
                                  >
                                    <option value={0} className="bg-bg">0</option>
                                    <option value={1} className="bg-bg">1</option>
                                    <option value={2} className="bg-bg">2</option>
                                  </select>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center p-1">
                                <input 
                                  type="text"
                                  value={p.icon || ''}
                                  onChange={(e) => {
                                    const newP = [...editPresence];
                                    newP[idx].icon = e.target.value;
                                    setEditPresence(newP);
                                  }}
                                  placeholder="图标URL"
                                  className="w-full bg-transparent text-[8px] text-slate-800 dark:text-slate-100 outline-none text-center"
                                />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted font-medium uppercase">阶段:</span>
                                <select 
                                  value={p.tier}
                                  onChange={(e) => {
                                    const newP = [...editPresence];
                                    newP[idx].tier = parseInt(e.target.value);
                                    setEditPresence(newP);
                                  }}
                                  className="bg-bg border border-border text-primary px-2 py-0.5 text-[10px] font-medium outline-none focus:border-primary"
                                >
                                  <option value={0}>0阶</option>
                                  <option value={1}>1阶</option>
                                  <option value={2}>2阶</option>
                                </select>
                                <input 
                                  type="text"
                                  value={p.name}
                                  onChange={(e) => {
                                    const newP = [...editPresence];
                                    newP[idx].name = e.target.value;
                                    setEditPresence(newP);
                                  }}
                                  placeholder="阶级名称"
                                  className="flex-1 bg-transparent border-b border-border text-text font-bold outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted font-medium uppercase">冷却:</span>
                              <input 
                                type="text"
                                value={p.cooldown || ''}
                                onChange={(e) => {
                                  const newP = [...editPresence];
                                  newP[idx].cooldown = e.target.value;
                                  setEditPresence(newP);
                                }}
                                placeholder="如: 15s"
                                className="w-20 bg-transparent border-b border-border text-slate-800 dark:text-slate-100 outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium text-xs"
                              />
                            </div>
                          </div>
                          <textarea 
                            rows={3}
                            value={p.description}
                            onChange={(e) => {
                              const newP = [...editPresence];
                              newP[idx].description = e.target.value;
                              setEditPresence(newP);
                            }}
                            placeholder="阶级能力描述..."
                            className="w-full bg-transparent text-xs text-muted outline-none resize-none font-medium"
                          />
                          
                          {/* Tag Selection */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                            {availableTags.map(tag => {
                              const isSelected = p.tags?.includes(tag.name);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => {
                                    const newP = [...editPresence];
                                    const currentTags = newP[idx].tags || [];
                                    if (isSelected) {
                                      newP[idx].tags = currentTags.filter(t => t !== tag.name);
                                    } else {
                                      newP[idx].tags = [...currentTags, tag.name];
                                    }
                                    setEditPresence(newP);
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-medium border transition-all flex items-center gap-1 ${
                                    isSelected 
                                      ? 'bg-slate-800 dark:bg-slate-200/20 border-slate-800 dark:border-slate-200 text-slate-800 dark:text-slate-100' 
                                      : 'bg-bg border-border text-muted hover:border-slate-800 dark:border-slate-200/50'
                                  }`}
                                  style={tag.color ? { 
                                    borderColor: isSelected ? `${tag.color}CC` : `${tag.color}40`, 
                                    color: isSelected ? tag.color : undefined,
                                    backgroundColor: isSelected ? `${tag.color}20` : undefined
                                  } : {}}
                                >
                                  <TagIcon className="w-2.5 h-2.5" />
                                  {tag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-text font-medium uppercase tracking-widest border-l-2 border-primary pl-3">
                        核心机制_CORE_MECHANICS
                      </h3>
                      {editMechanics.map((mech, idx) => (
                        <div key={idx} className="p-4 bg-bg/20 border border-border relative group">
                          <button 
                            onClick={() => setEditMechanics(editMechanics.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-transparent border border-border flex items-center justify-center text-muted relative group/icon overflow-hidden">
                              {mech.icon ? (
                                <img src={mech.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Activity className="w-6 h-6" />
                              )}
                              <input 
                                type="text"
                                value={mech.icon || ''}
                                onChange={(e) => {
                                  const newMechs = [...editMechanics];
                                  newMechs[idx].icon = e.target.value;
                                  setEditMechanics(newMechs);
                                }}
                                placeholder="图标URL"
                                className="absolute inset-0 opacity-0 group-hover/icon:opacity-100 bg-bg/90 text-[8px] font-medium p-1 outline-none transition-opacity"
                              />
                            </div>
                            <div className="flex-1">
                              <input 
                                type="text"
                                value={mech.title}
                                onChange={(e) => {
                                  const newMechs = [...editMechanics];
                                  newMechs[idx].title = e.target.value;
                                  setEditMechanics(newMechs);
                                }}
                                placeholder="机制标题"
                                className="w-full bg-transparent border-b border-border text-text font-bold mb-2 outline-none focus:border-slate-800 dark:border-slate-200 py-1 font-medium"
                              />
                              <textarea 
                                rows={4}
                                value={mech.content}
                                onChange={(e) => {
                                  const newMechs = [...editMechanics];
                                  newMechs[idx].content = e.target.value;
                                  setEditMechanics(newMechs);
                                }}
                                placeholder="机制详细解析..."
                                className="w-full bg-transparent text-xs text-muted outline-none resize-none font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setEditMechanics([...editMechanics, { title: '新机制', content: '' }])}
                          className="py-2 border border-dashed border-border text-muted hover:text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200 transition-all font-medium text-xs flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> 添加新机制_ADD_MECHANIC
                        </button>
                        {character.skills.length > 0 && (
                          <div className="relative group/import">
                            <button 
                              className="w-full py-2 border border-dashed border-primary/50 text-primary/70 hover:text-primary hover:border-primary transition-all font-medium text-xs flex items-center justify-center gap-2"
                            >
                              <Target className="w-4 h-4" /> 从外在特质导入_IMPORT
                            </button>
                            <div className="absolute bottom-full left-0 w-full bg-card border border-border shadow-2xl opacity-0 invisible group-hover/import:opacity-100 group-hover/import:visible transition-all z-50 mb-2 max-h-48 overflow-y-auto">
                              {character.skills.map((skill, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => setEditMechanics([...editMechanics, { title: skill.name, content: skill.description, icon: skill.icon }])}
                                  className="w-full p-2 text-left text-[10px] font-medium hover:bg-primary/10 border-b border-border/50 last:border-0 flex items-center gap-2"
                                >
                                  {skill.icon && <img src={skill.icon} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />}
                                  <span className="truncate">{skill.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 pt-6 border-t border-border/50">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-medium uppercase tracking-widest border-l-2 border-slate-800 dark:border-slate-200 pl-3">
                      关联机制_LINKED_MECHANICS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editLinkedMechanics.map((link, idx) => {
                        const linkedChar = allCharacters?.find(c => c.id === link.characterId);
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-bg/20 border border-border group">
                            <div className="flex-1">
                              <select 
                                value={link.characterId}
                                onChange={(e) => {
                                  const newLinks = [...editLinkedMechanics];
                                  newLinks[idx].characterId = e.target.value;
                                  newLinks[idx].mechanicIndex = 0;
                                  setEditLinkedMechanics(newLinks);
                                }}
                                className="w-full bg-bg border border-border text-xs text-text p-1 outline-none focus:border-slate-800 dark:border-slate-200 mb-2"
                              >
                                <option value="">选择角色...</option>
                                {allCharacters?.filter(c => !c.id.startsWith('base_')).map(c => (
                                  <option key={c.id} value={c.id}>{c.title} ({c.name})</option>
                                ))}
                              </select>
                              {linkedChar && linkedChar.mechanics && linkedChar.mechanics.length > 0 && (
                                <select 
                                  value={link.mechanicIndex}
                                  onChange={(e) => {
                                    const newLinks = [...editLinkedMechanics];
                                    newLinks[idx].mechanicIndex = parseInt(e.target.value);
                                    setEditLinkedMechanics(newLinks);
                                  }}
                                  className="w-full bg-bg border border-border text-xs text-slate-800 dark:text-slate-100 p-1 outline-none focus:border-slate-800 dark:border-slate-200"
                                >
                                  {linkedChar.mechanics.map((m, i) => (
                                    <option key={i} value={i}>{m.title}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <button 
                              onClick={() => setEditLinkedMechanics(editLinkedMechanics.filter((_, i) => i !== idx))}
                              className="text-muted hover:text-primary"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => setEditLinkedMechanics([...editLinkedMechanics, { characterId: '', mechanicIndex: 0 }])}
                      className="w-full py-2 border border-dashed border-border text-muted hover:text-slate-800 dark:text-slate-100 hover:border-slate-800 dark:border-slate-200 transition-all font-medium text-xs flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> 添加关联机制_ADD_LINK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {character.role === 'Hunter' ? (
                    <div className="space-y-6">
                      {character.presence && character.presence.length > 0 ? (
                        character.presence.map((p, index) => (
                          <div key={index} className="flex gap-6 p-6 bg-bg/20 border border-border group hover:border-primary/50 transition-all duration-300">
                            <div className="w-20 h-20 flex-shrink-0 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold font-medium text-2xl group-hover:scale-110 transition-transform overflow-hidden">
                              {p.icon ? (
                                <img src={p.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{p.tier}阶</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-lg font-bold text-primary font-medium flex items-center gap-2">
                                  <span className="w-2 h-2 bg-primary rotate-45" /> {p.name}
                                </h4>
                                {p.cooldown && (
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-100 bg-slate-800/10 dark:bg-slate-200/10 px-2 py-1 border border-slate-800 dark:border-slate-200/20">
                                    CD: {p.cooldown}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted font-medium leading-relaxed whitespace-pre-wrap">
                                {p.description}
                              </p>
                              {p.tags && p.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {p.tags.map((tagName, tIdx) => {
                                    const tag = availableTags.find(t => t.name === tagName);
                                    return (
                                      <span 
                                        key={tIdx}
                                        className="px-2 py-0.5 text-[10px] font-medium border border-slate-800 dark:border-slate-200/30 text-slate-800 dark:text-slate-100 bg-slate-800/5 dark:bg-slate-200/5 flex items-center gap-1"
                                        style={tag?.color ? { borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}10` } : {}}
                                      >
                                        <TagIcon className="w-2.5 h-2.5" />
                                        {tagName}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 bg-bg/20 border border-border text-center text-muted font-medium text-xs flex flex-col items-center gap-4">
                          <Cpu className="w-12 h-12 opacity-10" />
                          <p className="uppercase tracking-widest">该角色尚未录入存在感数据_NO_PRESENCE_DATA</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {character.mechanics && character.mechanics.length > 0 ? (
                        character.mechanics.map((mech, index) => (
                          <div key={index} className="flex gap-6 p-6 bg-bg/20 border border-border group hover:border-primary/50 transition-all duration-300">
                            <div className="w-20 h-20 flex-shrink-0 bg-transparent border border-border p-2 group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                              {mech.icon ? (
                                <img src={mech.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Cpu className="w-8 h-8 text-primary/40" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-primary font-medium mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rotate-45" /> {mech.title}
                              </h4>
                              <p className="text-sm text-muted font-medium leading-relaxed whitespace-pre-wrap">
                                {mech.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 bg-bg/20 border border-border text-center text-muted font-medium text-xs flex flex-col items-center gap-4">
                          <Cpu className="w-12 h-12 opacity-10" />
                          <p className="uppercase tracking-widest">该角色尚未录入详细机制_NO_MECHANICS_DATA</p>
                        </div>
                      )}
                    </div>
                  )}

                  {character.linkedMechanics && character.linkedMechanics.length > 0 && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-medium uppercase tracking-widest border-l-2 border-slate-800 dark:border-slate-200 pl-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> 关联机制矩阵_LINKED_MATRIX
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {character.linkedMechanics.map((link, idx) => {
                          const linkedChar = allCharacters?.find(c => c.id === link.characterId);
                          const linkedMech = linkedChar?.mechanics?.[link.mechanicIndex];
                          if (!linkedChar || !linkedMech) return null;

                          return (
                            <div key={idx} className="bg-bg/20 border border-border p-4 hover:bg-slate-800/5 dark:bg-slate-200/5 hover:border-slate-800 dark:border-slate-200/50 transition-all group">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-transparent border border-border p-1 group-hover:rotate-12 transition-transform overflow-hidden">
                                  {linkedMech.icon ? (
                                    <img src={linkedMech.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    <img src={linkedChar.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 ${linkedChar.role === 'Survivor' ? 'bg-slate-800 dark:bg-slate-200/20 text-slate-800 dark:text-slate-100' : 'bg-primary/20 text-primary'}`}>
                                      {linkedChar.role === 'Survivor' ? '求生者' : '监管者'}
                                    </span>
                                    <span className="text-[10px] text-muted font-medium">{linkedChar.title}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-text truncate mb-1">{linkedMech.title}</h4>
                                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                                    {linkedMech.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

const BaseStatItem = ({ label, value, isDifferent, baseValue }: { label: string; value: string; isDifferent?: boolean; baseValue?: string }) => (
  <div className={`flex flex-col py-2 border-b border-border/30 last:border-0 hover:bg-white/5 px-2 transition-colors ${isDifferent ? 'bg-primary/5' : ''}`}>
    <div className="flex justify-between items-center mb-1">
      <span className="text-muted text-xs">{label}</span>
      <div className="flex flex-col items-end">
        <span className={`font-bold text-xs ${isDifferent ? 'text-primary' : 'text-text'}`}>{value}</span>
        {isDifferent && baseValue && (
          <span className="text-[9px] text-muted font-medium line-through opacity-50">标准: {baseValue}</span>
        )}
      </div>
    </div>
  </div>
);
