import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WikiEntry, Revision } from '../constants';
import { Book, Clock, User, Shield, Zap, Search, Heart, Edit3, Activity, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  entry: WikiEntry;
  onEdit: () => void;
}

export const WikiEntryView = ({ entry, onEdit }: Props) => {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevision = async () => {
      if (!entry.currentRevisionId) {
        setLoading(false);
        return;
      }
      try {
        const revDoc = await getDoc(doc(db, 'revisions', entry.currentRevisionId));
        if (revDoc.exists()) {
          const revData = { id: revDoc.id, ...revDoc.data() } as Revision;
          setRevision(revData);
          setEditedText(revData.content?.text || '');
        }
      } catch (error) {
        console.error("Error fetching revision:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevision();
  }, [entry]);

  const handleSave = async () => {
    if (!auth.currentUser) {
      setError("请先登录以编辑词条。");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // 1. Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
      const status = isAdmin ? 'approved' : 'pending';

      // 2. Create new revision
      const revRef = await addDoc(collection(db, 'revisions'), {
        entryId: entry.id,
        authorId: auth.currentUser.uid,
        content: { text: editedText },
        timestamp: serverTimestamp(),
        status,
        changeSummary: '快速编辑内容',
      });

      // 3. Update entry if approved
      const updateData: any = {
        lastUpdated: serverTimestamp(),
      };
      if (status === 'approved') {
        updateData.currentRevisionId = revRef.id;
        
        // Update local state to reflect changes immediately
        setRevision(prev => prev ? { ...prev, content: { text: editedText } } : null);
      }

      await updateDoc(doc(db, 'entries', entry.id), updateData);

      if (status === 'pending') {
        alert("编辑已提交，等待管理员审核。");
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      setError("保存失败，请检查权限或网络。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse text-accent font-mono">正在调取档案数据...</div>;

  if (!entry.currentRevisionId) {
    return (
      <div className="bg-card/50 cyber-border p-12 text-center space-y-6 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto rotate-45">
          <Book className="text-primary w-8 h-8 -rotate-45 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-serif text-accent cyber-glow-text">档案尚未同步</h3>
          <p className="text-muted text-sm font-mono max-w-md mx-auto">
            该词条已在系统中创建，但具体内容正在等待管理员审核。请稍后再试，或提交您的版本。
          </p>
        </div>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="px-8 py-3 bg-accent/10 border border-accent/50 text-accent text-[10px] font-mono hover:bg-accent hover:text-bg transition-all tracking-widest"
          >
            提交新版本_REVISE
          </button>
        )}
      </div>
    );
  }

  const content = revision?.content;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-mono border border-primary/30 uppercase tracking-widest">
              {entry.type}
            </span>
            <span className="text-muted text-[10px] font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> 最后更新: {new Date(entry.lastUpdated?.seconds * 1000).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-accent cyber-glow-text">{entry.title}</h1>
        </div>
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 px-6 py-2 border border-accent text-accent hover:bg-accent hover:text-bg transition-all font-mono text-xs tracking-widest cyber-border"
        >
          <Edit3 className="w-4 h-4" /> 编辑词条_EDIT
        </button>
      </div>

      {/* Content Rendering */}
      {entry.contentMode === 'text' ? (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-primary/10 border border-primary/50 text-primary text-[10px] font-mono flex items-center gap-2">
              <Zap className="w-3 h-3" /> {error}
            </div>
          )}
          
          {!isEditing ? (
            <div className="prose prose-invert max-w-none font-mono text-sm leading-relaxed">
              <div className="bg-card/30 p-8 cyber-border relative group">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-bg"
                  title="快速编辑"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <ReactMarkdown>{revision?.content?.text || '暂无内容'}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-card/30 border border-accent/30 text-text p-8 font-mono text-sm leading-relaxed min-h-[400px] outline-none focus:border-accent transition-colors"
                placeholder="在此输入 Markdown 内容..."
              />
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 text-muted font-mono text-xs hover:text-text transition-colors"
                >
                  取消_CANCEL
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2 bg-accent text-bg font-bold font-mono text-xs hover:bg-accent/80 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? '正在保存...' : '保存更改_SAVE'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Template Mode: Character Example */}
          <div className="lg:col-span-4 space-y-6">
            <div className="aspect-[3/4] bg-card cyber-border overflow-hidden relative group">
              <img 
                src={content?.imageUrl || 'https://picsum.photos/seed/idv/400/600'} 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
            </div>
            
            <div className="bg-card/50 border border-border p-6 cyber-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted uppercase text-[10px] font-mono tracking-widest">定位 TYPE</span>
                <span className="text-accent font-bold font-mono">{content?.type || '未知'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section className="bg-card/30 border border-border p-8 cyber-border relative overflow-hidden">
              <h2 className="text-2xl font-serif text-accent mb-8 flex items-center gap-3 cyber-glow-text">
                <Activity className="w-6 h-6" /> 核心档案解析
              </h2>
              <div className="space-y-6">
                <p className="text-text/80 leading-relaxed font-mono text-sm border-l-2 border-primary pl-4 py-2 bg-primary/5">
                  {content?.description || '暂无描述数据。'}
                </p>
                {content?.traits && content.traits.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.traits.map((cat: any, i: number) => (
                      <div key={i} className="p-3 bg-bg/50 border border-border/50">
                        <div className="text-[10px] text-primary font-bold mb-2 uppercase">{cat.category}</div>
                        <div className="space-y-1">
                          {cat.items.map((item: any, j: number) => (
                            <div key={j} className="flex justify-between text-[10px] font-mono">
                              <span className="text-muted">{item.label}</span>
                              <span className="text-text">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
