import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Maximize2, BookOpen, User, Clock, FileText, Plus, 
  Tag as TagIcon, Trophy, X, Save, FilePlus, Sparkles, Search, Info, 
  Copy, Trash2, ArrowUp, ArrowDown, Monitor, Video, Edit, Download, Zap, Calculator, Layout, List
} from 'lucide-react';
import { Tag, Character, TalentDefinition } from '../constants';
import { generateLeaderboardData, extractValue } from '../utils/leaderboardUtils';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

type SlideType = 'title' | 'conclusion' | 'content' | 'ranking' | 'mindmap' | 'summary';

interface SlideAsset {
  id: string;
  type: 'icon' | 'image';
  url?: string;
  iconKey?: string;
  name: string;
  alt: string;
  placement: 'hero' | 'inline' | 'corner';
}

interface MindmapBranch {
  id: string;
  title: string;
  children?: string[];
}
interface MindmapData {
  branches: MindmapBranch[];
}

interface Slide {
  id: string;
  type: SlideType;
  title: string;
  body?: string;
  bullets?: string[];
  notes: string;
  estimatedSeconds?: number;
  sourceType?: 'leaderboard' | 'tag';
  sourceData?: any; // For flexible source storage
  assets?: SlideAsset[];
  mindmapData?: MindmapData;
}

interface TheoryArticle {
  id: string;
  title: string;
  series: string;
  date: string;
  author: string;
  slides: Slide[];
  relatedTags?: string[];
  relatedMetrics?: string[];
}

interface TheoryPresentationProps {
  characters: Character[];
  talents: TalentDefinition[];
  availableTags: Tag[];
  availableTraits: { id: string; label: string; category: string; role: 'Survivor' | 'Hunter' }[];
  customMetrics?: { id: string; name: string; traitLabels: string[]; role: 'Survivor' | 'Hunter' }[];
}

const MOCK_DATA: TheoryArticle[] = [
  {
    id: 'template-v2',
    title: '理论演示标准版式指南',
    series: '官方模板 2.0',
    date: '2024-05-08',
    author: '演示助手',
    slides: [
      {
        id: 's1',
        type: 'title',
        title: '为什么您的表达需要“理论版式”？',
        body: '从混乱的信息到清晰的洞察\n基于 AIGC 辅助演示系统的核心板式展示',
        notes: "标题页：用于开场定调。建议使用加重的大号字体。",
        estimatedSeconds: 10,
        assets: [{ id: 'a1', type: 'icon', iconKey: 'Sparkles', name: 'Spark', alt: 'spark', placement: 'hero' }]
      },
      {
        id: 's2',
        type: 'conclusion',
        title: 'CONTENTS',
        body: '版式概览与应用场景\n什么是好的“内容页”？\n数据驱动的“榜单页”\n结构化的“思维导图”',
        notes: "目录页：输入多行短语自动识别。用于建立预期。",
        estimatedSeconds: 15
      },
      {
        id: 's3',
        type: 'content',
        title: '内容页：信息的高效平铺',
        bullets: ['清晰的层级：保持论点独立', '留白的艺术：每页只讲一个重点', '配图辅助：视觉化说明文字论据'],
        notes: "内容页：最常用的基础版式。支持多级列表。",
        estimatedSeconds: 20
      },
      {
        id: 's4',
        type: 'ranking',
        title: '因子权重排行榜',
        body: '数据证明逻辑',
        sourceType: 'tag',
        sourceData: {
          metricLabel: '影响力指标',
          groups: [
            { rank: 1, value: 95, characters: [{ name: '核心洞察' }] },
            { rank: 2, value: 88, characters: [{ name: '交互设计' }] },
            { rank: 3, value: 72, characters: [{ name: '数据支持' }] }
          ]
        },
        notes: "榜单页：展示竞争或优先级数据。自带排名动画。",
        estimatedSeconds: 20
      },
      {
        id: 's5',
        type: 'mindmap',
        title: '系统核心架构',
        mindmapData: {
          branches: [
            { id: 'b1', title: '表现层', children: ['多板式渲染', '动态过渡'] },
            { id: 'b2', title: '数据层', children: ['语义识别', '标记解析'] }
          ]
        },
        notes: "思维导图：展现复杂树状逻辑。",
        estimatedSeconds: 25
      },
      {
        id: 's6',
        type: 'summary',
        title: '立即开始创作您的演示文档',
        body: '输入原始内容，点击一键识别。\n感谢您的使用。',
        notes: "总结页：最后一页收尾。加黑背景增加视觉重点。",
        estimatedSeconds: 12,
        assets: [{ id: 'a2', type: 'icon', iconKey: 'Trophy', name: 'win', alt: 'win', placement: 'corner' }]
      }
    ]
  }
];

type ViewMode = 'edit' | 'presentation';

const DEFAULT_ICONS = [
  { iconKey: 'Trophy', name: '数据榜单' },
  { iconKey: 'TagIcon', name: '分类标签' },
  { iconKey: 'Zap', name: '公式计算' },
  { iconKey: 'FileText', name: '文档记录' },
  { iconKey: 'Clock', name: '时间节点' },
  { iconKey: 'Monitor', name: '分析对比' },
  { iconKey: 'Info', name: '提示警示' },
  { iconKey: 'Sparkles', name: '结论总结' },
];

const IconMap: Record<string, React.FC<any>> = {
  Trophy, TagIcon, Zap, FileText, Clock, Monitor, Info, Sparkles
};

// Extracted to top-level to prevent re-creation on every render (fixes cursor jumping)
const EditableTitle = ({ className, value, onChange, isEdit }: { className: string, value: string, onChange: (v: string) => void, isEdit: boolean }) => {
  if (!isEdit) return <h2 className={className}>{value}</h2>;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={e => e.stopPropagation()}
      className={`${className} bg-transparent border-b-2 border-slate-100 focus:border-slate-300 outline-none w-full text-center resize-none p-0 overflow-hidden min-h-[1.5em]`}
      rows={1}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
      }}
    />
  );
};

const EditableBody = ({ className, value, onChange, isEdit }: { className: string, value: string, onChange: (val: string) => void, isEdit: boolean }) => {
  if (!isEdit) return <p className={className}>{value}</p>;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={e => e.stopPropagation()}
      className={`${className} bg-transparent border-2 border-dashed border-slate-100 focus:border-slate-300 rounded-xl outline-none w-full text-center resize-none p-4 min-h-[100px] font-medium transition-all`}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
      }}
    />
  );
};

