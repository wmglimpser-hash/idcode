import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { WikiEntry, Revision } from '../constants';
import { Save, X, FileText, Layout, AlertTriangle, Image as ImageIcon, Upload, Network } from 'lucide-react';

interface Props {
  entry?: WikiEntry;
  onSave: () => void;
  onCancel: () => void;
}

export const WikiEditor = ({ entry, onSave, onCancel }: Props) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [type, setType] = useState<WikiEntry['type']>(entry?.type || 'character');
  const [talentId, setTalentId] = useState(entry?.talentId || '');
  const [contentMode, setContentMode] = useState<WikiEntry['contentMode']>(entry?.contentMode || 'text');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTalents, setAvailableTalents] = useState<any[]>([]);

  // Load available talents for selection
  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'talent_definitions'), (snapshot) => {
      setAvailableTalents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Load existing content if editing
  React.useEffect(() => {
    const loadContent = async () => {
      if (entry?.currentRevisionId) {
        setLoading(true);
        try {
          const revDoc = await getDoc(doc(db, 'revisions', entry.currentRevisionId));
          if (revDoc.exists()) {
            const data = revDoc.data();
            if (data.content?.text) {
              setText(data.content.text);
            }
          }
        } catch (err) {
          console.error("Error loading revision:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadContent();
  }, [entry]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `wiki/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      // If in text mode, append to markdown
      if (contentMode === 'text') {
        setText(prev => prev + `\n\n![图片](${url})`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("图片上传失败。");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError("请先登录以编辑词条。");
      return;
    }

    setLoading(true);
    try {
      let entryId = entry?.id;

      // 1. Create entry if it doesn't exist
      if (!entryId) {
        const entryRef = await addDoc(collection(db, 'entries'), {
          title,
          type,
          talentId: type === 'talent' ? talentId : null,
          contentMode,
          authorId: auth.currentUser.uid,
          tags: [],
          lastUpdated: serverTimestamp(),
        });
        entryId = entryRef.id;
      } else if (type === 'talent') {
        // Update talentId if it changed
        await updateDoc(doc(db, 'entries', entryId), {
          talentId,
          lastUpdated: serverTimestamp(),
        });
      }

      // 2. Create revision
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
      const status = isAdmin ? 'approved' : 'pending';

      const revRef = await addDoc(collection(db, 'revisions'), {
        entryId,
        authorId: auth.currentUser.uid,
        content: contentMode === 'text' ? { text } : { /* template data would go here */ },
        timestamp: serverTimestamp(),
        status,
        changeSummary: entry ? '更新词条内容' : '创建初始词条',
      });

      // 3. Update entry with current revision ONLY if approved
      const updateData: any = {
        lastUpdated: serverTimestamp(),
      };
      if (status === 'approved') {
        updateData.currentRevisionId = revRef.id;
      }
      
      await updateDoc(doc(db, 'entries', entryId), updateData);

      if (status === 'pending') {
        setError("词条已提交，等待管理员审核。");
        setTimeout(onSave, 2000);
      } else {
        onSave();
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("保存失败，请检查权限或网络。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card/50 cyber-border p-8 shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h2 className="text-3xl font-serif text-accent">
          {entry ? '编辑词条' : '创建新词条'}
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={() => setContentMode('text')}
            className={`flex items-center gap-2 px-4 py-1 text-[10px] font-mono border ${contentMode === 'text' ? 'bg-accent text-bg border-accent' : 'border-border text-muted'}`}
          >
            <FileText className="w-3 h-3" /> 文本模式
          </button>
          <button 
            onClick={() => setContentMode('template')}
            className={`flex items-center gap-2 px-4 py-1 text-[10px] font-mono border ${contentMode === 'template' ? 'bg-accent text-bg border-accent' : 'border-border text-muted'}`}
          >
            <Layout className="w-3 h-3" /> 模板模式
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/50 text-primary text-xs flex items-center gap-3 font-mono">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase tracking-widest font-mono">词条标题</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!!entry}
              className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono disabled:opacity-50"
              placeholder="例如：调香师 技巧指南"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase tracking-widest font-mono">词条分类</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
            >
              <option value="character">求生者/监管者</option>
              <option value="map">地图</option>
              <option value="mechanic">游戏机制</option>
              <option value="guide">进阶攻略</option>
              <option value="talent">天赋技能</option>
            </select>
          </div>
        </div>

        {type === 'talent' && (
          <div className="space-y-2">
            <label className="text-[10px] text-muted uppercase tracking-widest font-mono">关联天赋节点</label>
            <select 
              value={talentId}
              onChange={(e) => setTalentId(e.target.value)}
              className="w-full bg-bg border border-border text-text p-3 rounded-none focus:border-accent outline-none transition-colors font-mono"
            >
              <option value="">-- 请选择天赋 --</option>
              <optgroup label="求生者天赋">
                {availableTalents.filter(t => t.role === 'Survivor').map(node => (
                  <option key={`surv-${node.id}`} value={node.id}>{node.name || node.id}</option>
                ))}
              </optgroup>
              <optgroup label="监管者天赋">
                {availableTalents.filter(t => t.role === 'Hunter').map(node => (
                  <option key={`hunt-${node.id}`} value={node.id}>{node.name || node.id}</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {contentMode === 'text' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-muted uppercase tracking-widest font-mono">Markdown 内容</label>
              <label className="cursor-pointer flex items-center gap-2 text-[10px] font-mono text-accent hover:text-primary transition-colors">
                <Upload className="w-3 h-3" /> {uploading ? '上传中...' : '上传图片_IMAGE'}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <textarea 
              rows={15}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-bg border border-border text-text p-4 rounded-none focus:border-accent outline-none transition-colors resize-none font-mono text-sm leading-relaxed"
              placeholder="# 标题&#10;&#10;在此输入词条内容，支持 Markdown 语法..."
            />
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-border text-muted font-mono text-xs">
            模板模式编辑器正在开发中... 请先使用文本模式。
          </div>
        )}

        <div className="flex justify-end gap-6 pt-6 border-t border-border">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-2 text-muted hover:text-text transition-colors font-mono text-xs tracking-widest"
          >
            取消_CANCEL
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-10 py-2 bg-primary text-white hover:bg-primary/80 transition-all flex items-center gap-3 font-mono text-xs tracking-widest disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? '正在同步...' : '提交词条_SUBMIT'}
          </button>
        </div>
      </form>
    </div>
  );
};
