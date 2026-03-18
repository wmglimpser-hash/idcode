import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Revision, WikiEntry } from '../constants';
import { Check, X, Eye, Clock, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const WikiModeration = () => {
  const [pendingRevisions, setPendingRevisions] = useState<(Revision & { entryTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRev, setSelectedRev] = useState<(Revision & { entryTitle?: string }) | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'revisions'), 
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const revs = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data() as Revision;
        const entryDoc = await getDoc(doc(db, 'entries', data.entryId));
        return { 
          id: d.id, 
          ...data, 
          entryTitle: entryDoc.exists() ? (entryDoc.data() as WikiEntry).title : '未知词条' 
        };
      }));
      setPendingRevisions(revs);
    } catch (error) {
      console.error("Error fetching pending revisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (rev: Revision, status: 'approved' | 'rejected') => {
    try {
      // 1. Update revision status
      await updateDoc(doc(db, 'revisions', rev.id), { status });

      // 2. If approved, update entry's currentRevisionId
      if (status === 'approved') {
        await updateDoc(doc(db, 'entries', rev.entryId), {
          currentRevisionId: rev.id,
          lastUpdated: new Date()
        });
      }

      setSelectedRev(null);
      fetchPending();
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse text-accent font-mono">正在扫描待审核数据...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List */}
      <div className="lg:col-span-5 space-y-4">
        <h2 className="text-xl font-serif text-accent flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" /> 待审核修订 ({pendingRevisions.length})
        </h2>
        
        {pendingRevisions.length === 0 ? (
          <div className="p-8 border border-dashed border-border text-center text-muted font-mono text-xs">
            暂无待审核的修订。
          </div>
        ) : (
          pendingRevisions.map(rev => (
            <button
              key={rev.id}
              onClick={() => setSelectedRev(rev)}
              className={`w-full text-left p-4 border transition-all flex justify-between items-center group ${
                selectedRev?.id === rev.id ? 'bg-accent/10 border-accent' : 'bg-card/30 border-border hover:border-accent/50'
              }`}
            >
              <div>
                <div className="text-sm font-bold text-text mb-1">{rev.entryTitle}</div>
                <div className="flex items-center gap-3 text-[10px] text-muted font-mono">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {rev.authorId.slice(0, 6)}...</span>
                  <span>{new Date(rev.timestamp?.seconds * 1000).toLocaleString()}</span>
                </div>
              </div>
              <Eye className={`w-4 h-4 ${selectedRev?.id === rev.id ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
            </button>
          ))
        )}
      </div>

      {/* Detail View */}
      <div className="lg:col-span-7">
        {selectedRev ? (
          <div className="bg-card/50 cyber-border p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div>
                <h3 className="text-2xl font-serif text-accent mb-2">{selectedRev.entryTitle}</h3>
                <p className="text-xs text-muted font-mono">修订摘要: {selectedRev.changeSummary || '无'}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleAction(selectedRev, 'rejected')}
                  className="p-2 border border-primary text-primary hover:bg-primary hover:text-white transition-all"
                  title="拒绝"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleAction(selectedRev, 'approved')}
                  className="p-2 border border-accent text-accent hover:bg-accent hover:text-bg transition-all"
                  title="批准"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] text-muted font-mono uppercase tracking-widest">
                <FileText className="w-3 h-3" /> 修订内容预览
              </div>
              <div className="prose prose-invert max-w-none bg-bg/50 p-6 border border-border font-mono text-sm">
                <ReactMarkdown>{selectedRev.content?.text || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted font-mono text-xs border border-dashed border-border p-12">
            <Eye className="w-12 h-12 mb-4 opacity-20" />
            请从左侧选择一个修订进行预览和审核。
          </div>
        )}
      </div>
    </div>
  );
};
