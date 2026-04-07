import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Plus, Trash2, Image as ImageIcon, FileText, Upload, AlertCircle, ChevronDown, ChevronUp, Tag as TagIcon } from 'lucide-react';
import { Character, CharacterTraitCategory, SURVIVOR_TRAITS_TEMPLATE, HUNTER_TRAITS_TEMPLATE, Tag } from '../constants';

interface Props {
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete?: (char: Character) => void;
  initialData?: Character | null;
  allCharacters?: Character[];
  nextSurvivorOrder?: number;
  nextHunterOrder?: number;
}

export const CharacterForm = ({ onSave, onCancel, onDelete, initialData, allCharacters, nextSurvivorOrder, nextHunterOrder }: Props) => {
  const [importMode, setImportMode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    role: 'Survivor' as 'Survivor' | 'Hunter',
    order: 0,
    type: '',
    imageUrl: '',
    description: '',
    skills: [] as { name: string; description: string; tags?: string[] }[],
    presence: [] as { tier: number; name: string; description: string; cooldown?: string; tags?: string[] }[],
    traits: [] as CharacterTraitCategory[],
    mechanics: [] as { title: string; content: string; icon?: string }[],
    linkedMechanics: [] as { characterId: string; mechanicIndex: number }[],
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tags'), (snapshot) => {
      const tags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
      setAvailableTags(tags);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        title: initialData.title || '',
        role: initialData.role || 'Survivor',
        order: initialData.order || 0,
        type: initialData.type || '',
        imageUrl: initialData.imageUrl || '',
        description: initialData.description || '',
        skills: initialData.skills || [],
        presence: initialData.presence || [],
        traits: initialData.traits || [],
        mechanics: initialData.mechanics || [],
        linkedMechanics: initialData.linkedMechanics || [],
      });
    } else {
      // Initialize with fixed categories if it's a new character
      setFormData(prev => ({
        ...prev,
        order: prev.role === 'Survivor' ? (nextSurvivorOrder || 0) : (nextHunterOrder || 0),
        presence: prev.role === 'Hunter' ? [
          { tier: 0, name: '0阶', description: '', cooldown: '', tags: [] },
          { tier: 1, name: '1阶', description: '', cooldown: '', tags: [] },
          { tier: 2, name: '2阶', description: '', cooldown: '', tags: [] }
        ] : [],
        traits: prev.role === 'Survivor' 
          ? JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) 
          : JSON.parse(JSON.stringify(HUNTER_TRAITS_TEMPLATE))
      }));
    }
  }, [initialData, nextSurvivorOrder, nextHunterOrder]);

  // Handle role change to update fixed categories and order
  useEffect(() => {
    if (!initialData) {
      setFormData(prev => {
        const newOrder = prev.role === 'Survivor' ? (nextSurvivorOrder || 0) : (nextHunterOrder || 0);
        const newTraits = prev.role === 'Survivor'
          ? JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) 
          : JSON.parse(JSON.stringify(HUNTER_TRAITS_TEMPLATE));
        const newPresence = prev.role === 'Hunter' ? [
          { tier: 0, name: '0阶', description: '', cooldown: '', tags: [] },
          { tier: 1, name: '1阶', description: '', cooldown: '', tags: [] },
          { tier: 2, name: '2阶', description: '', cooldown: '', tags: [] }
        ] : [];
        
        return {
          ...prev,
          order: newOrder,
          traits: newTraits,
          presence: newPresence
        };
      });
    }
  }, [formData.role, initialData, nextSurvivorOrder, nextHunterOrder]);

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', description: '', tags: [] }]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const addTraitCategory = () => {
    setFormData(prev => ({
      ...prev,
      traits: [...prev.traits, { category: '', items: [{ label: '', value: '' }] }]
    }));
  };

  const removeTraitCategory = (catIndex: number) => {
    const cat = formData.traits[catIndex];
    if (formData.role === 'Survivor') {
      const fixedCategories = SURVIVOR_TRAITS_TEMPLATE.map(t => t.category);
      if (fixedCategories.includes(cat.category)) {
        alert('求生者的基础数值分类为固定项，不可删除。');
        return;
      }
    } else {
      const fixedCategories = HUNTER_TRAITS_TEMPLATE.map(t => t.category);
      if (fixedCategories.includes(cat.category)) {
        alert('监管者的基础数值分类为固定项，不可删除。');
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== catIndex)
    }));
  };

  const updateTraitCategoryName = (catIndex: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((cat, i) => i === catIndex ? { ...cat, category: name } : cat)
    }));
  };

  const addTraitItem = (catIndex: number) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((cat, i) => i === catIndex ? { ...cat, items: [...cat.items, { label: '', value: '' }] } : cat)
    }));
  };

  const removeTraitItem = (catIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((cat, i) => i === catIndex ? { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) } : cat)
    }));
  };

  const updateTraitItem = (catIndex: number, itemIndex: number, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((cat, i) => i === catIndex ? { 
        ...cat, 
        items: cat.items.map((item, j) => j === itemIndex ? { ...item, [field]: value } : item) 
      } : cat)
    }));
  };

  const addMechanic = () => {
    setFormData(prev => ({
      ...prev,
      mechanics: [...prev.mechanics, { title: '', content: '', icon: '' }]
    }));
  };

  const removeMechanic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mechanics: prev.mechanics.filter((_, i) => i !== index)
    }));
  };

  const updateMechanic = (index: number, field: 'title' | 'content' | 'icon', value: string) => {
    setFormData(prev => ({
      ...prev,
      mechanics: prev.mechanics.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const updatePresence = (index: number, field: 'name' | 'description' | 'cooldown', value: string) => {
    setFormData(prev => ({
      ...prev,
      presence: prev.presence.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const updatePresenceTags = (index: number, tagName: string) => {
    setFormData(prev => {
      const newPresence = [...prev.presence];
      const currentTags = newPresence[index].tags || [];
      if (currentTags.includes(tagName)) {
        newPresence[index].tags = currentTags.filter(t => t !== tagName);
      } else {
        newPresence[index].tags = [...currentTags, tagName];
      }
      return { ...prev, presence: newPresence };
    });
  };

  const addLinkedMechanic = () => {
    setFormData(prev => ({
      ...prev,
      linkedMechanics: [...prev.linkedMechanics, { characterId: '', mechanicIndex: 0 }]
    }));
  };

  const removeLinkedMechanic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      linkedMechanics: prev.linkedMechanics.filter((_, i) => i !== index)
    }));
  };

  const updateLinkedMechanic = (index: number, field: 'characterId' | 'mechanicIndex', value: any) => {
    setFormData(prev => ({
      ...prev,
      linkedMechanics: prev.linkedMechanics.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const parseSmartText = (text: string) => {
    const data: any = {
      skills: [],
      traits: [],
      mechanics: []
    };

    // Basic fields
    const nameMatch = text.match(/(?:姓名|角色|名字)[:：]\s*(.*)/i);
    if (nameMatch) data.name = nameMatch[1].trim();

    const titleMatch = text.match(/(?:称号|职业|称号)[:：]\s*(.*)/i);
    if (titleMatch) data.title = titleMatch[1].trim();

    const roleMatch = text.match(/(?:阵营|角色类型)[:：]\s*(求生者|监管者|Survivor|Hunter)/i);
    if (roleMatch) {
      const roleStr = roleMatch[1].trim();
      data.role = (roleStr === '监管者' || roleStr.toLowerCase() === 'hunter') ? 'Hunter' : 'Survivor';
    }

    const orderMatch = text.match(/(?:角色ID|排序|ID)[:：]\s*(\d+)/i);
    if (orderMatch) data.order = parseInt(orderMatch[1]);

    const typeMatch = text.match(/(?:定位|类型|定位类型)[:：]\s*(.*)/i);
    if (typeMatch) data.type = typeMatch[1].trim();

    const descMatch = text.match(/(?:描述|背景|简介)[:：]\s*([\s\S]*?)(?=\n\n|\n[^\n]*[:：]|$)/i);
    if (descMatch) data.description = descMatch[1].trim();

    // Image URL
    const imageMatch = text.match(/(?:头像|图片|立绘|IMAGE)[:：]\s*(.*)/i);
    if (imageMatch) data.imageUrl = imageMatch[1].trim();

    // Skills (External Traits)
    const skillsSection = text.match(/(?:外在特质|技能)[:：]\s*([\s\S]*?)(?=\n\n\n|\n[^\n]*[:：]|$)/i);
    if (skillsSection) {
      const skillsText = skillsSection[1];
      const skillBlocks = skillsText.split(/\n(?=[^\s])/);
      skillBlocks.forEach(block => {
        // Format: [iconUrl] Name: Description #tag1 #tag2
        let icon = '';
        const iconMatch = block.match(/^\[(.*?)\]/);
        if (iconMatch) {
          icon = iconMatch[1].trim();
          block = block.replace(/^\[.*?\]/, '').trim();
        }

        const tags: string[] = [];
        const tagMatches = block.match(/#(\S+)/g);
        if (tagMatches) {
          tagMatches.forEach(t => tags.push(t.substring(1)));
          block = block.replace(/#\S+/g, '').trim();
        }

        const [name, ...descParts] = block.split(/[:：]/);
        if (name && descParts.length > 0) {
          data.skills.push({ 
            name: name.trim(), 
            description: descParts.join(':').trim(),
            icon,
            tags
          });
        }
      });
    }

    // Presence (Hunter only)
    const presenceSection = text.match(/(?:存在感|技能阶级)[:：]\s*([\s\S]*?)(?=\n\n\n|\n[^\n]*[:：]|$)/i);
    if (presenceSection) {
      const presenceText = presenceSection[1];
      const lines = presenceText.trim().split('\n');
      data.presence = [];
      lines.forEach(line => {
        // Format: 0阶: 技能名: 描述 | 冷却: 10s #标签
        const tierMatch = line.match(/^(\d)阶/);
        if (tierMatch) {
          const tier = parseInt(tierMatch[1]);
          let content = line.replace(/^\d阶[:：]/, '').trim();
          
          const tags: string[] = [];
          const tagMatches = content.match(/#(\S+)/g);
          if (tagMatches) {
            tagMatches.forEach(t => tags.push(t.substring(1)));
            content = content.replace(/#\S+/g, '').trim();
          }

          let cooldown = '';
          const cdMatch = content.match(/\|?\s*(?:冷却|CD)[:：]\s*([^#|]+)/i);
          if (cdMatch) {
            cooldown = cdMatch[1].trim();
            content = content.replace(/\|?\s*(?:冷却|CD)[:：]\s*[^#|]+/i, '').trim();
          }

          const [name, ...descParts] = content.split(/[:：]/);
          if (name && descParts.length > 0) {
            data.presence.push({
              tier,
              name: name.trim(),
              description: descParts.join(':').trim(),
              cooldown,
              tags
            });
          }
        }
      });
    }

    // Traits (Numerical) - Automatic Categorization with Fixed Template
    const traitsSection = text.match(/(?:特质详情|数值|属性)[:：]\s*([\s\S]*?)(?=\n\n\n|\n[^\n]*[:：]|$)/i);
    if (traitsSection) {
      const traitsText = traitsSection[1];
      const lines = traitsText.trim().split('\n');
      
      const template = JSON.parse(JSON.stringify(data.role === 'Hunter' ? HUNTER_TRAITS_TEMPLATE : SURVIVOR_TRAITS_TEMPLATE));
      
      lines.forEach(line => {
        const parts = line.split(/[:：\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          const label = parts[0];
          const value = parts.slice(1).join(' ');
          
          // Try to find a match in the template
          let matched = false;
          for (const cat of template) {
            for (const item of cat.items) {
              if (label.includes(item.label) || item.label.includes(label)) {
                item.value = value;
                matched = true;
                break;
              }
            }
            if (matched) break;
          }
          
          // If no match, add to "其他"
          if (!matched) {
            const otherCat = template.find((c: any) => c.category === '其他');
            if (otherCat) {
              otherCat.items.push({ label, value });
            }
          }
        }
      });

      data.traits = template.filter((cat: any) => cat.items.some((item: any) => item.value !== '') || cat.category !== '其他');
    }

    return data;
  };

  const handleBulkImport = async () => {
    try {
      const trimmedText = importText.trim();
      let charactersToSave: any[] = [];

      if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
        // JSON Import
        const parsed = JSON.parse(trimmedText);
        charactersToSave = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Smart Text Import (Split by '---' for multiple characters)
        const blocks = trimmedText.split(/\n---\n|\n===\n/).filter(b => b.trim());
        charactersToSave = blocks.map(block => parseSmartText(block.trim()));
      }

      if (charactersToSave.length === 0) throw new Error('未检测到有效的角色数据');
      
      // Validate at least one character has a name
      if (!charactersToSave.some(c => c.name || c.title)) {
        throw new Error('无法识别角色姓名或称号，请检查格式');
      }

      // If it's a single character, we can just update the form
      if (charactersToSave.length === 1) {
        const parsed = charactersToSave[0];
        setFormData({
          ...formData,
          ...parsed,
          skills: parsed.skills?.length ? parsed.skills : formData.skills,
          traits: parsed.traits?.length ? parsed.traits : formData.traits,
          mechanics: parsed.mechanics?.length ? parsed.mechanics : formData.mechanics,
        });
        setImportMode(false);
      } else {
        // If multiple, save them all immediately via onSave
        setSaving(true);
        await onSave(charactersToSave);
        setSaving(false);
        setImportMode(false);
      }
      
      setImportError('');
    } catch (e: any) {
      setImportError(`导入失败: ${e.message}`);
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('请输入角色姓名');
    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-card/50 cyber-border p-8 shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h2 className="text-3xl font-serif text-accent">
          {initialData ? '修改档案_UPDATE' : '录入新档案_CREATE'}
        </h2>
        <button 
          onClick={() => setImportMode(!importMode)}
          className="flex items-center gap-2 text-[10px] font-mono text-accent hover:text-primary transition-colors uppercase tracking-widest"
        >
          {importMode ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {importMode ? '手动填写_MANUAL' : '文档一键导入_IMPORT'}
        </button>
      </div>

      {importMode ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-bg/50 p-4 border border-border">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-muted font-mono">请粘贴 JSON 格式或自然语言描述的角色数据：</p>
              <div className="text-[11px] font-mono text-accent/50 text-right">
                支持识别：姓名、称号、阵营、定位、描述、外在特质、数值等关键词<br/>
                <span className="text-primary">支持一键导入多个角色，请使用 "---" 作为角色之间的分隔符</span>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-card/30 border border-border/50 text-[11px] font-mono text-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-accent">JSON 格式示例：</p>
                  <pre className="bg-bg/50 p-2 overflow-x-auto text-[9px]">
{`{
  "name": "艾玛",
  "role": "Survivor",
  "imageUrl": "http://...",
  "skills": [
    {
      "name": "巧手成蹄",
      "description": "...",
      "icon": "http://...",
      "tags": ["辅助", "修机"]
    }
  ]
}`}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-accent">智能文本示例：</p>
                  <pre className="bg-bg/50 p-2 overflow-x-auto text-[9px]">
{`姓名：艾玛·伍兹
立绘：http://...
阵营：求生者
外在特质：
[http://...] 巧手成蹄：描述内容 #辅助 #修机
存在感：
0阶：技能名：描述 | 冷却：10s #标签`}
                  </pre>
                </div>
              </div>
            </div>

            <textarea 
              rows={15}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              disabled={saving}
              className="w-full bg-bg border border-border text-accent p-4 rounded-none focus:border-accent outline-none font-mono text-xs resize-none disabled:opacity-50"
              placeholder={`示例格式：\n姓名：艾玛·伍兹\n称号：园丁\n...\n---\n姓名：里奥·贝克\n称号：厂长\n...`}
            />
            {importError && (
              <div className="mt-4 flex items-center gap-2 text-primary text-xs font-mono">
                <AlertCircle className="w-4 h-4" /> {importError}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={() => setImportMode(false)}
              disabled={saving}
              className="px-6 py-2 text-muted font-mono text-xs disabled:opacity-50"
            >
              取消_CANCEL
            </button>
            <button 
              onClick={handleBulkImport}
              disabled={saving || !importText.trim()}
              className="px-8 py-2 bg-accent text-bg font-bold font-mono text-xs hover:bg-accent/80 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  正在同步至云端...
                </>
              ) : (
                '执行导入_EXECUTE'
              )}
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-widest font-mono">角色姓名</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
                    placeholder="艾玛·伍兹"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-widest font-mono">职业称号</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
                    placeholder="园丁"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-widest font-mono">角色 ID</label>
                  <input 
                    type="number" 
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-widest font-mono">定位类型</label>
                  <input 
                    type="text" 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
                    placeholder="牵制/辅助"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted uppercase tracking-widest font-mono">阵营</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'Survivor' | 'Hunter'})}
                    className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
                  >
                    <option value="Survivor">求生者</option>
                    <option value="Hunter">监管者</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted uppercase tracking-widest font-mono">头像 URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="flex-1 bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono text-xs"
                    placeholder="https://..."
                  />
                  <div className="w-12 h-12 bg-transparent border border-border flex items-center justify-center text-muted">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs text-muted uppercase tracking-widest font-mono">角色描述 (SUMMARY)</label>
              <textarea 
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors resize-none font-mono text-sm"
                placeholder="输入角色的核心玩法或背景摘要..."
              />
            </div>
          </div>

          {/* Trait Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-accent font-mono text-sm border-l-2 border-primary pl-3 uppercase tracking-widest">特质详情 (TRAITS)</h3>
              <button 
                type="button"
                onClick={addTraitCategory}
                className="flex items-center gap-1 text-xs font-mono text-accent hover:text-primary"
              >
                <Plus className="w-3 h-3" /> 添加分类
              </button>
            </div>
            <div className="space-y-6">
              {formData.traits.map((cat, catIndex) => (
                <div key={catIndex} className="p-4 bg-bg/50 border border-border relative group">
                  <button 
                    type="button"
                    onClick={() => removeTraitCategory(catIndex)}
                    className="absolute top-2 right-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <input 
                      type="text"
                      value={cat.category}
                      onChange={(e) => updateTraitCategoryName(catIndex, e.target.value)}
                      placeholder="分类名称（如：移动 MOVEMENT）"
                      className="flex-1 bg-transparent border-b border-border text-accent font-bold outline-none focus:border-accent py-1 font-mono text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => addTraitItem(catIndex)}
                      className="flex items-center gap-1 text-xs font-mono text-accent hover:text-primary"
                    >
                      <Plus className="w-3 h-3" /> 添加属性
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2 bg-card/30 p-2 border border-border/50">
                        <input 
                          type="text"
                          value={item.label}
                          onChange={(e) => updateTraitItem(catIndex, itemIndex, 'label', e.target.value)}
                          placeholder="标签"
                          className="w-24 bg-transparent text-xs text-muted outline-none border-r border-border/30 pr-2"
                        />
                        <input 
                          type="text"
                          value={item.value}
                          onChange={(e) => updateTraitItem(catIndex, itemIndex, 'value', e.target.value)}
                          placeholder="数值"
                          className="flex-1 bg-transparent text-xs text-accent outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => removeTraitItem(catIndex, itemIndex)}
                          className="text-muted hover:text-primary"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Traits (Skills) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-accent font-mono text-sm border-l-2 border-primary pl-3 uppercase tracking-widest">外在特质 (EXTERNAL TRAITS)</h3>
              <button 
                type="button"
                onClick={addSkill}
                className="flex items-center gap-1 text-xs font-mono text-accent hover:text-primary"
              >
                <Plus className="w-3 h-3" /> 添加特质
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.skills.map((skill, index) => (
                <div key={index} className="p-4 bg-bg/50 border border-border relative group">
                  <button 
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="absolute top-2 right-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input 
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    placeholder="特质名称"
                    className="w-full bg-transparent border-b border-border text-text font-bold mb-2 outline-none focus:border-accent py-1"
                  />
                  <textarea 
                    rows={2}
                    value={skill.description}
                    onChange={(e) => updateSkill(index, 'description', e.target.value)}
                    placeholder="特质描述..."
                    className="w-full bg-transparent text-xs text-muted outline-none resize-none mb-3"
                  />
                  
                  {/* Tag Selection */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                    {availableTags.filter(t => t.affectedRole === 'Both' || t.affectedRole === formData.role).map(tag => {
                      const isSelected = skill.tags?.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const newSkills = [...formData.skills];
                            const currentTags = newSkills[index].tags || [];
                            if (isSelected) {
                              newSkills[index].tags = currentTags.filter(t => t !== tag.name);
                            } else {
                              newSkills[index].tags = [...currentTags, tag.name];
                            }
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className={`px-2 py-0.5 text-[10px] font-mono border transition-all flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-accent/20 border-accent text-accent' 
                              : 'bg-bg border-border text-muted hover:border-accent/50'
                          }`}
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
          </div>

          {/* Mechanics or Presence */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-accent font-mono text-sm border-l-2 border-primary pl-3 uppercase tracking-widest">
                {formData.role === 'Hunter' ? '存在感阶级 (PRESENCE)' : '进阶机制 (MECHANICS)'}
              </h3>
              {formData.role !== 'Hunter' && (
                <button 
                  type="button"
                  onClick={addMechanic}
                  className="flex items-center gap-1 text-xs font-mono text-accent hover:text-primary"
                >
                  <Plus className="w-3 h-3" /> 添加机制
                </button>
              )}
            </div>
            <div className="space-y-4">
              {formData.role === 'Hunter' ? (
                <div className="space-y-4">
                  {formData.presence.map((p, index) => (
                    <div key={index} className="p-4 bg-bg/50 border border-border space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold font-mono">
                          {p.tier}阶
                        </div>
                        <input 
                          type="text"
                          value={p.name}
                          onChange={(e) => updatePresence(index, 'name', e.target.value)}
                          placeholder="阶级名称"
                          className="flex-1 bg-transparent border-b border-border text-text font-bold outline-none focus:border-accent py-1 font-mono"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted font-mono uppercase">冷却:</span>
                          <input 
                            type="text"
                            value={p.cooldown || ''}
                            onChange={(e) => updatePresence(index, 'cooldown', e.target.value)}
                            placeholder="如: 15s"
                            className="w-20 bg-transparent border-b border-border text-accent outline-none focus:border-accent py-1 font-mono text-xs"
                          />
                        </div>
                      </div>
                      <textarea 
                        rows={3}
                        value={p.description}
                        onChange={(e) => updatePresence(index, 'description', e.target.value)}
                        placeholder="阶级能力描述..."
                        className="w-full bg-transparent text-xs text-muted outline-none resize-none font-mono"
                      />
                      
                      {/* Tag Selection */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                        {availableTags.filter(t => t.affectedRole === 'Both' || t.affectedRole === 'Hunter').map(tag => {
                          const isSelected = p.tags?.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => updatePresenceTags(index, tag.name)}
                              className={`px-2 py-0.5 text-[10px] font-mono border transition-all flex items-center gap-1 ${
                                isSelected 
                                  ? 'bg-accent/20 border-accent text-accent' 
                                  : 'bg-bg border-border text-muted hover:border-accent/50'
                              }`}
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
                formData.mechanics.map((mech, index) => (
                  <div key={index} className="p-4 bg-bg/50 border border-border relative group">
                    <button 
                      type="button"
                      onClick={() => removeMechanic(index)}
                      className="absolute top-2 right-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="flex gap-4 mb-2">
                      <div className="w-16 h-16 bg-transparent border border-border flex items-center justify-center text-muted relative group/icon overflow-hidden">
                        {mech.icon ? (
                          <img src={mech.icon} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                        <input 
                          type="text"
                          value={mech.icon || ''}
                          onChange={(e) => updateMechanic(index, 'icon', e.target.value)}
                          placeholder="图标URL"
                          className="absolute inset-0 opacity-0 group-hover/icon:opacity-100 bg-bg/90 text-[8px] font-mono p-1 outline-none transition-opacity"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={mech.title}
                          onChange={(e) => updateMechanic(index, 'title', e.target.value)}
                          placeholder="机制标题（如：博弈技巧）"
                          className="w-full bg-transparent border-b border-border text-text font-bold mb-2 outline-none focus:border-accent py-1"
                        />
                        <textarea 
                          rows={2}
                          value={mech.content}
                          onChange={(e) => updateMechanic(index, 'content', e.target.value)}
                          placeholder="机制详细解析..."
                          className="w-full bg-transparent text-xs text-muted outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Linked Mechanics */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-accent font-mono text-sm border-l-2 border-primary pl-3 uppercase tracking-widest">关联其他角色机制 (LINKED_MECHANICS)</h3>
              <button 
                type="button"
                onClick={addLinkedMechanic}
                className="flex items-center gap-1 text-xs font-mono text-accent hover:text-primary"
              >
                <Plus className="w-3 h-3" /> 添加关联
              </button>
            </div>
            <div className="space-y-2">
              {formData.linkedMechanics.map((link, index) => (
                <div key={index} className="flex items-center gap-4 bg-bg/50 border border-border p-3 group">
                  <select
                    value={link.characterId}
                    onChange={(e) => updateLinkedMechanic(index, 'characterId', e.target.value)}
                    className="flex-1 bg-bg border border-border text-text text-xs p-2 outline-none focus:border-accent font-mono"
                  >
                    <option value="">选择角色...</option>
                    <optgroup label="求生者 SURVIVORS">
                      {allCharacters?.filter(c => c.role === 'Survivor').map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.name})</option>
                      ))}
                    </optgroup>
                    <optgroup label="监管者 HUNTERS">
                      {allCharacters?.filter(c => c.role === 'Hunter').map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.name})</option>
                      ))}
                    </optgroup>
                  </select>

                  {link.characterId && (
                    <select
                      value={link.mechanicIndex}
                      onChange={(e) => updateLinkedMechanic(index, 'mechanicIndex', parseInt(e.target.value))}
                      className="flex-1 bg-bg border border-border text-text text-xs p-2 outline-none focus:border-accent font-mono"
                    >
                      <option value={0}>选择机制...</option>
                      {allCharacters?.find(c => c.id === link.characterId)?.mechanics?.map((m, i) => (
                        <option key={i} value={i}>{m.title}</option>
                      ))}
                    </select>
                  )}

                  <button 
                    type="button"
                    onClick={() => removeLinkedMechanic(index)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <div>
              {initialData && onDelete && (
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 text-primary hover:text-white hover:bg-primary/20 border border-primary/30 transition-all font-mono text-xs tracking-widest flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> 删除档案_DELETE
                </button>
              )}
            </div>
            <div className="flex gap-6">
              <button 
                type="button"
                onClick={onCancel}
                className="px-8 py-2 text-muted hover:text-text transition-colors font-mono text-xs tracking-widest"
              >
                取消_CANCEL
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="px-10 py-2 bg-primary text-white hover:bg-primary/80 transition-all flex items-center gap-3 font-mono text-xs tracking-widest disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? '正在同步...' : '写入数据_SAVE'}
              </button>
            </div>
          </div>
        </form>
      )}

      {showDeleteConfirm && initialData && (
        <div className="fixed inset-0 bg-bg/90 z-[100] flex items-center justify-center p-6">
          <div className="bg-card border border-primary p-8 max-w-md w-full cyber-border animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-serif text-primary mb-4 flex items-center gap-3">
              <Trash2 className="w-6 h-6" /> 确认删除档案？
            </h3>
            <p className="text-muted text-sm font-mono mb-8 leading-relaxed">
              您正在尝试删除角色 <span className="text-accent font-bold">{initialData.title} ({initialData.name})</span> 的档案。此操作不可逆，所有关联数据将被永久移除。
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-border text-muted hover:text-text hover:border-text transition-all font-mono text-xs tracking-widest"
              >
                取消_CANCEL
              </button>
              <button 
                onClick={() => {
                  onDelete?.(initialData);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 bg-primary text-white hover:bg-primary/80 transition-all font-mono text-xs tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.3)]"
              >
                确认删除_CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
