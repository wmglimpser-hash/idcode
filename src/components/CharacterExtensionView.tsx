import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Character } from '../constants';
import { Plus, Trash2, ArrowLeft, Info, Activity, Zap } from 'lucide-react';

interface ExtensionItem {
  id: string;
  characterId: string;
  type: 'talent' | 'auxiliary';
  title: string;
  description: string;
  imageUrl: string;
  updatedAt?: any;
}

interface Props {
  character: Character;
  type: 'talent' | 'auxiliary';
  onBack: () => void;
}

export const CharacterExtensionView = ({ character, type, onBack }: Props) => {
  const [items, setItems] = useState<ExtensionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const titleText = type === 'talent' ? '天赋推荐' : '辅助特质推荐';
  const Icon = type === 'talent' ? Activity : Zap;

  useEffect(() => {
    const q = query(
      collection(db, 'character_extensions'),
      where('characterId', '==', character.id),
      where('type', '==', type),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExtensionItem[];
      setItems(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching extensions:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [character.id, type]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    setAdding(true);
    try {
      await addDoc(collection(db, 'character_extensions'), {
        characterId: character.id,
        type,
        title: newTitle,
        description: newDescription,
        imageUrl: newImageUrl,
        updatedAt: serverTimestamp()
      });
      setNewTitle('');
      setNewDescription('');
      setNewImageUrl('');
    } catch (err) {
      console.error("Error adding extension:", err);
      alert('添加失败，请重试。');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    try {
      await deleteDoc(doc(db, 'character_extensions', id));
    } catch (err) {
      console.error("Error deleting extension:", err);
      alert('删除失败。');
    }
  };

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
          <h2 className="text-xl font-serif text-accent cyber-glow-text flex items-center justify-end gap-2">
            <Icon className="w-5 h-5" /> {titleText}
          </h2>
          <p className="text-xs text-muted font-mono uppercase tracking-tighter">
            {type.toUpperCase()}_FOR_{character.name}
          </p>
        </div>
      </div>

      {/* Add Form */}
      <section className="bg-card/30 border border-border p-6 cyber-border">
        <h3 className="text-sm font-bold text-text font-mono mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Plus className="w-4 h-4" /> 录入新{type === 'talent' ? '天赋' : '特质'}_INPUT_NEW
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">名称 TITLE</label>
            <input 
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={type === 'talent' ? "例如：39天赋 (破窗理论+回光返照)" : "例如：闪现"}
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">图片链接 IMAGE_URL (可选)</label>
            <input 
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="输入图片URL..."
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] text-muted uppercase font-mono tracking-widest">描述说明 DESCRIPTION</label>
            <textarea 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="详细说明适用场景、打法思路等..."
              className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors min-h-[100px] resize-y"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button 
              type="submit"
              disabled={adding}
              className="bg-primary text-white px-8 py-2 hover:bg-primary/80 transition-all disabled:opacity-50 flex items-center gap-2 font-mono text-sm tracking-widest"
            >
              <Plus className="w-4 h-4" /> 确认添加_ADD
            </button>
          </div>
        </form>
      </section>

      {/* Items List */}
      <section className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-muted animate-pulse font-mono border border-border bg-card/30">
            正在扫描数据模块... SCANNING_DATA_MODULES
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono border border-border bg-card/30 flex flex-col items-center gap-4">
            <Info className="w-8 h-8 opacity-20" />
            <p className="uppercase tracking-widest text-sm">暂无{type === 'talent' ? '天赋' : '特质'}记录_NO_RECORDS_FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-card/30 border border-border p-6 cyber-border relative group">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-4 right-4 text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {item.imageUrl && (
                    <div className="w-full md:w-1/3 flex-shrink-0">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-auto object-cover border border-border/50"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-accent font-mono">{item.title}</h3>
                    <div className="text-sm text-text/80 font-mono leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
