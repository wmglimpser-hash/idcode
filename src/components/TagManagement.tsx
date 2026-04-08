import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Tag as TagIcon, Plus, Trash2, Save, X, Edit2, Check, Filter, User as UserIcon, Shield } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Tag, SURVIVOR_TRAITS_TEMPLATE, HUNTER_TRAITS_TEMPLATE } from '../constants';

interface TagManagementProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

export const TagManagement = ({ user, userProfile }: TagManagementProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Tag>>({
    name: '',
    color: '#00f3ff',
    affectedRole: 'Both',
    affectedStats: []
  });

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tags'), (snapshot) => {
      const loadedTags = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];
      setTags(loadedTags);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!form.name || !user) {
      alert("请填写标签名称");
      return;
    }
    setSaving(true);
    try {
      const docId = editingId || `tag_${Date.now()}`;
      await setDoc(doc(db, 'tags', docId), {
        ...form,
        authorId: user.uid,
        updatedAt: serverTimestamp()
      });
      setShowAddForm(false);
      setEditingId(null);
      setForm({ name: '', color: '#00f3ff', affectedRole: 'Both', affectedStats: [] });
    } catch (error) {
      console.error("Error saving tag:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要删除这个标签吗？")) return;
    try {
      await deleteDoc(doc(db, 'tags', id));
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("删除失败");
    }
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

  const allStats = [
    ...SURVIVOR_TRAITS_TEMPLATE.flatMap(c => c.items.map(i => i.label)),
    ...HUNTER_TRAITS_TEMPLATE.flatMap(c => c.items.map(i => i.label)),
    '存在感', '技能冷却', '技能范围', '充能速度', '博弈能力', '牵制时长', '辅助能力'
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-accent">统一标签系统</h2>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">全局标签管理与影响因素定义</p>
        </div>
        {isContributor && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', color: '#00f3ff', affectedRole: 'Both', affectedStats: [] });
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-accent text-bg font-bold font-mono text-xs uppercase tracking-widest hover:bg-accent/80 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 新增标签
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-card/50 border border-accent p-8 space-y-6 animate-in zoom-in-95 duration-300 cyber-border">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-accent">{editingId ? '编辑标签' : '新增标签'}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-text"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-muted font-mono uppercase tracking-widest">标签名称 NAME</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full bg-bg border border-border px-4 py-3 text-sm focus:border-accent outline-none text-text font-bold" 
                  placeholder="例如：加速、破译、控制..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted font-mono uppercase tracking-widest">标签颜色 COLOR</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={form.color} 
                    onChange={e => setForm({...form, color: e.target.value})} 
                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={form.color} 
                    onChange={e => setForm({...form, color: e.target.value})} 
                    className="flex-1 bg-bg border border-border px-4 py-2 text-sm font-mono focus:border-accent outline-none text-text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted font-mono uppercase tracking-widest">影响阵营 AFFECTED_ROLE</label>
                <div className="flex gap-2">
                  {(['Survivor', 'Hunter', 'Both'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setForm({...form, affectedRole: role})}
                      className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                        form.affectedRole === role ? 'bg-accent text-bg border-accent font-bold' : 'bg-bg text-muted border-border hover:border-accent/50'
                      }`}
                    >
                      {role === 'Survivor' ? '求生者' : role === 'Hunter' ? '监管者' : '全阵营'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted font-mono uppercase tracking-widest">影响属性 AFFECTED_STATS (可多选)</label>
              <div className="bg-bg border border-border p-4 h-[240px] overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar">
                {allStats.map(stat => (
                  <button
                    key={stat}
                    onClick={() => toggleStat(stat)}
                    className={`px-2 py-1.5 text-[10px] text-left font-mono transition-all border ${
                      form.affectedStats?.includes(stat) ? 'bg-accent/20 text-accent border-accent' : 'bg-card/50 text-muted border-border/50 hover:border-accent/30'
                    }`}
                  >
                    {stat}
                  </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tags.map(tag => (
          <div key={tag.id} className="bg-card/30 cyber-border p-6 hover:border-accent transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: tag.color }} />
                <h3 className="text-xl font-serif text-text">{tag.name}</h3>
              </div>
              {isContributor && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
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
                    onClick={() => handleDelete(tag.id)}
                    className="p-1.5 text-muted hover:text-primary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {tag.affectedRole === 'Survivor' ? <UserIcon className="w-3 h-3 text-accent" /> : tag.affectedRole === 'Hunter' ? <Shield className="w-3 h-3 text-primary" /> : <Filter className="w-3 h-3 text-gold" />}
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                  {tag.affectedRole === 'Survivor' ? '求生者阵营' : tag.affectedRole === 'Hunter' ? '监管者阵营' : '全阵营适用'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tag.affectedStats?.map(stat => (
                  <span key={stat} className="text-[9px] font-mono px-2 py-0.5 bg-bg border border-border text-muted/80">
                    {stat}
                  </span>
                ))}
                {(!tag.affectedStats || tag.affectedStats.length === 0) && (
                  <span className="text-[9px] font-mono italic text-muted/40">未定义影响属性</span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex justify-between items-center text-[9px] font-mono text-muted/30">
              <span>ID: {tag.id.slice(-6)}</span>
              <span>{tag.updatedAt?.toDate().toLocaleDateString()}</span>
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
    </div>
  );
};
