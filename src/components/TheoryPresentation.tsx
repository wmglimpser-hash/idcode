import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, BookOpen, User, Clock, FileText, Plus, 
  Tag as TagIcon, Trophy, X, Save, FilePlus, Sparkles, Search, Info, 
  Copy, Trash2, ArrowUp, ArrowDown, Monitor, Video, Edit, Download, Zap
} from 'lucide-react';
import { Tag, Character, TalentDefinition } from '../constants';
import { generateLeaderboardData } from '../utils/leaderboardUtils';

type SlideType = 'title' | 'conclusion' | 'list' | 'ranking' | 'compare' | 'formula' | 'summary' | 'mindmap';

interface SlideAsset {
  id: string;
  type: 'icon' | 'image';
  url?: string;
  iconKey?: string;
  name: string;
  alt: string;
  placement: 'hero' | 'inline' | 'corner';
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
  },
  {
    id: 'demo-all-layouts',
    title: '全版式与资产挂图演示（示例指南）',
    series: '模板展示',
    date: '2024-05-04',
    author: '展示器作者',
    relatedTags: ['版式', '资产库'],
    relatedMetrics: [],
    slides: [
      {
        id: 'd1',
        type: 'title',
        title: '全版式及挂图展示指南',
        body: '涵盖标题、列表、对比、公式、结论、排行榜、总结与思维导图8种核心版式，并展示了「背景/内嵌/角标」多种资产挂载形态。',
        notes: '标题页（Title）：支持在背景挂载Icon或Image做底纹，起基础定调作用。',
        estimatedSeconds: 12,
        assets: [
          {
            id: 'a1',
            type: 'icon',
            iconKey: 'Sparkles',
            name: '背景闪耀',
            alt: 'Hero Icon',
            placement: 'hero'
          }
        ]
      },
      {
        id: 'd2',
        type: 'list',
        title: '三种不同的资产挂载（Asset Placements）',
        bullets: [
          'Hero (背景底层)：平铺在卡片底层做背景装饰，支持纯色去色处理，渲染氛围。',
          'Inline (内联区域)：直接挂载在主内容区或标题下方，非常适合附加说明图、数据信息统计图。',
          'Corner (悬停角标)：挂在卡片右下角，半透明展示，适合引述、标识类型。'
        ],
        notes: '列表页（List）：通常承载信息最密的条目，配合角标使用。',
        estimatedSeconds: 20,
        assets: [
          {
            id: 'a2',
            type: 'icon',
            iconKey: 'Info',
            name: '提示角标',
            alt: 'Info Corner',
            placement: 'corner'
          }
        ]
      },
      {
        id: 'd3',
        type: 'compare',
        title: '选择合适的图例',
        body: '数据可视化截屏 vs 发散抽象画',
        notes: '对比版式（Compare）：经典的A对B排版，适合展现分歧或抉择。',
        estimatedSeconds: 15,
        assets: [
          {
            id: 'a3',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=200',
            name: '数据图例',
            alt: 'Data Chart Image',
            placement: 'inline'
          }
        ]
      },
      {
        id: 'd4',
        type: 'formula',
        title: '理论影响力的终极公式',
        body: 'V = 数据深度 × 视觉感染力²',
        notes: '公式版式（Formula）：用最霸占屏幕的字号展示理论模型，产生冲击感。搭配了背景全屏资产渲染。',
        estimatedSeconds: 12,
        assets: [
          {
            id: 'a4',
            type: 'icon',
            iconKey: 'Zap',
            name: '闪电动力',
            alt: 'Action bg',
            placement: 'hero'
          }
        ]
      },
      {
        id: 'd5',
        type: 'ranking',
        title: '阅读焦点获取度排名',
        notes: '排行榜（Ranking）：自带精美入场动画序列，如果挂载了头像数据可以直接展示头像。',
        estimatedSeconds: 25,
        sourceData: {
          metricLabel: '眼动仪停留比例',
          sortOrder: 'desc',
          groups: [
            { rank: '1', value: '45%', characters: [{id: 'r1', name: '数据图表', imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=100&h=100&q=80'}] },
            { rank: '2', value: '30%', characters: [{id: 'r2', name: '核心公式', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=100&h=100&q=80'}] },
            { rank: '3', value: '15%', characters: [{id: 'r3', name: '总结文段', imageUrl: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&w=100&h=100&q=80'}] }
          ]
        }
      },
      {
        id: 'd6',
        type: 'conclusion',
        title: '结论（带有统计大图验证）',
        body: '将关键论据用图片铺在屏幕中央，可以对文字结论产生极好的印证效果，避免了全是文字的疲劳。',
        notes: '结论版式（Conclusion）：字号可大可小，支持附加图片进行论证说明。',
        estimatedSeconds: 20,
        assets: [
          {
            id: 'a5',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&h=300',
            name: '统计大图',
            alt: 'Statistic Evidence',
            placement: 'inline'
          }
        ]
      },
      {
        id: 'd7',
        type: 'mindmap',
        title: '演示页面功能树',
        bullets: ['资产库资源', '版式渲染器', '播放投影控制', 'Markdown 智能解析'],
        notes: '思维导图版式（Mindmap）：可简单梳理平级逻辑或包含关系。',
        estimatedSeconds: 15
      },
      {
        id: 'd8',
        type: 'summary',
        title: '形式是为了承载更好的内容',
        body: '期待这套模板能释放你的理论表达能力',
        notes: '总结版式（Summary）：固定黑底反白设计，气场强，最适合用来作为全篇收尾！',
        estimatedSeconds: 15,
        assets: [
          {
            id: 'a6',
            type: 'icon',
            iconKey: 'Trophy',
            name: '荣誉总结',
            alt: 'Trophy final',
            placement: 'corner'
          }
        ]
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

export const TheoryPresentation: React.FC<TheoryPresentationProps> = ({ characters, talents, availableTags, availableTraits }) => {
  const [userAssets, setUserAssets] = useState<SlideAsset[]>(() => {
    try {
      const saved = localStorage.getItem('theory_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validAssets = parsed.filter(a => 
            a && typeof a === 'object' && a.id && (a.type === 'image' || a.type === 'icon') && a.name
          ).map(a => {
            if (a.type === 'image' && !a.url) return null;
            if (a.type === 'icon' && !a.iconKey && !a.url) return null;
            return {
              ...a,
              placement: (['hero', 'inline', 'corner'].includes(a.placement)) ? a.placement : 'corner'
            }
          }).filter(Boolean) as SlideAsset[];
          return validAssets;
        } else {
          console.warn("Invalid structure in theory_assets");
          localStorage.removeItem('theory_assets');
        }
      }
    } catch(e) {
      console.warn("Failed to parse theory_assets", e);
      localStorage.removeItem('theory_assets');
    }
    return [];
  });
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<'image' | 'icon'>('image');
  const [newAssetPlacement, setNewAssetPlacement] = useState<'hero' | 'inline' | 'corner'>('hero');

  useEffect(() => {
    localStorage.setItem('theory_assets', JSON.stringify(userAssets));
  }, [userAssets]);

  const [articles, setArticles] = useState<TheoryArticle[]>(() => {
    try {
      const saved = localStorage.getItem('theory_articles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isValid = parsed.every(a => 
            a && typeof a === 'object' && a.id && typeof a.title === 'string' &&
            Array.isArray(a.slides) && a.slides.length > 0 &&
            a.slides.every((s: any) => s && typeof s === 'object' && s.id && s.type && s.title !== undefined)
          );
          if (isValid) {
            // migration for new demo draft
            if (!parsed.some(a => a.id === 'demo-all-layouts')) {
               const demoDraft = MOCK_DATA.find(a => a.id === 'demo-all-layouts');
               if (demoDraft) parsed.unshift(demoDraft);
            }
            return parsed;
          } else {
            console.warn("Invalid structure in theory_articles from localStorage");
            localStorage.removeItem('theory_articles');
          }
        }
      }
    } catch (err) {
      console.warn("Failed to parse theory_articles from localStorage", err);
      localStorage.removeItem('theory_articles');
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

  const [isDraftCollapsed, setIsDraftCollapsed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16/9' | '9/16'>('16/9');

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
    const sections: { title?: string, content: string }[] = [];
    let currentTitle: string | undefined = undefined;
    let currentLines: string[] = [];
    
    newArticleDoc.content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '---') {
        if (currentLines.length > 0 || currentTitle) {
          sections.push({ title: currentTitle, content: currentLines.join('\n') });
        }
        currentTitle = undefined;
        currentLines = [];
      } else if (trimmed.startsWith('[画面：') && trimmed.endsWith(']')) {
        if (currentLines.length > 0 || currentTitle) {
          sections.push({ title: currentTitle, content: currentLines.join('\n') });
        }
        currentTitle = trimmed.slice(4, -1);
        currentLines = [];
      } else if (trimmed.startsWith('[画面:') && trimmed.endsWith(']')) { // Support half-width colon
        if (currentLines.length > 0 || currentTitle) {
          sections.push({ title: currentTitle, content: currentLines.join('\n') });
        }
        currentTitle = trimmed.slice(4, -1);
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    });
    if (currentLines.length > 0 || currentTitle) {
      sections.push({ title: currentTitle, content: currentLines.join('\n') });
    }

    const validSections = sections.filter(s => s.content.trim() || s.title);

    const generatedSlides: Slide[] = validSections.map((sec, idx) => {
      const text = sec.content.trim();
      const lines = text.split('\n');
      const title = sec.title || lines[0] || `页面 ${idx + 1}`;
      const body = sec.title ? text : lines.slice(1).join('\n');
      const typeText = (sec.title || '') + '\n' + text;
      
      let type: SlideType = 'list';
      if (idx === 0) type = 'title';
      else if (idx === validSections.length - 1) type = 'summary';
      else if (typeText.includes('对比')) type = 'compare';
      else if (/(排名|排行|TOP|第)/i.test(typeText)) type = 'ranking';
      else if (/[=×+x\*]/i.test(typeText)) type = 'formula';
      else if (typeText.length < 50) type = 'conclusion';

      const notes = body.match(/\[备注：(.*?)\]/)?.[1] || body.match(/\[备注:(.*?)\]/)?.[1] || "自动生成的内容。";
      const cleanBody = body.replace(/\[备注[：:].*?\]/g, '').trim();

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

  const handleAddAssetToSlide = (assetInfo: any) => {
    const newSlideAsset: SlideAsset = {
      id: `asset-${Date.now()}`,
      type: assetInfo.type ?? (assetInfo.iconKey ? 'icon' : 'image'),
      url: assetInfo.url,
      iconKey: assetInfo.iconKey,
      name: assetInfo.name || '未命名素材',
      alt: assetInfo.alt ?? assetInfo.name ?? '素材图',
      placement: assetInfo.placement ?? 'hero'
    };
    const currentAssets = currentSlide.assets || [];
    handleUpdateSlide({
      ...currentSlide,
      assets: [...currentAssets, newSlideAsset]
    });
  };

  const handleRemoveAssetFromSlide = (assetId: string) => {
    const currentAssets = currentSlide.assets || [];
    handleUpdateSlide({
      ...currentSlide,
      assets: currentAssets.filter(a => a.id !== assetId)
    });
  };

  const handleUpdateAssetPlacement = (assetId: string, placement: 'hero' | 'inline' | 'corner') => {
    const currentAssets = currentSlide.assets || [];
    handleUpdateSlide({
      ...currentSlide,
      assets: currentAssets.map(a => a.id === assetId ? { ...a, placement } : a)
    });
  };

  const handleAddUserAsset = () => {
    if (!newAssetUrl) return;
    const newId = `uasset-${Date.now()}`;
    setUserAssets([...userAssets, {
      id: newId,
      type: newAssetType,
      url: newAssetUrl,
      name: newAssetName || ('网络素材 ' + newId.substring(newId.length - 4)),
      alt: newAssetName || '自定义素材',
      placement: newAssetPlacement
    }]);
    setNewAssetUrl('');
    setNewAssetName('');
  };

  const handleInsertLeaderboard = (traitLabel: string, role: 'Survivor' | 'Hunter', sortOrder: 'asc' | 'desc', limitGroups: number) => {
    const { groups } = generateLeaderboardData(characters, role, traitLabel, sortOrder);
    const topGroups = groups.slice(0, limitGroups);
    
    if (topGroups.length === 0) {
      handleUpdateSlide({
        ...currentSlide,
        type: 'ranking',
        body: '暂无该排行榜数据。',
        sourceType: 'leaderboard',
        sourceData: { role, metricLabel: traitLabel, sortOrder, limit: limitGroups, groups: [] }
      });
      return;
    }

    const newBody = topGroups.map(g => {
      const charNames = g.characters.map(c => c.name).join('、');
      return `第 ${g.rank} 名（${g.value}）：${charNames}`;
    }).join('\n');
    
    handleUpdateSlide({
      ...currentSlide,
      type: 'ranking',
      body: newBody,
      sourceType: 'leaderboard',
      sourceData: { role, metricLabel: traitLabel, sortOrder, limit: limitGroups, groups: topGroups }
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
      type: mode === 'summary' ? 'summary' : 'list',
      body: newBody,
      sourceType: 'tag',
      sourceData: { tagId: tag.id, tagName: tag.name, insertedMode: mode, relatedCharacters: relatedChars, relatedTalents: relatedTals }
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
        <div className="absolute bottom-8 right-8 z-10 flex gap-4 opacity-50 pointer-events-none">
          {slide.assets.filter(a => a.placement === 'corner').map(a => (
            <div key={a.id} className="flex items-center justify-center">
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
    
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 my-6 relative z-10 w-full shrink-0">
        {inlineAssets.map(a => (
          <div key={a.id} className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
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
    
    switch (slide.type) {
      case 'title':
        return (
          <div className={`${baseClasses} items-center justify-center text-center gap-6`}>
            {renderAssets(slide)}
            <div className="w-16 h-1 bg-slate-900 mb-4 relative z-10" />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight relative z-10">
              {slide.title}
            </h1>
            {renderInlineAssets(slide)}
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl font-light italic relative z-10">
              {slide.body}
            </p>
          </div>
        );
      case 'summary':
        return (
          <div className={`${baseClasses} items-center justify-center text-center bg-slate-900 text-white rounded-[2rem] m-4 gap-8`}>
            {renderAssets(slide)}
            <Sparkles className="w-12 h-12 text-white/20 relative z-10" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-snug relative z-10">
              {slide.title}
            </h2>
            {renderInlineAssets(slide)}
            <div className="h-px w-24 bg-white/20 relative z-10" />
            <p className="text-xl text-white/50 max-w-2xl italic font-serif relative z-10">
              {slide.body}
            </p>
          </div>
        );
      case 'list':
      case 'conclusion':
        return (
          <div className={`${baseClasses} gap-8`}>
            {renderAssets(slide)}
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 border-l-8 border-slate-900 pl-6 mb-4 relative z-10">
              {slide.title}
            </h2>
            {renderInlineAssets(slide)}
            <div className="flex-1 space-y-6 relative z-10">
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
        return (
          <div className={`${baseClasses} gap-8 overflow-y-auto no-scrollbar`}>
            {renderAssets(slide)}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <Trophy className="w-8 h-8 text-amber-400" />
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{slide.title}</h2>
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
                  <div key={i} className="flex items-center py-2 px-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all hover:bg-white hover:shadow-md animate-in slide-in-from-right-8" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-mono font-black text-amber-200/50 w-8">{group.rank}</span>
                      <div className="flex flex-wrap gap-2">
                        {group.characters.map((c: any) => (
                           c.imageUrl ? (
                             <img key={c.id} src={c.imageUrl} alt={c.name} title={c.name} className="w-28 h-28 rounded-full object-cover shadow-sm border-[3px] border-white bg-slate-100" />
                           ) : (
                             <div key={c.id} className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500 border-[3px] border-white shadow-sm" title={c.name}>
                               {c.name.slice(0, 2)}
                             </div>
                           )
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-3xl font-mono font-black text-slate-900">{group.value}</span>
                  </div>
                ))
              ) : (
                (slide.body?.split('\n').filter(Boolean) || []).map((item, i) => {
                  const [name, rest] = item.split(/[(\-]/);
                  return (
                    <div key={i} className="flex items-center justify-between py-3 px-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-mono font-bold text-slate-200 w-6">{i + 1}</span>
                        <span className="text-xl font-bold text-slate-800">{name.trim().replace(/^\d+\.\s*/, '')}</span>
                      </div>
                      {rest && <span className="text-sm font-mono text-slate-400">({rest.replace(/[)]/g, '')}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      case 'compare':
        const parts = slide.body?.split('vs') || [];
        return (
          <div className={`${baseClasses}`}>
            {renderAssets(slide)}
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center relative z-10">{slide.title}</h2>
            {renderInlineAssets(slide)}
            <div className="flex-1 flex items-center justify-center gap-8 md:gap-16 relative z-10">
              <div className="flex-1 text-right">
                <span className="text-4xl md:text-6xl font-bold text-slate-800 tracking-tight">{parts[0]?.trim() || 'A'}</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="font-mono font-bold text-slate-400">VS</span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-4xl md:text-6xl font-bold text-slate-400 tracking-tight">{parts[1]?.trim() || 'B'}</span>
              </div>
            </div>
          </div>
        );
      case 'formula':
        return (
          <div className={`${baseClasses} items-center justify-center text-center`}>
            {renderAssets(slide)}
            <h2 className="text-3xl md:text-4xl font-bold text-slate-400 mb-12 relative z-10">{slide.title}</h2>
            {renderInlineAssets(slide)}
            <div className="p-8 md:p-12 bg-slate-50 border-2 border-slate-900 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] transform -rotate-1 hover:rotate-0 transition-all relative z-10">
              <p className="text-4xl md:text-5xl font-mono font-black text-slate-900 tracking-tight leading-tight">
                {slide.body}
              </p>
            </div>
          </div>
        );
      case 'mindmap':
        return (
          <div className={`${baseClasses} items-center justify-center bg-slate-50`}>
            {renderAssets(slide)}
            <h2 className="text-xl text-slate-400 font-bold mb-8 tracking-widest uppercase relative z-10">思维导图</h2>
            <div className="relative z-10 w-full flex items-center justify-center overflow-x-auto py-8 flex-1">
              <div className="flex items-center gap-12">
                <div className="px-8 py-6 bg-slate-900 text-white rounded-[2rem] shadow-xl z-20 relative min-w-[200px] text-center border-4 border-slate-50">
                  <span className="text-2xl font-bold block">{slide.title}</span>
                </div>
                {slide.bullets && slide.bullets.length > 0 && (
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute -left-12 top-[50%] bottom-[50%] w-12 border-t-2 border-slate-300 -translate-y-[1px]" />
                    <div className="absolute -left-12 top-0 bottom-0 border-l-2 border-slate-300 transform translate-y-1/2 -translate-y-1/2" style={{ height: 'calc(100% - 4.5rem)', top: '2.25rem' }} />
                    {slide.bullets.map((bullet, idx) => (
                      <div key={idx} className="relative flex items-center pl-12">
                        <div className="absolute left-0 w-12 border-t-2 border-slate-300 top-1/2 -translate-y-[1px]" />
                        <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm z-20 whitespace-nowrap">
                          <span className="text-lg font-medium text-slate-800">{bullet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {renderInlineAssets(slide)}
            {slide.body && <p className="mt-8 text-slate-500 max-w-2xl text-center relative z-10">{slide.body}</p>}
          </div>
        );
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
    return availableTags.filter(t => currentArticle.relatedTags?.includes(t.name) || currentArticle.relatedTags?.includes(t.id));
  };

  const getSelectedMetricData = () => {
    return availableTraits.filter(t => currentArticle.relatedMetrics?.includes(t.id) || currentArticle.relatedMetrics?.includes(t.label));
  };

  return (
    <div className={`flex flex-col gap-6 h-full min-h-[600px] text-slate-900 font-sans p-2 lg:p-0`}>
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
            <button 
              onClick={exportJSON}
              className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> 下载 JSON
            </button>
          </div>
        </div>
      {/* End Header */}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Sidebar: Article List */}
        {viewMode === 'edit' && (
          <aside className={`flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 gap-6 shrink-0 transition-all duration-300 ${isDraftCollapsed ? 'w-24 items-center' : 'w-full lg:w-72'}`}>
            <div className="flex items-center justify-between w-full">
              {!isDraftCollapsed && (
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> 我的草稿箱
                </h3>
              )}
              <div className={`flex items-center ${isDraftCollapsed ? 'flex-col gap-4' : 'gap-2'}`}>
                <button 
                  onClick={() => setIsAddingArticle(true)}
                  className="p-1.5 bg-slate-900 text-white rounded-lg hover:scale-105 transition-all flex items-center justify-center shrink-0"
                  title="导入新文稿"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsDraftCollapsed(!isDraftCollapsed)}
                  className="p-1.5 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                  title={isDraftCollapsed ? "展开草稿箱" : "收起草稿箱"}
                >
                  {isDraftCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar w-full">
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
        <div className={`flex-1 flex flex-col gap-6`}>
          {viewMode === 'presentation' && (
            <div className="flex items-center justify-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">画面比例</span>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button
                  onClick={() => setAspectRatio('16/9')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${aspectRatio === '16/9' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >16:9 横屏</button>
                <button
                  onClick={() => setAspectRatio('9/16')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${aspectRatio === '9/16' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >9:16 竖屏</button>
              </div>
            </div>
          )}
          {/* Fullscreen Wrapper Container */}
          <div 
            ref={presentationContainerRef} 
            className={`flex flex-col flex-1 gap-4 bg-[#f8fafc] w-full mx-auto relative ${viewMode === 'presentation' && aspectRatio === '9/16' ? 'max-w-[45vh]' : ''}`}
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

              {/* Click-to-Enlarge / Presentation Navigation Overlay */}
              {viewMode === 'edit' && (
                <div className="absolute inset-0 z-20 flex">
                  <div 
                    className={`h-full w-full cursor-zoom-in flex items-center justify-start p-4 md:p-8 opacity-0 hover:opacity-100 transition-opacity`}
                    onClick={(e) => {
                      setViewMode('presentation');
                      return;
                    }}
                    title={"点击放大查看"}
                  >
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

          {/* Controls Footer */}
          {viewMode === 'edit' && (
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
        {viewMode === 'edit' && (
          <aside className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto no-scrollbar">
            {/* Editor Console */}
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
                      <option value="mindmap">思维导图 (Mindmap)</option>
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
                    } else if (type === 'metric') {
                       updatedArticle.relatedMetrics = Array.from(new Set([...(updatedArticle.relatedMetrics || []), id]));
                    }
                    setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">+ 添加可用资产...</option>
                  <optgroup label="标签 (Tags)">
                    {availableTags.filter(t => !(currentArticle.relatedTags?.includes(t.name) || currentArticle.relatedTags?.includes(t.id))).map(t => (
                      <option key={`tag:${t.id}`} value={`tag:${t.name}`}>{t.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="指标排行榜 (Metrics)">
                    {availableTraits.filter(t => !(currentArticle.relatedMetrics?.includes(t.id) || currentArticle.relatedMetrics?.includes(t.label))).map(t => (
                      <option key={`metric:${t.id}`} value={`metric:${t.label}`}>{t.label} ({t.role})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              <div className="space-y-4">
                {getSelectedTagData().map(tag => (
                  <div key={tag.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-bold text-blue-900">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-300 font-mono">TAG</span>
                        <button 
                          onClick={() => {
                            const updatedArticle = { ...currentArticle, relatedTags: (currentArticle.relatedTags || []).filter(t => t !== tag.name && t !== tag.id) };
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

                {getSelectedMetricData().map(trait => (
                  <div key={trait.id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-bold text-amber-900">{trait.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-300 font-mono">{trait.role}</span>
                        <button 
                          onClick={() => {
                            const updatedArticle = { ...currentArticle, relatedMetrics: (currentArticle.relatedMetrics || []).filter(t => t !== trait.label && t !== trait.id) };
                            setArticles(articles.map(a => a.id === currentArticle.id ? updatedArticle : a));
                          }}
                          className="text-amber-300 hover:text-red-500 transition-colors"
                          title="移除资产"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
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
