import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Map as MapIcon, Info, Plus, Trash2, Save, X, Database, FileText, Layers } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { GameMap, MapResource } from '../constants';

interface MapListProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

export const MapList = ({ user, userProfile }: MapListProps) => {
  const [activeTab, setActiveTab] = useState<'maps' | 'resources'>('maps');
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [mapResources, setMapResources] = useState<MapResource[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [isEditingResources, setIsEditingResources] = useState(false);

  const [editForm, setEditForm] = useState<Partial<GameMap>>({
    name: '',
    description: '',
    imageUrl: '',
    difficulty: 'Medium',
    resources: ''
  });

  const [resourceEditForm, setResourceEditForm] = useState<Partial<MapResource>>({
    title: '',
    content: '',
    mapId: ''
  });

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  useEffect(() => {
    const unsubMaps = onSnapshot(collection(db, 'maps'), (snapshot) => {
      const loadedMaps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameMap[];
      setMaps(loadedMaps);
    });

    const unsubResources = onSnapshot(collection(db, 'map_resources'), (snapshot) => {
      const loadedResources = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MapResource[];
      setMapResources(loadedResources);
    });

    return () => {
      unsubMaps();
      unsubResources();
    };
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

  const handleSaveResource = async () => {
    if (!resourceEditForm.title || !resourceEditForm.content || !user) {
      alert("请填写完整的资源信息");
      return;
    }
    setSaving(true);
    try {
      const docId = resourceEditForm.id || `res_${Date.now()}`;
      await setDoc(doc(db, 'map_resources', docId), {
        ...resourceEditForm,
        authorId: user.uid,
        updatedAt: serverTimestamp()
      });
      setShowResourceForm(false);
      setResourceEditForm({ title: '', content: '', mapId: '' });
    } catch (error) {
      console.error("Error saving resource:", error);
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

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm("确定要删除这条资源吗？")) return;
    try {
      await deleteDoc(doc(db, 'map_resources', id));
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("删除失败");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-serif text-accent">庄园地图侦察</h2>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">地形分析与战术数据</p>
        </div>
        
        <div className="flex gap-2 bg-card/30 p-1 border border-border">
          <button 
            onClick={() => setActiveTab('maps')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'maps' ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'text-muted hover:text-text'}`}
          >
            <MapIcon className="w-3 h-3" /> 地图列表_MAPS
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'resources' ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'text-muted hover:text-text'}`}
          >
            <Layers className="w-3 h-3" /> 资源列表_RESOURCES
          </button>
        </div>

        {isContributor && (
          <div className="flex gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors border ${isEditing ? 'bg-accent text-bg border-accent' : 'bg-bg text-muted border-border hover:text-accent'}`}
            >
              {isEditing ? '完成编辑' : '编辑模式'}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  if (activeTab === 'maps') {
                    setEditForm({ name: '', description: '', imageUrl: '', difficulty: 'Medium', resources: '' });
                    setShowAddForm(true);
                  } else {
                    setResourceEditForm({ title: '', content: '', mapId: '' });
                    setShowResourceForm(true);
                  }
                }}
                className="px-4 py-2 bg-primary text-white font-mono text-xs uppercase tracking-widest hover:bg-primary/80 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> {activeTab === 'maps' ? '新增地图' : '新增资源'}
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'maps' ? (
        <>
          {showAddForm && (
            <div className="bg-card/50 border border-accent p-6 space-y-4 animate-in zoom-in-95 duration-300">
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
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-accent text-bg font-bold flex items-center gap-2 hover:bg-accent/80 disabled:opacity-50">
                  <Save className="w-4 h-4" /> 保存地图
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
                  
                  {expandedMapId === map.id && (
                    <div className="mt-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                      <h4 className="text-sm font-bold text-accent font-mono flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4" /> 关联资源_LINKED_RESOURCES
                      </h4>
                      
                      <div className="space-y-4">
                        {mapResources.filter(r => r.mapId === map.id).map(res => (
                          <div key={res.id} className="bg-bg/50 p-4 border border-border/50">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-xs font-bold text-text uppercase tracking-widest">{res.title}</h5>
                              {isEditing && (
                                <div className="flex gap-2">
                                  <button onClick={() => { setResourceEditForm(res); setShowResourceForm(true); setActiveTab('resources'); }} className="text-muted hover:text-accent"><Info className="w-3 h-3" /></button>
                                  <button onClick={() => handleDeleteResource(res.id)} className="text-muted hover:text-primary"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                            <div className="whitespace-pre-wrap text-xs text-muted font-mono leading-relaxed">
                              {res.content}
                            </div>
                          </div>
                        ))}
                        {mapResources.filter(r => r.mapId === map.id).length === 0 && (
                          <div className="text-xs text-muted font-mono py-4 text-center border border-dashed border-border">
                            暂无关联资源。
                          </div>
                        )}
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
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {showResourceForm && (
            <div className="bg-card/50 border border-accent p-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-accent">新增/编辑地图资源</h3>
                <button onClick={() => setShowResourceForm(false)} className="text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-mono uppercase">资源标题 TITLE</label>
                  <input type="text" value={resourceEditForm.title || ''} onChange={e => setResourceEditForm({...resourceEditForm, title: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text" placeholder="例如：军工厂密码机分布" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted font-mono uppercase">关联地图 (可选)</label>
                  <select value={resourceEditForm.mapId || ''} onChange={e => setResourceEditForm({...resourceEditForm, mapId: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text">
                    <option value="">不关联地图 (独立资源)</option>
                    {maps.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-muted font-mono uppercase">资源内容 CONTENT</label>
                  <textarea value={resourceEditForm.content || ''} onChange={e => setResourceEditForm({...resourceEditForm, content: e.target.value})} className="w-full bg-bg border border-border px-3 py-2 text-sm focus:border-accent outline-none text-text min-h-[200px]" placeholder="输入资源详情、点位描述等..." />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleSaveResource} disabled={saving} className="px-6 py-2 bg-accent text-bg font-bold flex items-center gap-2 hover:bg-accent/80 disabled:opacity-50">
                  <Save className="w-4 h-4" /> 保存资源
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mapResources.map(res => (
              <div key={res.id} className="bg-card/30 cyber-border p-6 hover:border-accent transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-serif text-accent mb-1">{res.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                        {res.mapId ? `关联地图: ${maps.find(m => m.id === res.mapId)?.name || '未知'}` : '独立资源'}
                      </span>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setResourceEditForm(res); setShowResourceForm(true); }} className="p-1.5 bg-accent/10 text-accent border border-accent/20 hover:border-accent transition-colors"><Info className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteResource(res.id)} className="p-1.5 bg-primary/10 text-primary border border-primary/20 hover:border-primary transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                <div className="bg-bg/50 p-4 border border-border/30 whitespace-pre-wrap text-xs text-muted font-mono leading-relaxed max-h-[200px] overflow-y-auto">
                  {res.content}
                </div>
                <div className="mt-4 flex justify-between items-center text-[9px] font-mono text-muted/50">
                  <span>更新于: {res.updatedAt?.toDate().toLocaleString() || '未知'}</span>
                  <FileText className="w-3 h-3" />
                </div>
              </div>
            ))}
            {mapResources.length === 0 && !showResourceForm && (
              <div className="col-span-full py-12 text-center text-muted font-mono border border-dashed border-border">
                暂无地图资源，请点击右上角"新增资源"添加。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
