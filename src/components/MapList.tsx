import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Map as MapIcon, Info, Plus, Trash2, Save, X, Database } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { GameMap } from '../constants';

interface MapListProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

export const MapList = ({ user, userProfile }: MapListProps) => {
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Partial<GameMap>>({
    name: '',
    description: '',
    imageUrl: '',
    difficulty: 'Medium',
    resources: ''
  });

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'maps'), (snapshot) => {
      const loadedMaps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameMap[];
      setMaps(loadedMaps);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!editForm.name || !editForm.description || !editForm.imageUrl) {
      alert("请填写完整的地图信息");
      return;
    }
    setSaving(true);
    try {
      const docId = editForm.id || `map_${Date.now()}`;
      await setDoc(doc(db, 'maps', docId), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      setShowAddForm(false);
      setEditForm({ name: '', description: '', imageUrl: '', difficulty: 'Medium', resources: '' });
    } catch (error) {
      console.error("Error saving map:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("确定要删除这张地图吗？")) return;
    try {
      await deleteDoc(doc(db, 'maps', id));
    } catch (error) {
      console.error("Error deleting map:", error);
      alert("删除失败");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-accent">庄园地图侦察</h2>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">地形分析与战术数据</p>
        </div>
        {isContributor && (
          <div className="flex gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors border ${isEditing ? 'bg-accent text-bg border-accent' : 'bg-bg text-muted border-border hover:text-accent'}`}
            >
              {isEditing ? '完成编辑' : '编辑地图'}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  setEditForm({ name: '', description: '', imageUrl: '', difficulty: 'Medium', resources: '' });
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-primary text-white font-mono text-xs uppercase tracking-widest hover:bg-primary/80 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 新增地图
              </button>
            )}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="bg-card/50 border border-accent p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-serif text-accent">新增/编辑地图</h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted font-mono uppercase">地图名称 NAME</label>
              <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted font-mono uppercase">难度 DIFFICULTY</label>
              <select value={editForm.difficulty || 'Medium'} onChange={e => setEditForm({...editForm, difficulty: e.target.value as any})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text">
                <option value="Easy">低威胁 (Easy)</option>
                <option value="Medium">中等威胁 (Medium)</option>
                <option value="Hard">极高威胁 (Hard)</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-muted font-mono uppercase">图片链接 IMAGE URL</label>
              <input type="text" value={editForm.imageUrl || ''} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-muted font-mono uppercase">描述 DESCRIPTION</label>
              <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text min-h-[80px]" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-muted font-mono uppercase">地图资源 RESOURCES</label>
              <textarea value={editForm.resources || ''} onChange={e => setEditForm({...editForm, resources: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text min-h-[120px]" placeholder="例如：密码机分布、地窖刷新点、板窗分布等..." />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-accent text-bg font-bold flex items-center gap-2 hover:bg-accent/80 disabled:opacity-50">
              <Save className="w-4 h-4" /> 保存
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {maps.map((map) => (
          <div 
            key={map.id} 
            className={`group bg-card/30 cyber-border overflow-hidden transition-all duration-500 ${expandedMapId === map.id ? 'border-accent md:col-span-2 lg:col-span-3' : 'hover:border-accent cursor-pointer'}`}
            onClick={() => !isEditing && setExpandedMapId(expandedMapId === map.id ? null : map.id)}
          >
            <div className={`relative overflow-hidden ${expandedMapId === map.id ? 'h-64' : 'h-48'}`}>
              <img 
                src={map.imageUrl} 
                alt={map.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent opacity-90" />
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-serif text-accent flex items-center gap-2 mb-2">
                    <MapIcon className="w-6 h-6" /> {map.name}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-1 border ${
                    map.difficulty === 'Easy' ? 'border-emerald-500 text-emerald-500' : 
                    map.difficulty === 'Medium' ? 'border-amber-500 text-amber-500' : 'border-primary text-primary'
                  }`}>
                    {map.difficulty === 'Easy' ? '低威胁' : map.difficulty === 'Medium' ? '中等威胁' : '极高威胁'}
                  </span>
                </div>
                {isEditing && isAdminUser && (
                  <button 
                    onClick={(e) => handleDelete(map.id, e)}
                    className="p-2 bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <p className={`text-muted text-sm font-mono leading-relaxed ${expandedMapId === map.id ? '' : 'line-clamp-2'}`}>
                {map.description}
              </p>
              
              {expandedMapId === map.id && map.resources && (
                <div className="mt-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                  <h4 className="text-sm font-bold text-accent font-mono mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> 地图资源_RESOURCES
                  </h4>
                  <div className="bg-bg/50 p-4 border border-border/50 whitespace-pre-wrap text-sm text-text/90 font-mono leading-relaxed">
                    {map.resources}
                  </div>
                </div>
              )}
              
              {!expandedMapId && !isEditing && (
                <div className="mt-4 pt-4 border-t border-border/30 flex justify-center">
                  <span className="text-[10px] text-muted font-mono uppercase tracking-widest flex items-center gap-1">
                    <Info className="w-3 h-3" /> 点击查看详情
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {maps.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 text-center text-muted font-mono border border-dashed border-border">
            暂无地图数据，请点击右上角"编辑地图"添加。
          </div>
        )}
      </div>
    </div>
  );
};