export const TheoryPresentation: React.FC<TheoryPresentationProps> = ({ characters, talents, availableTags, availableTraits, customMetrics = [] }) => {
  const [articles, setArticles] = useState<TheoryArticle[]>(() => {
    const validateAndMigrateData = (data: any[]): TheoryArticle[] => {
      return data.map(article => {
        // Enforce basic structure
        if (!article.id || !article.title || !Array.isArray(article.slides)) {
          throw new Error("Invalid article structure");
        }
        
        // Migrate slides
        const validSlides: Slide[] = article.slides.map((s: any) => {
          let type = s.type as SlideType;
          // Legacy mapping
          const legacyTypes = ['list', 'compare', 'formula', 'text'];
          if (legacyTypes.includes(s.type)) {
            type = 'content';
          }
          
          return {
            ...s,
            type: type || 'content',
            id: s.id || `mig-${Math.random().toString(36).substr(2, 9)}`,
            title: s.title || '无标题页面',
            body: s.body || '',
            notes: s.notes || ''
          };
        });

        return {
          ...article,
          slides: validSlides,
          relatedTags: Array.isArray(article.relatedTags) ? article.relatedTags : [],
          relatedMetrics: Array.isArray(article.relatedMetrics) ? article.relatedMetrics : []
        };
      });
    };

    try {
      const v2 = localStorage.getItem('theory_articles_v2');
      if (v2) {
        const parsed = JSON.parse(v2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return validateAndMigrateData(parsed);
        }
      }

      // Fallback to legacy v1
      const v1 = localStorage.getItem('theory_articles');
      if (v1) {
        const parsed = JSON.parse(v1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Migrating theory_articles V1 to V2...");
          const migrated = validateAndMigrateData(parsed);
          // Save to V2 immediately
          localStorage.setItem('theory_articles_v2', JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (err) {
      console.warn("Storage migration failed, falling back to mock data", err);
    }
    return MOCK_DATA;
  });

  // State for raw drafting
  const [rawText, setRawText] = useState('');
  const [showRecognitionGuide, setShowRecognitionGuide] = useState(false);

  // Auto-save articles
  useEffect(() => {
    localStorage.setItem('theory_articles_v2', JSON.stringify(articles));
  }, [articles]);

  const generateArticleFromDraft = () => {
    if (!rawText.trim()) return;

    const sections = rawText.split(/\n\s*---\s*\n/).filter(s => s.trim());
    const validSections = sections.length > 0 ? sections : [rawText];
    
    const generatedSlides: Slide[] = validSections.map((sec, idx) => {
      const lines = sec.trim().split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim() || `页面 ${idx + 1}`;
      const bodyLines = lines.length > 1 ? lines.slice(1) : [];
      const fullText = (title + '\n' + bodyLines.join('\n')).toLowerCase();
      
      let type: SlideType = 'content';
      
      // Smart detection
      if (idx === 0) {
        type = 'title';
      } else if (idx === validSections.length - 1 || fullText.includes('谢谢') || fullText.includes('总结') || fullText.includes('end') || fullText.includes('finish')) {
        type = 'summary';
      } else if (fullText.includes('目录') || fullText.includes('contents') || fullText.includes('overview') || (bodyLines.length > 3 && bodyLines.slice(0, 5).every(l => l.length < 20))) {
        type = 'conclusion';
      } else if (/(排名|排行|top|榜单|第\d+名|胜率|权重)/i.test(fullText)) {
        type = 'ranking';
      } else if (fullText.includes('导图') || fullText.includes('架构') || fullText.includes('逻辑') || fullText.includes('mindmap')) {
        type = 'mindmap';
      }

      const rawBody = bodyLines.join('\n');
      const notes = rawBody.match(/\[备注：(.*?)\]/)?.[1] || rawBody.match(/\[备注:(.*?)\]/)?.[1] || "自动识别生成的页面。";
      const cleanBody = rawBody.replace(/\[备注[：:].*?\]/g, '').trim();

      return {
        id: `gen-${Date.now()}-${idx}`,
        type,
        title,
        body: cleanBody,
        notes,
        estimatedSeconds: 15,
        assets: []
      };
    });

    const newArt: TheoryArticle = {
      id: `art-${Date.now()}`,
      title: generatedSlides[0]?.title || '未命名文稿',
      series: '快速草稿',
      date: new Date().toISOString().split('T')[0],
      author: 'AI 识别助手',
      slides: generatedSlides
    };

    setArticles([newArt, ...articles]);
    setCurrentArticle(newArt);
    setCurrentSlideIndex(0);
    setRawText('');
  };

  const [currentArticle, setCurrentArticle] = useState<TheoryArticle>(articles[0] || MOCK_DATA[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [slideDeleteConfirm, setSlideDeleteConfirm] = useState(false);
  
  const [isDraftCollapsed, setIsDraftCollapsed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16/9' | '9/16'>('16/9');
  const [importSortOrder, setImportSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newArticleDoc, setNewArticleDoc] = useState({
    title: '',
    series: '',
    content: '',
    selectedTags: [] as string[],
    selectedMetrics: [] as string[]
  });

  // Sync current article if articles change
  useEffect(() => {
    if (!currentArticle) return;
    const fresh = articles.find(a => a.id === currentArticle.id);
    if (fresh && fresh !== currentArticle) {
      setCurrentArticle(fresh || articles[0]);
    }
  }, [articles, currentArticle?.id]);
  
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateFromDoc = () => {
    if (!newArticleDoc.title) return;

    const lines = newArticleDoc.content.split('\n');
    const sections = newArticleDoc.content.split(/\n\s*---\s*\n/).filter(s => s.trim());
    const validSections = sections.length > 0 ? sections : [newArticleDoc.content];

    const generatedSlides: Slide[] = validSections.map((sec, idx) => {
      const sLines = sec.trim().split('\n');
      const title = sLines[0].replace(/^#+\s*/, '').trim() || `页面 ${idx + 1}`;
      const bodyLines = sLines.length > 1 ? sLines.slice(1) : [];
      const fullText = (title + '\n' + bodyLines.join('\n')).toLowerCase();

      let type: SlideType = 'content';
      
      // Use the same smart detection logic
      if (idx === 0) {
        type = 'title';
      } else if (idx === validSections.length - 1 || fullText.includes('谢谢') || fullText.includes('总结') || fullText.includes('end') || fullText.includes('finish')) {
        type = 'summary';
      } else if (fullText.includes('目录') || fullText.includes('contents') || fullText.includes('overview') || (bodyLines.length > 3 && bodyLines.slice(0, 5).every(l => l.length < 20))) {
        type = 'conclusion';
      } else if (/(排名|排行|top|榜单|第\d+名|胜率|权重)/i.test(fullText)) {
        type = 'ranking';
      } else if (fullText.includes('导图') || fullText.includes('架构') || fullText.includes('逻辑') || fullText.includes('mindmap')) {
        type = 'mindmap';
      }

      const rawBody = bodyLines.join('\n');
      const notes = rawBody.match(/\[备注：(.*?)\]/)?.[1] || rawBody.match(/\[备注:(.*?)\]/)?.[1] || "从对话框导入的页面。";
      const cleanBody = rawBody.replace(/\[备注[：:].*?\]/g, '').trim();

      return {
        id: `man-${Date.now()}-${idx}`,
        type,
        title,
        body: cleanBody,
        notes,
        assets: []
      };
    });

    const newArt: TheoryArticle = {
      id: `man-art-${Date.now()}`,
      title: newArticleDoc.title,
      series: newArticleDoc.series || '手动导入',
      date: new Date().toISOString().split('T')[0],
      author: '演示助手',
      slides: generatedSlides,
      relatedTags: [...newArticleDoc.selectedTags],
      relatedMetrics: [...newArticleDoc.selectedMetrics]
    };

    setArticles([newArt, ...articles]);
    setCurrentArticle(newArt);
    setCurrentSlideIndex(0);
    setIsAddingArticle(false);
    setNewArticleDoc({ title: '', series: '', content: '', selectedTags: [], selectedMetrics: [] });
  };

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, currentArticle.slides.length - 1));
  }, [currentArticle.slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable ||
        Boolean(target.closest('[contenteditable="true"]'))
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAddingArticle) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        if (e.key === ' ') e.preventDefault(); // Prevent space from scrolling
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isAddingArticle]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      presentationContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const currentSlide = currentArticle.slides[currentSlideIndex] || currentArticle.slides[0] || { id: 'fallback', type: 'title', title: '加载中...', notes: '', estimatedSeconds: 0 };

  // Article Management
  const handleDeleteArticle = (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      // Auto cancel after 3 seconds
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
      return;
    }

    const updated = articles.filter(a => a.id !== id);
    setArticles(updated);
    setDeleteConfirmId(null);

    // If we deleted the current article, switch to the first available one
    if (currentArticle.id === id) {
      const nextArticle = updated.length > 0 ? updated[0] : MOCK_DATA[0];
      setCurrentArticle(nextArticle);
      setCurrentSlideIndex(0);
    }
  };

  const handleDuplicateArticle = (article: TheoryArticle) => {
    const duplicated: TheoryArticle = {
      ...article,
      id: `copy-${Date.now()}`,
      title: `${article.title} (副本)`,
      date: new Date().toISOString().split('T')[0]
    };
    setArticles([duplicated, ...articles]);
  };

  const handleRenameArticle = (id: string, newTitle: string) => {
    setArticles(articles.map(a => a.id === id ? { ...a, title: newTitle } : a));
  };

  // Slide Management
  const handleUpdateSlide = (updatedSlide: Slide) => {
    const cleanBody = (updatedSlide.body || '').replace(/\[备注：.*?\]/g, '').trim();
    const notes = updatedSlide.notes || '';
    const title = updatedSlide.title || '';
    const estimatedSeconds = Math.ceil((title.length + cleanBody.length + notes.length) / 4);

    const fullUpdatedSlide = { ...updatedSlide, estimatedSeconds };

    const updatedSlides = [...currentArticle.slides];
    updatedSlides[currentSlideIndex] = fullUpdatedSlide;
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
    setCurrentArticle(updatedArticle);
  };

  const handleInsertLeaderboard = (traitLabel: string, role: 'Survivor' | 'Hunter', sortOrder: 'asc' | 'desc', limitGroups?: number, customMetricId?: string) => {
    const customMetric = customMetrics.find(m => m.id === customMetricId);
    const { groups } = generateLeaderboardData(characters, role, traitLabel, sortOrder, customMetric ? { traitLabels: customMetric.traitLabels } : undefined);
    const topGroups = limitGroups ? groups.slice(0, limitGroups) : groups;
    
    if (topGroups.length === 0) {
      handleUpdateSlide({
        ...currentSlide,
        type: 'ranking',
        body: '暂无该排行榜数据。',
        sourceType: 'leaderboard',
        sourceData: { role, metricLabel: traitLabel, sortOrder, limit: limitGroups, groups: [], customMetricId }
      });
      return;
    }

    const newBody = topGroups.map(g => {
      const charNames = g.characters.map((c: any) => c.name).join('、');
      return `第 ${g.rank} 名（${g.value}）：${charNames}`;
    }).join('\n');
    
    handleUpdateSlide({
      ...currentSlide,
      type: 'ranking',
      body: newBody,
      sourceType: 'leaderboard',
      sourceData: { role, metricLabel: traitLabel, sortOrder, limit: limitGroups, groups: topGroups, customMetricId }
    });
  };

  const handleInsertTag = (tag: Tag, mode: 'summary' | 'characters' | 'talents') => {
    const relatedChars = characters.filter(c => 
      c.skills?.some(s => s.tags?.includes(tag.name)) || 
      c.presence?.some(p => p.tags?.includes(tag.name))
    ).sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
    const relatedTals = talents.filter(t => t.tags?.includes(tag.name));

    let newBody = '';
    if (mode === 'summary') {
      newBody = `标签：${tag.name}\n适用阵营：${tag.affectedRole}\n关联属性：${tag.affectedStats?.join(', ') || '无'}\n关联角色：${relatedChars.length}名\n关联天赋：${relatedTals.length}个`;
    } else if (mode === 'characters') {
      const charDetails = relatedChars.map(c => {
        let skillsInfo = '';
        c.skills?.forEach(s => {
          if (s.tags?.includes(tag.name)) skillsInfo += `  - 外在特质 [${s.name}]: ${s.description.substring(0, 50).replace(/\n/g, '')}...\n`;
        });
        c.presence?.forEach(p => {
          if (p.tags?.includes(tag.name)) skillsInfo += `  - 存在感 [${p.name}]: ${p.description.substring(0, 50).replace(/\n/g, '')}...\n`;
        });
        return `- ${c.title} ${c.name}\n${skillsInfo}`;
      });
      newBody = charDetails.join('\n');
    } else if (mode === 'talents') {
      const talDetails = relatedTals.map(t => {
        return `- ${t.name}\n  - 描述: ${t.description.substring(0, 60).replace(/\n/g, '')}...${t.effect ? `\n  - 效果: ${t.effect.substring(0, 40).replace(/\n/g, '')}...` : ''}`;
      });
      newBody = talDetails.join('\n\n');
    }

    handleUpdateSlide({
      ...currentSlide,
      type: mode === 'summary' ? 'summary' : 'content',
      body: newBody,
      sourceType: 'tag',
      sourceData: { tagId: tag.id, tagName: tag.name, insertedMode: mode, relatedCharacters: relatedChars, relatedTalents: relatedTals }
    });
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: 'content',
      title: '新页面',
      body: '输入内容...',
      notes: '',
      estimatedSeconds: 10
    };
    const updatedSlides = [...currentArticle.slides];
    updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
    setCurrentArticle(updatedArticle);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (currentArticle.slides.length <= 1) return;
    
    if (!slideDeleteConfirm) {
      setSlideDeleteConfirm(true);
      setTimeout(() => setSlideDeleteConfirm(false), 3000);
      return;
    }

    const updatedSlides = currentArticle.slides.filter((_, i) => i !== currentSlideIndex);
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
    setCurrentArticle(updatedArticle);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    setSlideDeleteConfirm(false);
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? currentSlideIndex - 1 : currentSlideIndex + 1;
    if (newIdx < 0 || newIdx >= currentArticle.slides.length) return;
    
    const updatedSlides = [...currentArticle.slides];
    [updatedSlides[currentSlideIndex], updatedSlides[newIdx]] = [updatedSlides[newIdx], updatedSlides[currentSlideIndex]];
    
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
    setCurrentArticle(updatedArticle);
    setCurrentSlideIndex(newIdx);
  };

  // Export Functions
  const exportJSON = () => {
    const data = JSON.stringify(currentArticle, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArticle.title.replace(/[\\/:*?"<>|]/g, '_')}.json`;
    a.click();
  };

  const exportCurrentSlideImage = async () => {
    if (!presentationContainerRef.current) return;
    
    // Find the actual slide container (the one with the background and content)
    const slideElement = presentationContainerRef.current.querySelector('.relative.bg-white.overflow-hidden');
    if (!slideElement) return;

    try {
      // Small delay to ensure any layout updates complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(slideElement as HTMLElement, {
        quality: 1,
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff'
      });
      
      const fileName = `${currentArticle.title}_${currentSlideIndex + 1}.png`.replace(/[\\/:*?"<>|]/g, '_');
      download(dataUrl, fileName);
    } catch (err) {
      console.error('Failed to export slide image:', err);
      alert('导出图片失败，请稍后重试');
    }
  };

  const exportCurrentSlideMarkdown = () => {
    let content = `# ${currentSlide.title}\n\n`;
    
    if (currentSlide.body) {
      content += `${currentSlide.body}\n\n`;
    }
    
    if (currentSlide.bullets && currentSlide.bullets.length > 0) {
      currentSlide.bullets.forEach((b, i) => {
        content += `${i + 1}. ${b}\n`;
      });
      content += '\n';
    }

    if (currentSlide.type === 'ranking' && currentSlide.sourceData?.groups) {
      content += `## 排行榜数据 (${currentSlide.sourceData.metricLabel || '常规'})\n\n`;
      currentSlide.sourceData.groups.forEach((g: any) => {
        content += `- 第 ${g.rank} 名 (${g.value}): ${g.characters.map((c: any) => c.name).join('、')}\n`;
      });
      content += '\n';
    }

    if (currentSlide.notes) {
      content += `---\n\n> **演说笔记**:\n> ${currentSlide.notes.replace(/\n/g, '\n> ')}\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArticle.title}_第${currentSlideIndex + 1}页.md`.replace(/[\\/:*?"<>|]/g, '_');
    a.click();
  };



  const renderAssets = (slide: Slide) => {
    if (!slide.assets || slide.assets.length === 0) return null;
    return (
      <>
        {slide.assets.filter(a => a.placement === 'hero').map(a => (
          <div key={a.id} className="absolute inset-8 z-0 opacity-[0.05] pointer-events-none overflow-hidden rounded-3xl flex items-center justify-center mix-blend-multiply">
            {a.type === 'icon' ? (
              a.iconKey && IconMap[a.iconKey] ? (
                React.createElement(IconMap[a.iconKey], { className: "w-[80%] h-[80%] text-slate-900" })
              ) : a.url ? (
                <img src={a.url} alt={a.alt} className="w-[50%] h-[50%] object-contain filter grayscale" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
              ) : null
            ) : a.url ? (
              <img src={a.url} alt={a.alt} className="w-full h-full object-cover filter grayscale" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
            ) : null}
          </div>
        ))}
        <div className="absolute bottom-10 right-10 z-10 flex gap-4 pointer-events-auto">
          {slide.assets.filter(a => a.placement === 'corner').map(a => (
            <div key={a.id} className="group relative flex items-center justify-center">
              {viewMode === 'edit' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newAssets = slide.assets?.filter(asset => asset.id !== a.id);
                    handleUpdateSlide({...slide, assets: newAssets});
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md"
                  title="删除角标"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              {a.type === 'icon' ? (
                a.iconKey && IconMap[a.iconKey] ? (
                  React.createElement(IconMap[a.iconKey], { className: "w-16 h-16 text-slate-800" })
                ) : a.url ? (
                  <img src={a.url} alt={a.alt} className="w-16 h-16 object-contain filter grayscale" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
                ) : null
              ) : a.url ? (
                <img src={a.url} alt={a.alt} className="w-16 h-16 object-contain filter grayscale border border-slate-200 rounded" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
              ) : null}
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderInlineAssets = (slide: Slide) => {
    if (!slide.assets || slide.assets.length === 0) return null;
    const inlineAssets = slide.assets.filter(a => a.placement === 'inline');
    if (inlineAssets.length === 0) return null;
    const isEdit = viewMode === 'edit';
    
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 my-6 relative z-10 w-full shrink-0">
        {inlineAssets.map(a => (
          <div key={a.id} className="group relative flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
            {isEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newAssets = slide.assets?.filter(asset => asset.id !== a.id);
                  handleUpdateSlide({...slide, assets: newAssets});
                }}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md"
                title="删除资产"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {a.type === 'icon' ? (
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                {a.iconKey && IconMap[a.iconKey] ? (
                  React.createElement(IconMap[a.iconKey], { className: "w-8 h-8" })
                ) : a.url ? (
                  <img src={a.url} alt={a.alt} className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
                ) : null}
              </div>
            ) : a.url ? (
               <img src={a.url} alt={a.alt} className="w-auto h-24 md:h-32 rounded-2xl shadow-sm border border-slate-100 object-contain bg-white p-2" onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E"; }} />
            ) : null}
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{a.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // Render Slide Content
  const renderSlideContent = (slide: Slide) => {
    const baseClasses = "flex flex-col h-full p-8 md:p-16 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10";
    const isEdit = viewMode === 'edit';
    
    switch (slide.type) {
      case 'title':
        return (
          <div className={`${baseClasses} items-center justify-center text-center gap-6`}>
            {renderAssets(slide)}
            <div className="w-16 h-1 bg-slate-900 mb-4 relative z-10" />
            <div className="relative z-10 w-full">
              <EditableTitle 
                className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight" 
                value={slide.title}
                onChange={(v) => handleUpdateSlide({...slide, title: v})}
                isEdit={isEdit}
              />
            </div>
            {renderInlineAssets(slide)}
            <div className="relative z-10 w-full">
              <EditableBody 
                className="text-xl md:text-2xl text-slate-400 max-w-3xl font-light italic" 
                value={slide.body || ''}
                onChange={(v) => handleUpdateSlide({...slide, body: v})}
                isEdit={isEdit}
              />
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className={`${baseClasses} items-center justify-center text-center bg-slate-900 text-white rounded-[2rem] m-4 gap-8`}>
            {renderAssets(slide)}
            <Sparkles className="w-12 h-12 text-white/20 relative z-10" />
            <div className="relative z-10 w-full px-12">
              <EditableTitle 
                className="text-4xl md:text-5xl font-bold tracking-tight leading-snug border-white/10 focus:border-white/30" 
                value={slide.title}
                onChange={(v) => handleUpdateSlide({...slide, title: v})}
                isEdit={isEdit}
              />
            </div>
            {renderInlineAssets(slide)}
            <div className="h-px w-24 bg-white/20 relative z-10" />
            <div className="relative z-10 w-full px-12">
              <EditableBody 
                className="text-xl text-white/50 max-w-2xl italic font-serif border-white/5 focus:border-white/20" 
                value={slide.body || ''}
                onChange={(v) => handleUpdateSlide({...slide, body: v})}
                isEdit={isEdit}
              />
            </div>
          </div>
        );
      case 'conclusion':
        const tocLines = slide.body ? slide.body.split('\n').map(l => l.trim()).filter(Boolean) : ['请输入目录项...'];
        return (
          <div className={`${baseClasses} items-center justify-center bg-slate-50/50`}>
            {renderAssets(slide)}
            <div className="relative z-10 w-full mb-12">
              <EditableTitle 
                className="text-2xl md:text-3xl font-bold text-slate-400 tracking-[0.2em] uppercase text-center" 
                value={slide.title || 'CONTENTS'}
                onChange={(v) => handleUpdateSlide({...slide, title: v})}
                isEdit={isEdit}
              />
            </div>
            
            <div className="relative z-10 w-full max-w-2xl px-6 flex-1 flex flex-col justify-center">
              <div className="flex flex-col gap-4 md:gap-6 relative">
                {/* Vertical line decoration */}
                <div className="absolute left-[24px] top-4 bottom-4 w-px bg-slate-200 hidden md:block" />
                
                {tocLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-4 md:gap-6 group/toc animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm md:text-lg font-black shrink-0 z-10 shadow-lg border-4 border-white transition-transform group-hover/toc:scale-110">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 py-1 border-b border-slate-100 group-hover/toc:border-slate-900 transition-colors">
                      {isEdit && idx === 0 ? (
                        <textarea
                          value={slide.body || ''}
                          onChange={(e) => handleUpdateSlide({...slide, body: e.target.value})}
                          onKeyDown={e => e.stopPropagation()}
                          className="w-full bg-transparent outline-none text-lg md:text-2xl font-bold text-slate-800 resize-none py-2"
                          placeholder="每行一个目录项..."
                          rows={1}
                        />
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight block hover:translate-x-1 transition-transform cursor-default">
                          {line}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderInlineAssets(slide)}
            {/* Batch Edit Helper */}
            {isEdit && (
               <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-slate-400 mb-1 font-bold">在该页正文输入多行内容以生成目录</p>
               </div>
            )}
          </div>
        );
      case 'content':
        const hasExplicitBullets = slide.bullets && slide.bullets.length > 0;
        const lines = slide.body ? slide.body.split('\n').map(l => l.trim()).filter(Boolean) : [];
        const isListView = hasExplicitBullets || (lines.length > 1 && lines.every(l => l.length < 50));

        return (
          <div className={`${baseClasses} gap-8`}>
            {renderAssets(slide)}
            <div className={`relative z-10 w-full ${isListView ? 'border-l-8 border-slate-900 pl-6' : ''}`}>
              <EditableTitle 
                className={`text-3xl md:text-4xl font-bold text-slate-900 ${!isListView ? 'text-center' : ''}`} 
                value={slide.title}
                onChange={(v) => handleUpdateSlide({...slide, title: v})}
                isEdit={isEdit}
              />
            </div>
            {renderInlineAssets(slide)}
            <div className={`flex-1 relative z-10 w-full ${isListView ? 'space-y-6' : 'flex items-center justify-center'}`}>
              {isListView ? (
                <div className="w-full">
                  <EditableBody 
                    className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap mb-6 text-left" 
                    value={slide.body || ''}
                    onChange={(v) => handleUpdateSlide({...slide, body: v})}
                    isEdit={isEdit}
                  />
                  {hasExplicitBullets && (
                    <ul className="space-y-4">
                      {slide.bullets!.map((b, i) => (
                        <li key={i} className="flex gap-4 text-lg text-slate-500 items-start group">
                          <span className="text-slate-900 font-mono font-bold mt-1 shrink-0">{i + 1}.</span>
                          <div className="flex-1 flex gap-2">
                             <input 
                               value={b}
                               onChange={(e) => {
                                 const newBullets = [...slide.bullets!];
                                 newBullets[i] = e.target.value;
                                 handleUpdateSlide({...slide, bullets: newBullets});
                               }}
                               className="flex-1 bg-transparent border-b border-transparent focus:border-slate-200 outline-none"
                             />
                             {isEdit && (
                               <button 
                                 onClick={() => {
                                   const newBullets = slide.bullets!.filter((_, idx) => idx !== i);
                                   handleUpdateSlide({...slide, bullets: newBullets});
                                 }}
                                 className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             )}
                          </div>
                        </li>
                      ))}
                      {isEdit && (
                        <button 
                          onClick={() => handleUpdateSlide({...slide, bullets: [...(slide.bullets || []), '新要点']})}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 p-2 mt-4 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> 添加要点
                        </button>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <EditableBody 
                  className="text-2xl text-slate-700 leading-relaxed max-w-4xl text-center font-medium" 
                  value={slide.body || ''}
                  onChange={(v) => handleUpdateSlide({...slide, body: v})}
                  isEdit={isEdit}
                />
              )}
            </div>
          </div>
        );
      case 'ranking':
        return (
          <div className={`${baseClasses} gap-8 overflow-y-auto no-scrollbar`}>
            {renderAssets(slide)}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div className="flex-1">
                <EditableTitle 
                  className="text-3xl md:text-4xl font-bold text-slate-900 text-left" 
                  value={slide.title}
                  onChange={(v) => handleUpdateSlide({...slide, title: v})}
                  isEdit={isEdit}
                />
              </div>
              {slide.sourceData?.metricLabel && (
                <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-800 text-xs font-mono font-bold rounded-full">
                  {slide.sourceData.metricLabel} {slide.sourceData.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            {renderInlineAssets(slide)}
            <div className="flex-1 space-y-2 relative z-10">
              {slide.sourceData?.groups ? (
                slide.sourceData.groups.map((group: any, i: number) => (
                  <div key={i} className="flex items-center py-2 px-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all hover:bg-white hover:shadow-md group/item">
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-mono font-black text-amber-200/50 w-8">{group.rank}</span>
                      <div className="flex flex-wrap gap-2">
                        {group.characters.map((c: any) => (
                           c.imageUrl ? (
                             <img key={c.id} src={c.imageUrl} alt={c.name} title={c.name} className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-sm border-[3px] border-white bg-slate-100" />
                           ) : (
                             <div key={c.id} className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500 border-[3px] border-white shadow-sm" title={c.name}>
                               {c.name.slice(0, 2)}
                             </div>
                           )
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-3xl font-mono font-black text-slate-900">{group.value}</span>
                    {isEdit && (
                      <button 
                        onClick={() => {
                          const newGroups = slide.sourceData.groups.filter((_: any, idx: number) => idx !== i);
                          handleUpdateSlide({...slide, sourceData: {...slide.sourceData, groups: newGroups}});
                        }}
                        className="opacity-0 group-hover/item:opacity-100 ml-4 p-2 text-red-300 hover:text-red-500 transition-opacity"
                        title="移除此项"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <EditableBody 
                  className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap text-left" 
                  value={slide.body || ''}
                  onChange={(v) => handleUpdateSlide({...slide, body: v})}
                  isEdit={isEdit}
                />
              )}
            </div>
          </div>
        );
      case 'mindmap': {
        const mindmap = slide.mindmapData || (slide.bullets && slide.bullets.length > 0 
          ? { branches: slide.bullets.map((b, i) => ({ id: `fallback-${i}`, title: b, children: [] })) }
          : { branches: [] });
        const branches = mindmap.branches;
        const leftBranches = branches.filter((_, i) => i % 2 !== 0);
        const rightBranches = branches.filter((_, i) => i % 2 === 0);

        const handleUpdateBranchTitle = (id: string, newTitle: string) => {
          const newMindmap = { 
            branches: branches.map(b => b.id === id ? { ...b, title: newTitle } : b) 
          };
          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
        };

        const handleUpdateChildTitle = (branchId: string, childIdx: number, newTitle: string) => {
          const newMindmap = {
            branches: branches.map(b => {
              if (b.id !== branchId) return b;
              const newChildren = [...(b.children || [])];
              newChildren[childIdx] = newTitle;
              return { ...b, children: newChildren };
            })
          };
          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
        };

        const handleDeleteBranch = (id: string) => {
          const newMindmap = { branches: branches.filter(b => b.id !== id) };
          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
        };
        
        const handleAddBranch = () => {
          const newBranch = { id: `branch-${Date.now()}`, title: '新分支', children: [] };
          const newMindmap = { branches: [...branches, newBranch] };
          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
        };

        const handleAddChild = (branchId: string) => {
          const newMindmap = {
            branches: branches.map(b => b.id === branchId ? { ...b, children: [...(b.children || []), '新节点'] } : b)
          };
          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
        };

        return (
          <div className={`${baseClasses} items-center justify-center bg-slate-50 overflow-hidden`}>
            {renderAssets(slide)}
            <div className="flex items-center gap-4 mb-4 relative z-10 shrink-0">
               <h2 className="text-sm text-slate-400 font-bold tracking-widest uppercase">思维导图</h2>
               {isEdit && (
                 <button 
                   onClick={handleAddBranch}
                   className="p-1 px-3 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-1 shadow-sm"
                 >
                   <Plus className="w-3 h-3" /> 添加分支
                 </button>
               )}
            </div>
            <div className="relative z-10 w-full flex items-center justify-center overflow-auto py-4 flex-1 no-scrollbar min-h-0">
              <div className="flex items-center justify-center gap-8 w-max px-8">
                {/* Left Branches */}
                {leftBranches.length > 0 && (
                  <div className="flex flex-col gap-4 relative items-end">
                    <div className="absolute -right-8 top-[50%] bottom-[50%] w-8 border-t-2 border-slate-200 -translate-y-[1px]" />
                    <div className="absolute -right-8 top-0 bottom-0 border-r-2 border-slate-200 transform translate-y-1/2 -translate-y-1/2" style={{ height: `calc(100% - ${Math.max(0, (leftBranches.length - 1) * 2)}rem)`, top: '1rem' }} />
                    {leftBranches.map(branch => (
                      <div key={branch.id} className="relative flex items-start pr-8 gap-6 flex-row-reverse group/branch">
                        <div className="absolute right-0 w-8 border-t-2 border-slate-200 top-1/2 -translate-y-[1px]" />
                        <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm z-20 whitespace-nowrap self-center relative max-w-[200px]">
                          {isEdit ? (
                            <div className="flex items-center gap-2">
                               <button onClick={(e) => { e.stopPropagation(); handleAddChild(branch.id); }} className="opacity-0 group-hover/branch:opacity-100 p-1 text-slate-400 hover:text-slate-900 transition-opacity" title="添加子节点">
                                <Plus className="w-3 h-3" />
                              </button>
                              <textarea 
                                value={branch.title}
                                onChange={(e) => handleUpdateBranchTitle(branch.id, e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                                className="text-base font-bold text-slate-800 bg-transparent border-none outline-none text-right w-full resize-none p-0"
                                rows={1}
                              />
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }} className="opacity-0 group-hover/branch:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-slate-800 break-words whitespace-normal inline-block text-right">{branch.title}</span>
                          )}
                        </div>
                        {branch.children && branch.children.length > 0 && (
                          <div className="flex flex-col gap-2 relative self-center items-end">
                            <div className="absolute -right-6 top-[50%] bottom-[50%] w-6 border-t-2 border-slate-200 -translate-y-[1px]" />
                            <div className="absolute -right-6 top-0 bottom-0 border-r-2 border-slate-200 transform translate-y-1/2 -translate-y-1/2" style={{ height: `calc(100% - ${Math.max(0, (branch.children.length - 1) * 0.5)}rem)`, top: '0.4rem' }} />
                            {branch.children.map((child, cIdx) => (
                              <div key={cIdx} className="relative flex items-center pr-6 group/child">
                                <div className="absolute right-0 w-6 border-t-2 border-slate-200 top-1/2 -translate-y-[1px]" />
                                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl z-20 whitespace-normal text-slate-600 max-w-[150px]">
                                  {isEdit ? (
                                    <div className="flex items-center gap-1">
                                      <textarea 
                                        value={child}
                                        onChange={(e) => handleUpdateChildTitle(branch.id, cIdx, e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="text-xs font-medium bg-transparent border-none outline-none text-right w-full resize-none p-0"
                                        rows={1}
                                      />
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newChildren = branch.children!.filter((_, idx) => idx !== cIdx);
                                          const newMindmap = { branches: branches.map(b => b.id === branch.id ? { ...b, children: newChildren } : b) };
                                          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
                                        }} 
                                        className="opacity-0 group-hover/child:opacity-100 p-0.5 text-red-300 hover:text-red-500 transition-opacity"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-medium">{child}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Center Node */}
                <div className="px-6 py-4 bg-slate-900 text-white rounded-[2rem] shadow-xl z-20 relative min-w-[150px] max-w-[300px] text-center border-4 border-slate-50 flex-shrink-0">
                  {isEdit ? (
                    <textarea 
                      value={slide.title}
                      onChange={(e) => handleUpdateSlide({ ...slide, title: e.target.value })}
                      onKeyDown={e => e.stopPropagation()}
                      className="text-xl font-bold bg-transparent border-none outline-none text-center w-full resize-none p-0 text-white"
                      rows={1}
                    />
                  ) : (
                    <span className="text-xl font-bold block break-words whitespace-normal leading-snug">{slide.title}</span>
                  )}
                </div>
                
                {/* Right Branches */}
                {rightBranches.length > 0 && (
                  <div className="flex flex-col gap-4 relative items-start">
                    <div className="absolute -left-8 top-[50%] bottom-[50%] w-8 border-t-2 border-slate-200 -translate-y-[1px]" />
                    <div className="absolute -left-8 top-0 bottom-0 border-l-2 border-slate-200 transform translate-y-1/2 -translate-y-1/2" style={{ height: `calc(100% - ${Math.max(0, (rightBranches.length - 1) * 2)}rem)`, top: '1rem' }} />
                    {rightBranches.map(branch => (
                      <div key={branch.id} className="relative flex items-start pl-8 gap-6 group/branch">
                        <div className="absolute left-0 w-8 border-t-2 border-slate-200 top-1/2 -translate-y-[1px]" />
                        <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm z-20 whitespace-nowrap self-center relative max-w-[200px]">
                          {isEdit ? (
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }} className="opacity-0 group-hover/branch:opacity-100 p-1 text-red-300 hover:text-red-500 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <textarea 
                                value={branch.title}
                                onChange={(e) => handleUpdateBranchTitle(branch.id, e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                                className="text-base font-bold text-slate-800 bg-transparent border-none outline-none text-left w-full resize-none p-0"
                                rows={1}
                              />
                              <button onClick={(e) => { e.stopPropagation(); handleAddChild(branch.id); }} className="opacity-0 group-hover/branch:opacity-100 p-1 text-slate-400 hover:text-slate-900 transition-opacity" title="添加子节点">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-slate-800 break-words whitespace-normal inline-block">{branch.title}</span>
                          )}
                        </div>
                        {branch.children && branch.children.length > 0 && (
                          <div className="flex flex-col gap-2 relative self-center items-start">
                            <div className="absolute -left-6 top-[50%] bottom-[50%] w-6 border-t-2 border-slate-200 -translate-y-[1px]" />
                            <div className="absolute -left-6 top-0 bottom-0 border-l-2 border-slate-200 transform translate-y-1/2 -translate-y-1/2" style={{ height: `calc(100% - ${Math.max(0, (branch.children.length - 1) * 0.5)}rem)`, top: '0.4rem' }} />
                            {branch.children.map((child, cIdx) => (
                              <div key={cIdx} className="relative flex items-center pl-6 group/child">
                                <div className="absolute left-0 w-6 border-t-2 border-slate-200 top-1/2 -translate-y-[1px]" />
                                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl z-20 whitespace-normal text-slate-600 max-w-[150px]">
                                  {isEdit ? (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newChildren = branch.children!.filter((_, idx) => idx !== cIdx);
                                          const newMindmap = { branches: branches.map(b => b.id === branch.id ? { ...b, children: newChildren } : b) };
                                          handleUpdateSlide({ ...slide, mindmapData: newMindmap });
                                        }} 
                                        className="opacity-0 group-hover/child:opacity-100 p-0.5 text-red-300 hover:text-red-500 transition-opacity"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                      <textarea 
                                        value={child}
                                        onChange={(e) => handleUpdateChildTitle(branch.id, cIdx, e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="text-xs font-medium bg-transparent border-none outline-none text-left w-full resize-none p-0"
                                        rows={1}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs font-medium">{child}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {renderInlineAssets(slide)}
            {slide.body && <p className="mt-4 text-slate-500 max-w-2xl text-center relative z-10 shrink-0 text-xs">{slide.body}</p>}
          </div>
        );
      }
      default:
        return (
          <div className={`${baseClasses} items-center justify-center text-center gap-6`}>
            {renderAssets(slide)}
            <h2 className="text-4xl font-bold text-slate-900 relative z-10">{slide.title}</h2>
            {renderInlineAssets(slide)}
            <p className="text-xl text-slate-500 whitespace-pre-wrap relative z-10">{slide.body}</p>
          </div>
        );
    }
  };

  // Helper to get real data objects
  const getSelectedTagData = () => {
    const results: { tag: Tag, matchKey: string }[] = [];
    currentArticle.relatedTags?.forEach(tagKey => {
      const tag = availableTags.find(t => t.id === tagKey || t.name === tagKey);
      if (tag) {
        results.push({ tag, matchKey: tagKey });
      }
    });
    return results;
  };

  const getSelectedMetricData = () => {
    const results: { trait: typeof availableTraits[0], matchKey: string }[] = [];
    currentArticle.relatedMetrics?.forEach(metricKey => {
      const trait = availableTraits.find(t => t.id === metricKey || t.label === metricKey);
      if (trait) {
        results.push({ trait, matchKey: metricKey });
      }
    });
    return results;
  };

  const getSelectedCustomMetricData = () => {
    const results: { metric: typeof customMetrics[0], matchKey: string }[] = [];
    currentArticle.relatedMetrics?.forEach(metricKey => {
      const custom = customMetrics.find(m => m.id === metricKey || m.name === metricKey);
      if (custom) {
        results.push({ metric: custom, matchKey: metricKey });
      }
    });
    return results;
  };

  return (
    <div className={`flex flex-col gap-4 h-full min-h-[600px] text-slate-900 font-sans p-2 lg:p-0`}>
      {/* Top Header Mode Switcher */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4" /> 理论演示工作台
          </h2>
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            {[
              { id: 'edit', label: '制作模式', icon: <Edit className="w-3 h-3" /> },
              { id: 'presentation', label: '演示模式', icon: <Monitor className="w-3 h-3" /> },
            ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === mode.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 mr-2">
              <button 
                onClick={exportCurrentSlideImage}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 hover:bg-white rounded-lg transition-all"
                title="导出当前页为图片"
              >
                <Monitor className="w-3 h-3" /> 导图
              </button>
              <button 
                onClick={exportCurrentSlideMarkdown}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 hover:bg-white rounded-lg transition-all"
                title="导出当前页为 Markdown"
              >
                <FileText className="w-3 h-3" /> 导文
              </button>
            </div>
            <button 
              onClick={exportJSON}
              className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> 下载全稿 JSON
            </button>
          </div>
        </div>
      {/* End Header */}

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
        {/* Sidebar: Article List */}
        {viewMode === 'edit' && (
          <aside className={`flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden gap-4 shrink-0 transition-all duration-300 ${isDraftCollapsed ? 'w-24 p-4 items-center' : 'w-full lg:w-80 p-6'}`}>
            <div className="flex items-center justify-between w-full">
              {!isDraftCollapsed ? (
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Edit className="w-3 h-3" /> 草稿箱
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">输入原始内容自动识别</p>
                </div>
              ) : (
                <Edit className="w-5 h-5 text-slate-300" />
              )}
              <div className={`flex items-center ${isDraftCollapsed ? 'flex-col gap-4' : 'gap-2'}`}>
                <button 
                  onClick={() => setIsDraftCollapsed(!isDraftCollapsed)}
                  className="p-1.5 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                  title={isDraftCollapsed ? "展开草稿箱" : "收起草稿箱"}
                >
                  {isDraftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {!isDraftCollapsed && (
              <div className="flex flex-col flex-1 overflow-hidden gap-4">
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <div className="relative group flex-1">
                    <textarea 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="# 演示标题&#10;核心内容第一行&#10;核心内容第二行&#10;[备注：这是演说备注]&#10;&#10;---&#10;&#10;# 下一页标题&#10;..."
                      className="w-full h-full bg-slate-50 rounded-2xl p-4 text-xs font-medium text-slate-700 border-2 border-transparent focus:border-slate-200 focus:bg-white outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300"
                    />
                    <button 
                      onClick={() => setShowRecognitionGuide(!showRecognitionGuide)}
                      className="absolute bottom-3 right-3 p-1.5 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-900 rounded-lg flex items-center gap-1.5"
                    >
                      <Info className="w-3 h-3" />
                      <span className="text-[9px] font-bold">识别指南</span>
                    </button>
                  </div>

                  {showRecognitionGuide && (
                    <div className="p-4 bg-slate-900 rounded-2xl text-white text-[10px] space-y-3 mb-2 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">内容识别模板</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setShowRecognitionGuide(false)} />
                      </div>
                      <div className="space-y-2">
                        <p><span className="text-blue-400 font-mono"># 页标题</span>：每段首行作为标题</p>
                        <p><span className="text-blue-400 font-mono">---</span>：三个短横线实现强制分页</p>
                        <p><span className="text-blue-400 font-mono">目录 [Contents]</span>：触发目录/结论版式</p>
                        <p><span className="text-blue-400 font-mono">榜单 [Ranking]</span>：触发排名/权重榜单</p>
                        <p><span className="text-blue-400 font-mono">导图 [Mindmap]</span>：由结构化短语触发思维导图</p>
                        <p><span className="text-blue-400 font-mono">[备注：...]</span>：录制在页面背后的演说词</p>
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={!rawText.trim()}
                    onClick={generateArticleFromDraft}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-widest">智能生成文稿</span>
                  </button>
                </div>

                <div className="h-px bg-slate-100" />
                
                <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar w-full py-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 px-1">历史草稿 ({articles.length})</span>
                    <button onClick={() => setIsAddingArticle(true)} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="手动导入"><FilePlus className="w-3 h-3" /></button>
                  </div>
              {articles.map(article => (
                <div key={article.id} className="group relative">
                  <button
                    onClick={() => {
                      setCurrentArticle(article);
                      setCurrentSlideIndex(0);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${isDraftCollapsed ? 'flex justify-center px-1' : ''} ${
                      currentArticle.id === article.id 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                    }`}
                    title={isDraftCollapsed ? article.title : undefined}
                  >
                    {!isDraftCollapsed ? (
                      <>
                        <span className="block text-[10px] opacity-70 font-mono mb-1">{article.series}</span>
                        <span className="text-sm font-bold leading-tight line-clamp-2">{article.title}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold truncate leading-tight w-full text-center">{article.title.slice(0, 2)}</span>
                    )}
                  </button>
                    <div className={`absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${isDraftCollapsed ? 'scale-110 translate-x-2 -translate-y-2' : ''}`}>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDuplicateArticle(article); }}
                      className="p-1 px-2 bg-slate-800 backdrop-blur rounded-lg text-white/50 hover:text-white transition-all shadow-md"
                      title="克隆副本"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteArticle(article.id); 
                      }}
                      className={`p-1 px-2 backdrop-blur rounded-lg transition-all shadow-md flex items-center justify-center ${
                        deleteConfirmId === article.id 
                          ? 'bg-red-500 text-white animate-pulse scale-110' 
                          : 'bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white'
                      }`}
                      title={deleteConfirmId === article.id ? "再次点击确认删除" : "删除文稿"}
                    >
                      {deleteConfirmId === article.id ? (
                        <X className="w-3.5 h-3.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col gap-4`}>
          {/* Top Bar for Actions & Navigation */}
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-3 rounded-[2rem] border border-white/40 shadow-sm shrink-0">
             <div className="flex items-center gap-4 px-4 overflow-hidden">
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-600 truncate max-w-[120px] md:max-w-xs">{currentArticle.title}</span>
                <span className="w-px h-3 bg-slate-200 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0">
                  {currentSlideIndex + 1} / {currentArticle.slides.length}
                </span>
             </div>

             <div className="flex items-center gap-2">
                {viewMode === 'presentation' && (
                  <div className="flex bg-slate-50 p-1 rounded-xl mr-2">
                    <button
                      onClick={() => setAspectRatio('16/9')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === '16/9' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >16:9</button>
                    <button
                      onClick={() => setAspectRatio('9/16')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === '9/16' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >9:16</button>
                  </div>
                )}
                
                {viewMode === 'edit' && (
                   <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 mr-2">
                      <button onClick={() => handleMoveSlide('up')} disabled={currentSlideIndex === 0} className="p-2 hover:bg-slate-50 text-slate-400 disabled:opacity-20" title="上移"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleMoveSlide('down')} disabled={currentSlideIndex === currentArticle.slides.length - 1} className="p-2 hover:bg-slate-50 text-slate-400 disabled:opacity-20" title="下移"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-4 bg-slate-100 mx-1" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide();
                        }} 
                        className={`p-2 transition-all rounded-lg overflow-hidden flex items-center gap-2 group/del-slide ${
                          slideDeleteConfirm ? 'bg-red-500 text-white ring-2 ring-red-200 animate-pulse w-auto px-3' : 'hover:bg-red-50 text-red-400 w-10'
                        }`} 
                        title="删除本页"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        {slideDeleteConfirm && <span className="text-[10px] font-extrabold whitespace-nowrap">确认删除</span>}
                      </button>
                      <button onClick={handleAddSlide} className="p-2 hover:bg-slate-50 text-slate-900 flex items-center gap-2 px-3" title="添加新页"><Plus className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">加页</span></button>
                   </div>
                )}

                <div className="flex items-center gap-2">
                   <button 
                     onClick={prevSlide}
                     disabled={currentSlideIndex === 0}
                     className="p-1.5 px-3 md:p-2 md:px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                     title="上一页"
                   >
                     <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                     <span className="hidden lg:inline text-[10px] font-bold tracking-widest">上一页</span>
                   </button>
                   <button 
                     onClick={nextSlide}
                     disabled={currentSlideIndex === currentArticle.slides.length - 1}
                     className="p-1.5 px-4 md:p-2 md:px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                     title="下一页"
                   >
                     <span className="hidden sm:inline text-xs font-bold tracking-widest">下一页</span>
                     <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>

          {/* Fullscreen Wrapper Container */}
          <div 
            ref={presentationContainerRef} 
            className={`flex flex-col flex-1 gap-2 bg-[#f8fafc] w-full mx-auto relative ${viewMode === 'presentation' && aspectRatio === '9/16' ? 'max-w-[45vh]' : ''}`}
          >
            {/* Center the slide if in presentation mode */}
            <div className={`flex-1 flex items-center justify-center w-full h-full relative`}>
              {viewMode === 'presentation' && (
                <div className="absolute inset-y-0 left-[-4rem] flex flex-col items-center justify-center gap-4 z-40">
                  <button 
                    onClick={prevSlide}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 shadow-lg transition-all"
                    title="上一页"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>
              )}
              {viewMode === 'presentation' && (
                <div className="absolute inset-y-0 right-[-4rem] flex flex-col items-center justify-center gap-4 z-40">
                  <button 
                    onClick={nextSlide}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 shadow-lg transition-all mb-4"
                    title="下一页"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={toggleFullScreen}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 shadow-lg transition-all"
                    title="全屏预览"
                  >
                    <Maximize2 className="w-6 h-6" />
                  </button>
                </div>
              )}
              <div 
                className={`relative bg-white overflow-hidden flex items-center justify-center transition-all duration-700 ease-in-out ${viewMode === 'presentation' ? 'shadow-2xl rounded-[1rem]' : 'w-full h-full rounded-[2.5rem] border border-slate-100 shadow-xl'} group`}
                style={viewMode === 'presentation' ? { aspectRatio: aspectRatio === '16/9' ? '16/9' : '9/16', width: '100%', maxHeight: '100%' } : {}}
              >
              {/* The actual slide content */}
              <div className="w-full h-full relative z-0">
                {renderSlideContent(currentSlide)}
              </div>

                {/* Inline Editing Overlay */}
                {viewMode === 'edit' && (
                  <div className="absolute inset-0 z-10 p-8 flex flex-col pointer-events-none">
                    <div className="mt-auto ml-auto pointer-events-auto">
                      <button 
                        onClick={() => handleUpdateSlide({...currentSlide, body: ''})}
                        className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all shadow-sm flex items-center justify-center border border-red-500/20"
                        title="清空内容"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              {/* Slide Overlay Info */}
              <div className="absolute bottom-10 left-10 flex items-center gap-4 z-30 pointer-events-none">
                <span className="px-4 py-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-2xl text-xs font-bold tracking-widest text-slate-400">
                  {currentSlideIndex + 1} / {currentArticle.slides.length}
                </span>
              </div>
              
              {viewMode === 'edit' && (
                <div className="absolute top-10 right-10 flex items-center gap-2 z-30 pointer-events-auto">
                  <button 
                    onClick={toggleFullScreen}
                    className="p-4 bg-white/80 hover:bg-white backdrop-blur shadow-sm rounded-full text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                    title="全屏预览"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls Footer Removed - navigation moved to top bar */}
          </div>
        </div>

        {/* Sidebar: Editor / Info */}
        {viewMode === 'edit' && (
          <aside className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto no-scrollbar">
            {/* Editor Console */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Edit className="w-3 h-3" /> 环节编辑器
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">版式类型</label>
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
                      {[
                        { id: 'title', label: '标题页', icon: Layout },
                        { id: 'conclusion', label: '目录页', icon: List },
                        { id: 'content', label: '内容页', icon: FileText },
                        { id: 'ranking', label: '榜单页', icon: Trophy },
                        { id: 'mindmap', label: '思维导图', icon: Zap },
                        { id: 'summary', label: '总结页', icon: Sparkles },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => handleUpdateSlide({...currentSlide, type: type.id as SlideType})}
                          className={`px-2 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-2 ${
                            (currentSlide.type === type.id) 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{currentSlide.type === 'mindmap' ? '中心主题' : '环节标题'}</label>
                    <input 
                      type="text" 
                      value={currentSlide.title}
                      onChange={(e) => handleUpdateSlide({...currentSlide, title: e.target.value})}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>

                  {currentSlide.type === 'mindmap' ? (() => {
                    const mindmap = currentSlide.mindmapData || (currentSlide.bullets && currentSlide.bullets.length > 0 
                      ? { branches: currentSlide.bullets.map((b, i) => ({ id: `fallback-${i}`, title: b, children: [] })) }
                      : { branches: [
                          { id: `b-${Date.now()}-1`, title: '分支一', children: [] },
                          { id: `b-${Date.now()}-2`, title: '分支二', children: [] },
                          { id: `b-${Date.now()}-3`, title: '分支三', children: [] }
                        ] });

                    const updateMindmap = (newMindmap: MindmapData) => {
                      handleUpdateSlide({...currentSlide, mindmapData: newMindmap});
                    };

                    const handleAddBranch = () => {
                      updateMindmap({ branches: [...mindmap.branches, { id: `b-${Date.now()}`, title: '新分支', children: [] }] });
                    };

                    const handleRemoveBranch = (id: string) => {
                      updateMindmap({ branches: mindmap.branches.filter(b => b.id !== id) });
                    };

                    const handleUpdateBranch = (id: string, title: string) => {
                      updateMindmap({ branches: mindmap.branches.map(b => b.id === id ? { ...b, title } : b) });
                    };

                    const handleAddChild = (branchId: string) => {
                      updateMindmap({ branches: mindmap.branches.map(b => b.id === branchId ? { ...b, children: [...(b.children || []), '新节点'] } : b) });
                    };

                    const handleRemoveChild = (branchId: string, idx: number) => {
                      updateMindmap({ branches: mindmap.branches.map(b => {
                        if (b.id !== branchId) return b;
                        const newChildren = [...(b.children || [])];
                        newChildren.splice(idx, 1);
                        return { ...b, children: newChildren };
                      }) });
                    };

                    const handleUpdateChild = (branchId: string, idx: number, val: string) => {
                      updateMindmap({ branches: mindmap.branches.map(b => {
                        if (b.id !== branchId) return b;
                        const newChildren = [...(b.children || [])];
                        newChildren[idx] = val;
                        return { ...b, children: newChildren };
                      }) });
                    };

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">思维导图结构 (1级分支及子节点)</label>
                          <button onClick={handleAddBranch} className="p-1 px-2 text-xs bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors">
                            <Plus className="w-3 h-3" /> 一级分支
                          </button>
                        </div>
                        <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          {mindmap.branches.map(branch => (
                            <div key={branch.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                <input 
                                  value={branch.title} 
                                  onChange={e => handleUpdateBranch(branch.id, e.target.value)} 
                                  onKeyDown={e => e.stopPropagation()}
                                  className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none border-b border-transparent focus:border-slate-300"
                                  placeholder="一级分支" 
                                />
                                <button onClick={() => handleAddChild(branch.id)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="添加二级节点">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleRemoveBranch(branch.id)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-500 transition-colors" title="删除">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              {branch.children && branch.children.length > 0 && (
                                <div className="pl-4 space-y-2 relative">
                                  <div className="absolute left-[3px] top-0 bottom-0 border-l border-slate-200" />
                                  {branch.children.map((child, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-2 relative pl-3">
                                      <div className="absolute left-0 top-1/2 w-3 border-t border-slate-200" />
                                      <input 
                                        value={child}
                                        onChange={e => handleUpdateChild(branch.id, cIdx, e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="flex-1 bg-slate-50 text-xs text-slate-600 px-2 py-1 rounded focus:outline-none border border-transparent focus:border-slate-300 focus:bg-white"
                                        placeholder="二级节点"
                                      />
                                      <button onClick={() => handleRemoveChild(branch.id, cIdx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="删除节点">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {mindmap.branches.length === 0 && (
                            <div className="text-center py-6 text-xs text-slate-400 font-bold tracking-widest uppercase">
                              暂无分支
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">正文内容 / 数据列表</label>
                      <textarea 
                        value={currentSlide.body || ''}
                        onChange={(e) => handleUpdateSlide({...currentSlide, body: e.target.value})}
                        onKeyDown={e => e.stopPropagation()}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            
            {/* Related Research */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 overflow-auto flex flex-col gap-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> 研究资产引用
              </h3>
              
              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-blue-300"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [type, id] = e.target.value.split(':');
                    const updatedArticle = { ...currentArticle };
                    if (type === 'tag') {
                       updatedArticle.relatedTags = Array.from(new Set([...(updatedArticle.relatedTags || []), id]));
                    } else if (type === 'metric' || type === 'custom') {
                       updatedArticle.relatedMetrics = Array.from(new Set([...(updatedArticle.relatedMetrics || []), id]));
                    }
                    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">+ 添加可用资产...</option>
                  <optgroup label="标签 (Tags)">
                    {availableTags.filter(t => !currentArticle.relatedTags?.includes(t.id)).map(t => (
                      <option key={`tag:${t.id}`} value={`tag:${t.id}`}>{t.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="常规指标 (Traits)">
                    {availableTraits.filter(t => !currentArticle.relatedMetrics?.includes(t.id)).map(t => (
                      <option key={`metric:${t.id}`} value={`metric:${t.id}`}>{t.label} ({t.role})</option>
                    ))}
                  </optgroup>
                  <optgroup label="自定义综合指标 (Custom)">
                    {customMetrics.filter(m => !(currentArticle.relatedMetrics?.includes(m.id) || currentArticle.relatedMetrics?.includes(m.name))).map(m => (
                      <option key={`custom:${m.id}`} value={`custom:${m.id}`}>{m.name} ({m.role})</option>
                    ))}
                  </optgroup>
                </select>

                <div className="flex items-center justify-between px-1 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">导入排序</span>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button 
                      onClick={() => setImportSortOrder('asc')}
                      className={`px-3 py-0.5 text-[10px] font-bold rounded-md transition-all ${importSortOrder === 'asc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      升序
                    </button>
                    <button 
                      onClick={() => setImportSortOrder('desc')}
                      className={`px-3 py-0.5 text-[10px] font-bold rounded-md transition-all ${importSortOrder === 'desc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      降序
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {getSelectedTagData().map(({ tag, matchKey }) => (
                  <div key={`${tag.id}-${matchKey}`} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-bold text-blue-900">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-300 font-mono">TAG</span>
                        <button 
                          onClick={() => {
                            const updatedArticle = { ...currentArticle, relatedTags: (currentArticle.relatedTags || []).filter(k => k !== matchKey) };
                            setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                          }}
                          className="text-blue-300 hover:text-red-500 transition-colors"
                          title="移除资产"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleInsertTag(tag, 'summary')} className="flex-1 py-1.5 bg-white hover:bg-blue-50 text-[10px] font-bold text-blue-600 rounded drop-shadow-sm transition-all border border-blue-100">
                        插入摘要
                      </button>
                      <button onClick={() => handleInsertTag(tag, 'characters')} className="flex-1 py-1.5 bg-white hover:bg-blue-50 text-[10px] font-bold text-blue-600 rounded drop-shadow-sm transition-all border border-blue-100">
                        插入角色
                      </button>
                      <button onClick={() => handleInsertTag(tag, 'talents')} className="flex-1 py-1.5 bg-white hover:bg-blue-50 text-[10px] font-bold text-blue-600 rounded drop-shadow-sm transition-all border border-blue-100">
                        插入天赋
                      </button>
                    </div>
                  </div>
                ))}

                {getSelectedMetricData().map(({ trait, matchKey }) => (
                  <div key={`${trait.id}-${matchKey}`} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-bold text-amber-900">{trait.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-300 font-mono">{trait.role}</span>
                        <button 
                          onClick={() => {
                            const updatedArticle = { ...currentArticle, relatedMetrics: (currentArticle.relatedMetrics || []).filter(k => k !== matchKey) };
                            setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                          }}
                          className="text-amber-300 hover:text-red-500 transition-colors"
                          title="移除资产"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleInsertLeaderboard(trait.label, trait.role as 'Survivor' | 'Hunter', 'desc', 5)} className="flex-1 py-1.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-amber-700 rounded drop-shadow-sm transition-all border border-amber-100">
                          前5降序
                        </button>
                        <button onClick={() => handleInsertLeaderboard(trait.label, trait.role as 'Survivor' | 'Hunter', 'asc', 5)} className="flex-1 py-1.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-amber-700 rounded drop-shadow-sm transition-all border border-amber-100">
                          前5升序
                        </button>
                      </div>
                      <button onClick={() => handleInsertLeaderboard(trait.label, trait.role as 'Survivor' | 'Hunter', importSortOrder)} className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-[10px] font-bold text-white rounded shadow-sm transition-all border border-amber-500">
                        {`导入完整排行榜 (${importSortOrder === 'asc' ? '升序' : '降序'})`}
                      </button>
                    </div>
                  </div>
                ))}

                {getSelectedCustomMetricData().map(({ metric, matchKey }) => (
                  <div key={`${metric.id}-${matchKey}`} className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-bold text-purple-900">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-purple-300 font-mono">{metric.role}</span>
                        <button 
                          onClick={() => {
                            const updatedArticle = { ...currentArticle, relatedMetrics: (currentArticle.relatedMetrics || []).filter(k => k !== matchKey) };
                            setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                          }}
                          className="text-purple-300 hover:text-red-500 transition-colors"
                          title="移除资产"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleInsertLeaderboard(metric.name, metric.role as 'Survivor' | 'Hunter', 'desc', 5, metric.id)} className="flex-1 py-1.5 bg-white hover:bg-purple-100 text-[10px] font-bold text-purple-700 rounded drop-shadow-sm transition-all border border-purple-200">
                          前5降序
                        </button>
                        <button onClick={() => handleInsertLeaderboard(metric.name, metric.role as 'Survivor' | 'Hunter', 'asc', 5, metric.id)} className="flex-1 py-1.5 bg-white hover:bg-purple-100 text-[10px] font-bold text-purple-700 rounded drop-shadow-sm transition-all border border-purple-200">
                          前5升序
                        </button>
                      </div>
                      <button onClick={() => handleInsertLeaderboard(metric.name, metric.role as 'Survivor' | 'Hunter', importSortOrder, undefined, metric.id)} className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-[10px] font-bold text-white rounded shadow-sm transition-all border border-purple-500">
                        {`导入完整排行榜 (${importSortOrder === 'asc' ? '升序' : '降序'})`}
                      </button>
                    </div>
                  </div>
                ))}

                {getSelectedTagData().length === 0 && getSelectedMetricData().length === 0 && getSelectedCustomMetricData().length === 0 && (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-2xl gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest">无关联系统数据</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Editor Modal */}
      {isAddingArticle && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                  <FilePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">文档实验室 (Doc Lab)</h3>
                  <p className="text-sm text-slate-400 font-medium">智能解析文稿并关联研究素材</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingArticle(false)} 
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all group"
              >
                <X className="w-6 h-6 text-slate-300 group-hover:text-slate-900" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">演示课题名称</label>
                    <input 
                      type="text" 
                      value={newArticleDoc.title}
                      onChange={e => setNewArticleDoc({...newArticleDoc, title: e.target.value})}
                      placeholder="例如：庄园破译机制深度解析"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">所属研究系列</label>
                    <input 
                      type="text" 
                      value={newArticleDoc.series}
                      onChange={e => setNewArticleDoc({...newArticleDoc, series: e.target.value})}
                      placeholder="例如：核心机制系列"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex justify-between">
                    <span>文稿正文 (支持智能解析)</span>
                    <span className="text-slate-400 font-medium normal-case">使用 "---" 或 "[画面：...]" 分隔环节</span>
                  </label>
                  <textarea 
                    value={newArticleDoc.content}
                    onChange={e => setNewArticleDoc({...newArticleDoc, content: e.target.value})}
                    placeholder="[画面：开场标题]&#10;这是第一页的内容...&#10;[备注：这里语速要慢]&#10;&#10;---&#10;&#10;[画面：核心数据]&#10;这是第二页的内容..."
                    className="w-full h-[400px] px-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 text-sm font-mono leading-relaxed resize-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <TagIcon className="w-3 h-3" /> 引用系统标签 (Tag Assets)
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] max-h-60 overflow-y-auto no-scrollbar">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const isSelected = newArticleDoc.selectedTags.includes(tag.name);
                          setNewArticleDoc({
                            ...newArticleDoc,
                            selectedTags: isSelected 
                              ? newArticleDoc.selectedTags.filter(t => t !== tag.name)
                              : [...newArticleDoc.selectedTags, tag.name]
                          });
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          newArticleDoc.selectedTags.includes(tag.name)
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> 引用关键指标 (Metrics Assets)
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] max-h-60 overflow-y-auto no-scrollbar">
                    {availableTraits.map(trait => (
                      <button
                        key={trait.id}
                        onClick={() => {
                          const isSelected = newArticleDoc.selectedMetrics.includes(trait.id);
                          setNewArticleDoc({
                            ...newArticleDoc,
                            selectedMetrics: isSelected 
                              ? newArticleDoc.selectedMetrics.filter(t => t !== trait.id)
                              : [...newArticleDoc.selectedMetrics, trait.id]
                            });
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          newArticleDoc.selectedMetrics.includes(trait.id)
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {trait.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-3 text-blue-900 font-bold text-sm mb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    智能解析提示
                  </div>
                  <p className="text-blue-700/60 text-xs leading-relaxed">
                    系统将自动识别标题、列表、公式等不同版式。在文本中直接输入所需内容，暂不支持口播稿及备注。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-6 items-center">
              <span className="text-xs text-slate-400 font-medium">准备好开始你的创作了吗？</span>
              <button 
                onClick={handleCreateFromDoc}
                className="px-10 py-4 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-2xl shadow-slate-300 hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-3"
              >
                <Save className="w-5 h-5" /> 生成并进入工作台
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
