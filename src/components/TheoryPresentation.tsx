import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, BookOpen, User, Clock, FileText, Plus, 
  Tag as TagIcon, Trophy, X, Save, FilePlus, Sparkles, Search, Info, 
  Copy, Trash2, ArrowUp, ArrowDown, Monitor, Video, Edit, Download, Zap
} from 'lucide-react';
import { Tag, Character, TalentDefinition } from '../constants';
import { generateLeaderboardData } from '../utils/leaderboardUtils';

type SlideType = 'title' | 'conclusion' | 'list' | 'ranking' | 'compare' | 'formula' | 'summary';

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
}

const MOCK_DATA: TheoryArticle[] = [
  {
    id: 'decoding-01',
    title: '破译相关数据',
    series: '纯数据系列 01',
    date: '2024-04-20',
    author: '庄园研究组',
    relatedTags: ['破译'],
    relatedMetrics: ['密码机破译时长', '破译触电回退进度'],
    slides: [
      {
        id: 's1',
        type: 'title',
        title: '为什么“修机快”不等于“破译收益高”？',
        body: '效率 vs 收益\n破译速度只是纸面指标，真实的对局收益往往被后期节奏、补电机成本和失误容错率所稀释。',
        notes: "开场观点：引导读者思考破译速度以外的变量。注意强调'纸面指标'与'对局收益'的对立。",
        estimatedSeconds: 15
      },
      {
        id: 's2',
        type: 'list',
        title: '破译收益的四个维度',
        bullets: [
          '速度：单位时间内的进度产出',
          '稳定性：受校准、特殊机制影响的下限',
          '干扰承受：面对监管者干扰时的博弈资本',
          '团队适配：对后续补位、转点节奏的支持'
        ],
        notes: "核心模型介绍。速度是基础，稳定性决定下限，干扰承受是上限，团队适配决定上限的上限。",
        estimatedSeconds: 25
      },
      {
        id: 's3',
        type: 'ranking',
        title: '破译收益简化排行榜 (理论值)',
        body: '1. 机械师 (98) - 高上限/低稳定性\n2. 盲女 (92) - 高效率/极低生存\n3. 囚徒 (88) - 灵活转场/中等波动\n4. 律师 (85) - 极高稳定/中等效率',
        notes: "展示部分理论计算后的排名。律师虽然效率不是最高，但稳定性带来的收益在实战中往往超出预期。",
        estimatedSeconds: 20
      },
      {
        id: 's4',
        type: 'summary',
        title: '不追求瞬时的火花，而追求持续的燃料。',
        body: '"破译收益 = 理论效率 × 过程稳定性 + 团队节奏增益"',
        notes: "总结句。强调稳健和持续性。收尾干净利落。",
        estimatedSeconds: 12
      }
    ]
  }
];

type ViewMode = 'edit' | 'presentation' | 'recording';

