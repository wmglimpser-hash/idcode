import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DEFAULT_TAG_CONFIG } from '../constants';
import { bulkSyncTags, syncTags } from '../services/tagService';
import { createBackup } from '../services/backupService';
import { X, Save, AlertTriangle, FileJson, Sparkles, Wand2, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  mode: 'wiki' | 'talent' | 'character';
  role?: 'Survivor' | 'Hunter';
  onClose: () => void;
  onSuccess: (data?: any) => void;
  allCharacters?: any[];
}

export const BulkImport = ({ mode, role, onClose, onSuccess, allCharacters }: Props) => {
  const [inputMode, setInputMode] = useState<'json' | 'natural'>('json');
  const [jsonInput, setJsonInput] = useState('');
  const [naturalInput, setNaturalInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleAIParse = async () => {
    if (!naturalInput.trim()) return;
    
    setIsParsing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let schema: any;
      if (mode === 'wiki') {
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "词条标题" },
              type: { type: Type.STRING, description: "词条类型，通常为 'talent'" },
              talentId: { type: Type.STRING, description: "关联的天赋节点 ID (如 1.1, 2.3)" },
              content: { type: Type.STRING, description: "详细的 Markdown 内容" },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "标签列表" }
            },
            required: ["title", "content"]
          }
        };
      } else if (mode === 'talent') {
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nodeId: { type: Type.STRING, description: "天赋节点 ID (如 1.1, 2.3)，可选" },
              name: { type: Type.STRING, description: "天赋名称" },
              description: { type: Type.STRING, description: "天赋描述" },
              targetStats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "目标属性列表 (如 ['跑动速度', '走路速度'])" },
              modifier: { type: Type.STRING, description: "修正值 (如 '+10%', '-2')" },
              effect: { type: Type.STRING, description: "具体效果描述" }
            },
            required: ["name"]
          }
        };
      } else {
        // Character mode
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "角色姓名" },
              title: { type: Type.STRING, description: "角色称号" },
              role: { type: Type.STRING, enum: ["Survivor", "Hunter"], description: "阵营" },
              type: { type: Type.STRING, description: "定位" },
              description: { type: Type.STRING, description: "背景描述" },
              imageUrl: { type: Type.STRING, description: "立绘 URL" },
              order: { type: Type.NUMBER, description: "排序 ID" },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "技能图标 URL" },
                    cooldown: { type: Type.STRING },
                    cost: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              presence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tier: { type: Type.NUMBER, description: "存在感阶级 (0, 1, 2)" },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "技能图标 URL" },
                    cooldown: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            },
            required: ["name", "title", "role"]
          }
        };
      }

      const prompt = `你是一个专业的游戏数据分析师。请将以下关于《第五人格》${mode === 'wiki' ? '百科词条' : mode === 'talent' ? '天赋定义' : '角色档案'}的自然语言描述解析为结构化的 JSON 数组。
      
      待解析文本：
      ${naturalInput}
      
      请严格遵守以下规则：
      1. 返回结果必须是合法的 JSON 数组。
      2. 如果文本中包含多个项目，请全部解析。
      3. 对于缺失的信息，请根据上下文推断或留空。
      4. 确保数据符合指定的 Schema 结构。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      if (response.text) {
        setJsonInput(JSON.stringify(JSON.parse(response.text), null, 2));
        setInputMode('json');
      }
    } catch (err: any) {
      console.error("AI Parse error:", err);
      setError("AI 解析失败：" + (err.message || "未知错误"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!auth.currentUser) {
      setError("请先登录以执行批量导入。");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error("输入必须是 JSON 数组格式。");

      // 1. Trigger backup before bulk import
      const actionLabel = mode === 'character' ? 'bulk_import_character' : (mode === 'wiki' ? 'bulk_import_wiki' : 'bulk_import_talent');
      const backupResult = await createBackup(actionLabel);

      setProgress({ current: 0, total: data.length });

      // If mode is character, summarize tags for optimized sync
      if (mode === 'character') {
        const allTagsToSync = data.map((item: any) => {
          const tags = new Set<string>();
          if (Array.isArray(item.skills)) {
            item.skills.forEach((s: any) => {
              if (Array.isArray(s.tags)) {
                s.tags.forEach((t: string) => { if (t) tags.add(t); });
              }
            });
          }
          if (Array.isArray(item.presence)) {
            item.presence.forEach((p: any) => {
              if (Array.isArray(p.tags)) {
                p.tags.forEach((t: string) => { if (t) tags.add(t); });
              }
            });
          }
          return { tags: Array.from(tags), role: (item.role || role || 'Survivor') as 'Survivor' | 'Hunter' | 'Both' };
        });
        await bulkSyncTags(allTagsToSync, auth.currentUser?.uid || 'unknown');
      }

      let successCount = 0;
      const failedItems: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const itemIdentifier = item.title || item.name || `项目 #${i + 1}`;
        
        try {
          if (mode === 'wiki') {
            if (!item.title) throw new Error("缺少标题");
            
            // 1. Create entry
            const entryRef = await addDoc(collection(db, 'entries'), {
              title: item.title,
              type: item.type || 'talent',
              talentId: item.talentId || null,
              contentMode: 'text',
              authorId: auth.currentUser.uid,
              tags: item.tags || [],
              lastUpdated: serverTimestamp(),
            });

            // 2. Create revision
            const revRef = await addDoc(collection(db, 'revisions'), {
              entryId: entryRef.id,
              authorId: auth.currentUser.uid,
              content: { text: item.content || '暂无内容' },
              timestamp: serverTimestamp(),
              status: 'approved',
              changeSummary: '批量导入',
            });

            // 3. Link revision
            await updateDoc(doc(db, 'entries', entryRef.id), {
              currentRevisionId: revRef.id
            });

            // 4. Sync tags to global tag system
            if (item.tags && item.tags.length > 0) {
              await syncTags(item.tags, 'Both', auth.currentUser.uid);
            }
          } else if (mode === 'talent') {
            // Talent Definition mode
            const targetRole = item.role || role || 'Survivor';
            const nodeId = item.nodeId || `gen_${Math.random().toString(36).substr(2, 9)}`;
            const docId = `${targetRole.toLowerCase()}_${nodeId}`;
            
            // Auto-tagging logic
            const text = ((item.name || '') + (item.description || '')).toLowerCase();
            const autoTags = DEFAULT_TAG_CONFIG
              .filter(config => config.keywords.some(k => text.includes(k)))
              .map(config => config.name);
            const combinedTags = Array.from(new Set([...(item.tags || []), ...autoTags]));

            // Sync tags to global tag system
            if (combinedTags.length > 0) {
              await syncTags(combinedTags, targetRole as any, auth.currentUser.uid);
            }

            await setDoc(doc(db, 'talent_definitions', docId), {
              ...item,
              tags: combinedTags,
              nodeId: nodeId,
              role: targetRole,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else {
            // Character mode
            if (!item.name || !item.title) throw new Error("缺少姓名或称号");
            
            const existing = allCharacters?.find(c => 
              (item.order && c.order === item.order) || 
              (c.name === item.name) || 
              (item.title && c.title === item.title)
            );

            const characterData = {
              ...item,
              lastUpdated: serverTimestamp()
            };

            if (existing) {
              await setDoc(doc(db, 'characters', existing.id), characterData, { merge: true });
            } else {
              await addDoc(collection(db, 'characters'), {
                ...characterData,
                imageUrl: item.imageUrl || `https://picsum.photos/seed/${item.name}/400/600`,
                skills: item.skills || [{ name: '初始技能', description: '该角色尚未配置详细技能说明。' }]
              });
            }
          }
          successCount++;
        } catch (e: any) {
          console.error(`Import failed for ${itemIdentifier}`, e);
          failedItems.push(`${itemIdentifier} (${e.message})`);
        }

        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      let report = `批量导入完成！\n- 成功处理: ${successCount} 个项目`;
      if (failedItems.length > 0) {
        report += `\n- 失败: ${failedItems.length} 个项目\n- 失败名单: ${failedItems.join(', ')}`;
      }
      report += `\n- 备份文件: ${backupResult.fileName}${backupResult.hasFailures ? ' (警告：备份不完整！)' : ''}`;
      if (backupResult.hasFailures) {
        report += `\n- 备份失败集合: ${backupResult.failedCollections.join(', ')}`;
      }
      alert(report);

      onSuccess();
    } catch (err: any) {
      console.error("Bulk import error:", err);
      setError(err.message || "导入失败，请检查 JSON 格式是否正确。");
    } finally {
      setLoading(false);
    }
  };

  const wikiTemplate = [
    {
      "title": "天赋名称",
      "type": "talent",
      "talentId": "1.1",
      "content": "# 标题\n\n在此输入详细的 Markdown 内容...",
      "tags": ["核心", "加速"]
    }
  ];

  const talentTemplate = [
    {
      "nodeId": "1.1",
      "name": "天赋名称",
      "description": "简短的天赋描述...",
      "targetStats": ["跑动速度"],
      "modifier": "+10%",
      "effect": "翻窗后加速"
    }
  ];

  const characterTemplate = [
    {
      "name": "艾玛·伍兹",
      "title": "园丁",
      "role": "Survivor",
      "type": "辅助/牵制",
      "description": "背景故事...",
      "skills": [
        { "name": "巧手成蹄", "description": "技能描述..." }
      ]
    }
  ];

  const getTemplate = () => {
    if (mode === 'wiki') return wikiTemplate;
    if (mode === 'talent') return talentTemplate;
    return characterTemplate;
  };

  return (
    <div className="fixed inset-0 bg-bg/95 z-[100] flex items-start justify-center p-6 overflow-y-auto custom-scrollbar">
      <div className="bg-card w-full max-w-5xl cyber-border p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <FileJson className="text-accent w-6 h-6" />
            <h3 className="text-2xl font-serif text-accent">
              批量导入{mode === 'wiki' ? '百科词条' : mode === 'talent' ? '天赋定义' : '角色档案'}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-accent transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-accent/5 border border-accent/20 p-4 text-xs font-mono text-muted leading-relaxed">
          <p className="text-accent font-bold mb-2">操作说明：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{inputMode === 'json' ? '请粘贴符合 JSON 数组格式的数据。' : '请粘贴包含多个项目描述的原始文本，AI 将自动解析。'}</li>
            {mode === 'wiki' ? (
              <>
                <li><code className="text-text">talentId</code> 对应天赋系统中的节点 ID。</li>
                <li>批量导入的词条将自动设为“已审核”状态。</li>
              </>
            ) : mode === 'talent' ? (
              <>
                <li><code className="text-text">nodeId</code> 必须与天赋树配置中的 ID 一致。</li>
                <li>数据将直接更新至天赋树侧边栏详情。</li>
              </>
            ) : (
              <>
                <li>系统将根据姓名、称号或排序 ID 自动匹配并更新现有角色。</li>
                <li>如果匹配失败，将创建新的角色档案。</li>
              </>
            )}
          </ul>
        </div>

        {error && (
          <div className="p-4 bg-primary/10 border border-primary/50 text-primary text-xs flex items-center gap-3 font-mono">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-4 border-b border-border">
            <button 
              onClick={() => setInputMode('json')}
              className={`pb-2 px-4 text-[10px] font-mono uppercase tracking-widest transition-colors ${inputMode === 'json' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-text'}`}
            >
              JSON 模式
            </button>
            <button 
              onClick={() => setInputMode('natural')}
              className={`pb-2 px-4 text-[10px] font-mono uppercase tracking-widest transition-colors flex items-center gap-2 ${inputMode === 'natural' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-text'}`}
            >
              <Sparkles className="w-3 h-3" /> 自然语言识别 (AI)
            </button>
          </div>

          {inputMode === 'json' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-muted uppercase tracking-widest font-mono">JSON 数据输入</label>
                <button 
                  onClick={() => setJsonInput(JSON.stringify(getTemplate(), null, 2))}
                  className="text-[10px] text-accent hover:underline font-mono"
                >
                  使用模板示例
                </button>
              </div>
              <textarea 
                rows={16}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full bg-bg border border-border text-text p-4 rounded-none focus:border-accent outline-none transition-colors font-mono text-xs leading-relaxed custom-scrollbar"
                placeholder="在此粘贴 JSON 数组..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-muted uppercase tracking-widest font-mono">原始文本输入</label>
                <button 
                  onClick={handleAIParse}
                  disabled={isParsing || !naturalInput.trim()}
                  className="flex items-center gap-2 px-4 py-1 bg-accent/10 border border-accent/30 text-accent text-[10px] font-mono uppercase tracking-widest hover:bg-accent hover:text-bg transition-all disabled:opacity-50"
                >
                  {isParsing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {isParsing ? '正在解析...' : '开始 AI 解析_SMART_PARSE'}
                </button>
              </div>
              <textarea 
                rows={16}
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                className="w-full bg-bg border border-border text-text p-4 rounded-none focus:border-accent outline-none transition-colors font-mono text-xs leading-relaxed custom-scrollbar"
                placeholder={mode === 'character' ? "在此粘贴角色描述，例如：\n艾玛·伍兹，称号园丁，求生者阵营。背景故事是...\n外在特质包括巧手成蹄..." : "在此粘贴包含多个项目的文本..."}
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>正在处理数据流...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="h-1 bg-border overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-6 pt-4">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-8 py-2 text-muted font-mono text-xs hover:text-text transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            退出页面_EXIT
          </button>
          <button 
            onClick={handleImport}
            disabled={loading || !jsonInput}
            className="px-10 py-2 bg-accent text-bg font-bold font-mono text-xs hover:bg-accent/80 disabled:opacity-50 flex items-center gap-3 transition-all"
          >
            <Save className="w-4 h-4" /> {loading ? '正在同步...' : '开始批量导入_START_IMPORT'}
          </button>
        </div>
      </div>
    </div>
  );
};