export const TheoryPresentation: React.FC<TheoryPresentationProps> = ({ characters, talents, availableTags, availableTraits }) => {
  const [articles, setArticles] = useState<TheoryArticle[]>(() => {
    try {
      const saved = localStorage.getItem('theory_articles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed to parse theory_articles from localStorage", err);
    }
    return MOCK_DATA;
  });
  const [currentArticle, setCurrentArticle] = useState<TheoryArticle>(articles[0] || MOCK_DATA[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [newArticleDoc, setNewArticleDoc] = useState({
    title: '',
    series: '',
    content: '',
    selectedTags: [] as string[],
    selectedMetrics: [] as string[]
  });

  // Auto-save articles
  useEffect(() => {
    localStorage.setItem('theory_articles', JSON.stringify(articles));
  }, [articles]);

  // Sync current article if articles change
  useEffect(() => {
    if (!currentArticle) return;
    const fresh = articles.find(a => a.id === currentArticle.id);
    if (fresh && fresh !== currentArticle) {
      setCurrentArticle(fresh);
    }
  }, [articles, currentArticle?.id]);
  
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateFromDoc = () => {
    if (!newArticleDoc.title) return;

    // Enhanced parser
    const sections = newArticleDoc.content.split(/\n---\n|\[画面：/).map(s => s.trim()).filter(Boolean);
    const generatedSlides: Slide[] = sections.map((section, idx) => {
      const text = section.endsWith(']') ? section.slice(0, -1) : section;
      const lines = text.split('\n');
      const title = lines[0] || `页面 ${idx + 1}`;
      const body = lines.slice(1).join('\n') || '';
      
      let type: SlideType = 'list';
      if (idx === 0) type = 'title';
      else if (idx === sections.length - 1) type = 'summary';
      else if (text.includes('对比')) type = 'compare';
      else if (/(排名|排行|TOP|第)/i.test(text)) type = 'ranking';
      else if (/[=×+x\*]/i.test(text)) type = 'formula';
      else if (text.length < 50) type = 'conclusion';

      const notes = text.match(/\[备注：(.*?)\]/)?.[1] || "自动生成的内容。";
      const cleanBody = body.replace(/\[备注：.*?\]/g, '').trim();

      // Estimate time: 240 chars per minute = 4 chars per second
      const estimatedSeconds = Math.ceil((title.length + cleanBody.length + notes.length) / 4);

      return {
        id: `gen-${Date.now()}-${idx}`,
        type,
        title,
        body: cleanBody,
        notes,
        estimatedSeconds
      };
    });

    const newArt: TheoryArticle = {
      id: `art-${Date.now()}`,
      title: newArticleDoc.title,
      series: newArticleDoc.series || '实验室草稿',
      date: new Date().toISOString().split('T')[0],
      author: '理论编辑器',
      relatedTags: newArticleDoc.selectedTags,
      relatedMetrics: newArticleDoc.selectedMetrics,
      slides: generatedSlides.length > 0 ? generatedSlides : [{
        id: 'empty',
        type: 'conclusion',
        title: '空内容',
        notes: '请检查输入格式'
      }]
    };

    const updatedArticles = [newArt, ...articles];
    setArticles(updatedArticles);
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

  const currentSlide = currentArticle.slides[currentSlideIndex];

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
  };

  const handleInsertLeaderboard = (traitLabel: string, role: 'Survivor' | 'Hunter', sortOrder: 'asc' | 'desc', limit: number) => {
    const { sortedData } = generateLeaderboardData(characters, role, traitLabel, sortOrder);
    const topData = sortedData.slice(0, limit);
    const newBody = topData.map(d => `${d.name} (${d.value})`).join('\n');
    
    handleUpdateSlide({
      ...currentSlide,
      type: 'ranking',
      body: newBody,
      sourceType: 'leaderboard',
      sourceData: { role, metricLabel: traitLabel, sortOrder, limit, topData }
    });
  };

  const handleInsertTag = (tag: Tag, mode: 'summary' | 'characters' | 'talents') => {
    const relatedChars = characters.filter(c => 
      c.skills?.some(s => s.tags?.includes(tag.name)) || 
      c.presence?.some(p => p.tags?.includes(tag.name))
    );
    const relatedTals = talents.filter(t => t.tags?.includes(tag.name));

    let newBody = '';
    if (mode === 'summary') {
      newBody = `适用阵营：${tag.affectedRole}\n关联角色：${relatedChars.length}名\n关联天赋：${relatedTals.length}个`;
    } else if (mode === 'characters') {
      newBody = relatedChars.map(c => `- ${c.title} ${c.name}`).join('\n');
    } else if (mode === 'talents') {
      newBody = relatedTals.map(t => `- ${t.name}`).join('\n');
    }

    handleUpdateSlide({
      ...currentSlide,
      type: (currentSlide.type !== 'list' && currentSlide.type !== 'summary') ? 'list' : currentSlide.type,
      body: newBody,
      sourceType: 'tag',
      sourceData: { tagId: tag.id, tagName: tag.name, insertedMode: mode, relatedChars, relatedTals }
    });
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: 'list',
      title: '新页面',
      body: '输入内容...',
      notes: '',
      estimatedSeconds: 10
    };
    const updatedSlides = [...currentArticle.slides];
    updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (currentArticle.slides.length <= 1) return;
    if (window.confirm('确定要删除当前页面吗？')) {
      const updatedSlides = currentArticle.slides.filter((_, i) => i !== currentSlideIndex);
      const updatedArticle = { ...currentArticle, slides: updatedSlides };
      setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    }
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? currentSlideIndex - 1 : currentSlideIndex + 1;
    if (newIdx < 0 || newIdx >= currentArticle.slides.length) return;
    
    const updatedSlides = [...currentArticle.slides];
    [updatedSlides[currentSlideIndex], updatedSlides[newIdx]] = [updatedSlides[newIdx], updatedSlides[currentSlideIndex]];
    
    const updatedArticle = { ...currentArticle, slides: updatedSlides };
    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
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

  const exportMarkdown = () => {
    let md = `# ${currentArticle.title}\n\n`;
    md += `系列：${currentArticle.series}\n`;
    md += `作者：${currentArticle.author}\n`;
    md += `日期：${currentArticle.date}\n\n---\n\n`;
    
    currentArticle.slides.forEach((slide, idx) => {
      md += `## P${idx + 1}: ${slide.title} (${slide.type})\n\n`;
      if (slide.body) md += `${slide.body}\n\n`;
      if (slide.bullets) slide.bullets.forEach(b => md += `- ${b}\n`);
      md += `\n> **口播备注**：${slide.notes}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArticle.title.replace(/[\\/:*?"<>|]/g, '_')}_口播稿.md`;
    a.click();
  };

  // Duration Stats
  const getTotalSeconds = () => currentArticle.slides.reduce((acc, s) => acc + (s.estimatedSeconds || 0), 0);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  // Render Slide Content
  const renderSlideContent = (slide: Slide) => {
    const baseClasses = "flex flex-col h-full p-8 md:p-16 animate-in fade-in slide-in-from-bottom-4 duration-700";
    
    switch (slide.type) {
      case 'title':
        return (
          <div className={`${baseClasses} items-center justify-center text-center gap-6`}>
            <div className="w-16 h-1 bg-slate-900 mb-4" />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
              {slide.title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl font-light italic">
              {slide.body}
            </p>
          </div>
        );
      case 'summary':
        return (
          <div className={`${baseClasses} items-center justify-center text-center bg-slate-900 text-white rounded-[2rem] m-4 gap-8`}>
            <Sparkles className="w-12 h-12 text-white/20" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-snug">
              {slide.title}
            </h2>
            <div className="h-px w-24 bg-white/20" />
            <p className="text-xl text-white/50 max-w-2xl italic font-serif">
              {slide.body}
            </p>
          </div>
        );
      case 'list':
      case 'conclusion':
        return (
          <div className={`${baseClasses} gap-8`}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 border-l-8 border-slate-900 pl-6 mb-4">
              {slide.title}
            </h2>
            <div className="flex-1 space-y-6">
              {slide.body && <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-wrap">{slide.body}</p>}
              {slide.bullets && (
                <ul className="space-y-4">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex gap-4 text-lg text-slate-500">
                      <span className="text-slate-900 font-mono font-bold">{i + 1}.</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      case 'ranking':
        const rankingItems = slide.body?.split('\n').filter(Boolean) || [];
        return (
          <div className={`${baseClasses} gap-8`}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{slide.title}</h2>
            <div className="flex-1 space-y-4">
              {rankingItems.map((item, i) => {
                const [name, rest] = item.split(/[(\-]/);
                return (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-mono font-bold text-slate-200 w-8">{i + 1}</span>
                      <span className="text-xl font-bold text-slate-800">{name.trim().replace(/^\d+\.\s*/, '')}</span>
                    </div>
                    {rest && <span className="text-sm font-mono text-slate-400">({rest.replace(/[)]/g, '')}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} items-center justify-center text-center gap-6`}>
            <h2 className="text-4xl font-bold text-slate-900">{slide.title}</h2>
            <p className="text-xl text-slate-500 whitespace-pre-wrap">{slide.body}</p>
          </div>
        );
    }
  };

  // Helper to get real data objects
  const getSelectedTagData = () => {
    return availableTags.filter(t => currentArticle.relatedTags?.includes(t.name) || currentArticle.relatedTags?.includes(t.id));
  };

  const getSelectedMetricData = () => {
    return availableTraits.filter(t => currentArticle.relatedMetrics?.includes(t.id) || currentArticle.relatedMetrics?.includes(t.label));
  };

  return (
    <div className={`flex flex-col gap-6 h-full min-h-[600px] text-slate-900 font-sans p-2 lg:p-0 ${viewMode === 'recording' ? 'fixed inset-0 z-[100] bg-black p-0' : ''}`}>
      {/* Top Header Mode Switcher */}
      {viewMode !== 'recording' && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4" /> 理论演示工作台
            </h2>
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
              {[
                { id: 'edit', label: '制作模式', icon: <Edit className="w-3 h-3" /> },
                { id: 'presentation', label: '演示模式', icon: <Monitor className="w-3 h-3" /> },
                { id: 'recording', label: '录制模式', icon: <Video className="w-3 h-3" /> }
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
            <button 
              onClick={exportJSON}
              className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> 下载 JSON
            </button>
            <button 
              onClick={exportMarkdown}
              className="px-4 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-900 rounded-lg flex items-center gap-2"
            >
              <FilePlus className="w-3 h-3" /> 导出口播稿
            </button>
          </div>
        </div>
      )}

      {viewMode === 'recording' && (
        <button 
          onClick={() => setViewMode('edit')}
          className="fixed top-6 right-6 z-[110] px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-[10px] font-bold rounded-full transition-all flex items-center gap-2 opacity-0 hover:opacity-100"
        >
          <X className="w-3 h-3" /> 退出录屏模式
        </button>
      )}

      <div className={`flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden ${viewMode === 'recording' ? 'h-full bg-black' : ''}`}>
        {/* Sidebar: Article List */}
        {viewMode === 'edit' && (
          <aside className="w-full lg:w-72 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 gap-6 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> 我的草稿箱
              </h3>
              <button 
                onClick={() => setIsAddingArticle(true)}
                className="p-1.5 bg-slate-900 text-white rounded-lg hover:scale-105 transition-all"
                title="导入新文稿"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
              {articles.map(article => (
                <div key={article.id} className="group relative">
                  <button
                    onClick={() => {
                      setCurrentArticle(article);
                      setCurrentSlideIndex(0);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      currentArticle.id === article.id 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] opacity-70 font-mono mb-1">{article.series}</span>
                    <span className="text-sm font-bold leading-tight line-clamp-2">{article.title}</span>
                  </button>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDuplicateArticle(article); }}
                      className="p-1.5 bg-slate-800/80 backdrop-blur rounded-lg text-white/50 hover:text-white transition-all shadow-sm"
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
                      className={`p-1.5 backdrop-blur rounded-lg transition-all shadow-sm flex items-center justify-center ${
                        deleteConfirmId === article.id 
                          ? 'bg-red-500 text-white animate-pulse scale-110' 
                          : 'bg-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white'
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
          </aside>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col gap-6 ${viewMode === 'recording' ? 'absolute inset-0 z-10 items-center justify-center bg-black p-0' : ''}`}>
          {/* Fullscreen Wrapper Container */}
          <div 
            ref={presentationContainerRef} 
            className={`flex flex-col ${viewMode === 'recording' 
              ? 'w-full h-auto max-w-[177.78vh] aspect-video animate-in zoom-in-95 duration-700 shadow-2xl relative' 
              : 'flex-1 gap-4 bg-[#f8fafc]'}`}
          >
            <div 
              className={`flex-1 relative w-full h-full bg-white overflow-hidden flex items-center justify-center transition-all duration-700 ease-in-out ${viewMode === 'recording' ? 'rounded-none' : 'rounded-[2.5rem] border border-slate-100 shadow-xl'}`}
            >
              {/* The actual slide content */}
              <div className="w-full h-full">
                {renderSlideContent(currentSlide)}
              </div>

              {/* Slide Overlay Info */}
              {viewMode !== 'recording' && (
                <>
                  <div className="absolute bottom-10 left-10 flex items-center gap-4 pointer-events-none">
                    <span className="px-4 py-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-2xl text-xs font-bold tracking-widest text-slate-400">
                      {currentSlideIndex + 1} / {currentArticle.slides.length}
                    </span>
                  </div>
                  
                  <div className="absolute top-10 right-10 flex items-center gap-2 pointer-events-auto">
                    <button 
                      onClick={toggleFullScreen}
                      className="p-4 bg-white/80 hover:bg-white backdrop-blur shadow-sm rounded-full text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                      title="全屏预览"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Controls Footer */}
            {viewMode !== 'recording' && (
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] border border-white/40 shadow-sm mt-auto shrink-0 transition-all">
                <div className="flex items-center gap-2">
                  {viewMode === 'edit' && (
                    <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100">
                      <button onClick={() => handleMoveSlide('up')} disabled={currentSlideIndex === 0} className="p-2 hover:bg-slate-50 text-slate-400 disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => handleMoveSlide('down')} disabled={currentSlideIndex === currentArticle.slides.length - 1} className="p-2 hover:bg-slate-50 text-slate-400 disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                      <div className="w-px h-4 bg-slate-100 mx-1" />
                      <button onClick={handleDeleteSlide} className="p-2 hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={handleAddSlide} className="p-2 hover:bg-slate-50 text-slate-900 flex items-center gap-2 px-4"><Plus className="w-4 h-4" /><span className="text-xs font-bold">加页</span></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0}
                    className={`p-4 rounded-2xl transition-all ${
                      currentSlideIndex === 0 
                        ? 'opacity-30 cursor-not-allowed text-slate-300' 
                        : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 shadow-sm active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    disabled={currentSlideIndex === currentArticle.slides.length - 1}
                    className={`px-12 py-4 rounded-2xl transition-all flex items-center gap-3 font-bold ${
                      currentSlideIndex === currentArticle.slides.length - 1 
                        ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-300' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95'
                    }`}
                  >
                    <span className="tracking-widest">下个环节</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Editor / Info */}
        {viewMode !== 'recording' && (
          <aside className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto no-scrollbar">
            {/* Editor Console */}
            {viewMode === 'edit' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Edit className="w-3 h-3" /> 环节编辑器
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">版式类型</label>
                    <select 
                      value={currentSlide.type}
                      onChange={(e) => handleUpdateSlide({...currentSlide, type: e.target.value as SlideType})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold"
                    >
                      <option value="title">标题页 (Title)</option>
                      <option value="list">列表页 (List)</option>
                      <option value="ranking">排行榜 (Ranking)</option>
                      <option value="compare">对比页 (Compare)</option>
                      <option value="formula">公式页 (Formula)</option>
                      <option value="summary">总结页 (Summary)</option>
                      <option value="conclusion">纯文字 (Text)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">环节标题</label>
                    <input 
                      type="text" 
                      value={currentSlide.title}
                      onChange={(e) => handleUpdateSlide({...currentSlide, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">正文内容 / 数据列表</label>
                    <textarea 
                      value={currentSlide.body}
                      onChange={(e) => handleUpdateSlide({...currentSlide, body: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm h-32 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">口播稿 / 专家备注</label>
                    <textarea 
                      value={currentSlide.notes}
                      onChange={(e) => handleUpdateSlide({...currentSlide, notes: e.target.value})}
                      className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-2 text-sm h-32 italic text-amber-900/70"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats Panel */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">录制统计</span>
                <Clock className="w-4 h-4 text-white/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="block text-[10px] text-white/30 font-bold mb-1 uppercase">当前环节</span>
                  <span className="text-xl font-bold font-mono">{formatTime(currentSlide.estimatedSeconds || 0)}</span>
                  {(currentSlide.estimatedSeconds || 0) > 45 && (
                    <span className="block mt-1 text-[8px] text-amber-400 flex items-center gap-1">
                      <Search className="w-2 h-2" /> 建议精简内容
                    </span>
                  )}
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="block text-[10px] text-white/30 font-bold mb-1 uppercase">全片时长</span>
                  <span className="text-xl font-bold font-mono">{formatTime(getTotalSeconds())}</span>
                  <span className="block mt-1 text-[8px] text-white/20">{currentArticle.slides.length} 个环节</span>
                </div>
              </div>
            </div>

            {/* Related Research */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 overflow-auto flex flex-col gap-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> 研究资产引用
              </h3>
              
              <div className="space-y-4">
                {getSelectedTagData().map(tag => (
                  <div key={tag.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-bold text-blue-900">{tag.name}</span>
                      </div>
                      <span className="text-[10px] text-blue-300 font-mono">TAG</span>
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

                {getSelectedMetricData().map(trait => (
                  <div key={trait.id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-bold text-amber-900">{trait.label}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">{trait.role}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleInsertLeaderboard(trait.label, trait.role as 'Survivor' | 'Hunter', 'desc', 5)} className="flex-1 py-1.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-amber-700 rounded drop-shadow-sm transition-all border border-amber-100">
                        插入前5降序
                      </button>
                      <button onClick={() => handleInsertLeaderboard(trait.label, trait.role as 'Survivor' | 'Hunter', 'asc', 5)} className="flex-1 py-1.5 bg-white hover:bg-amber-50 text-[10px] font-bold text-amber-700 rounded drop-shadow-sm transition-all border border-amber-100">
                        插入前5升序
                      </button>
                    </div>
                  </div>
                ))}

                {getSelectedTagData().length === 0 && getSelectedMetricData().length === 0 && (
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
                    系统将自动识别标题、列表、公式等不同版式。在文本最后添加 <code className="bg-blue-100 px-1 rounded">[备注：...]</code> 可自动同步到口播稿中。
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
