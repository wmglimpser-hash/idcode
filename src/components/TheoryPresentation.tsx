import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, BookOpen, User, Clock, FileText } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  content: React.ReactNode;
  notes: string;
}

interface TheoryArticle {
  id: string;
  title: string;
  series: string;
  date: string;
  author: string;
  slides: Slide[];
}

const MOCK_DATA: TheoryArticle[] = [
  {
    id: 'decoding-01',
    title: '破译相关数据',
    series: '纯数据系列 01',
    date: '2024-04-20',
    author: '庄园研究组',
    slides: [
      {
        id: 's1',
        title: '为什么“修机快”不等于“破译收益高”？',
        content: (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
              效率 vs 收益
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
              破译速度只是纸面指标，真实的对局收益往往被后期节奏、补电机成本和失误容错率所稀释。
            </p>
          </div>
        ),
        notes: "开场观点：引导读者思考破译速度以外的变量。注意强调'纸面指标'与'对局收益'的对立。"
      },
      {
        id: 's2',
        title: '破译收益的四个维度',
        content: (
          <div className="grid grid-cols-2 gap-8 p-12 h-full">
            {[
              { label: '速度', desc: '单位时间内的进度产出' },
              { label: '稳定性', desc: '受校准、特殊机制影响的下限' },
              { label: '干扰承受', desc: '面对监管者干扰时的博弈资本' },
              { label: '团队适配', desc: '对后续补位、转点节奏的支持' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <span className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">{`0${i + 1}`}</span>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{item.label}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        ),
        notes: "核心模型介绍。速度是基础，稳定性决定下限，干扰承受是上限，团队适配决定上限的上限。"
      },
      {
        id: 's3',
        title: '破译收益简化排行榜',
        content: (
          <div className="p-12 h-full flex flex-col">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 border-l-4 border-slate-900 pl-4">破译综合评级 (理论值)</h3>
            <div className="flex-1 space-y-4">
              {[
                { name: '机械师', score: 98, tag: '高上限/低稳定性' },
                { name: '盲女', score: 92, tag: '高效率/极低生存' },
                { name: '囚徒', score: 88, tag: '灵活转场/中等波动' },
                { name: '律师', score: 85, tag: '极高稳定/中等效率' }
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-mono font-bold text-slate-300 w-6">{i + 1}</span>
                    <span className="text-lg font-bold text-slate-700">{row.name}</span>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase">{row.tag}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900" style={{ width: `${row.score}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold text-slate-900">{row.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
        notes: "展示部分理论计算后的排名。律师虽然效率不是最高，但稳定性带来的收益在实战中往往超出预期。"
      },
      {
        id: 's4',
        title: '总结',
        content: (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-900 text-white rounded-3xl">
            <div className="mb-8 w-12 h-1 bg-white/30" />
            <h2 className="text-5xl font-bold tracking-tight mb-8">
              不追求瞬时的火花，<br />
              而追求持续的燃料。
            </h2>
            <p className="text-xl text-white/60 max-w-xl italic">
              "破译收益 = 理论效率 × 过程稳定性 + 团队节奏增益"
            </p>
          </div>
        ),
        notes: "总结句。强调稳健和持续性。收尾干净利落。"
      }
    ]
  }
];

export const TheoryPresentation: React.FC = () => {
  const [currentArticle, setCurrentArticle] = useState<TheoryArticle>(MOCK_DATA[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideAreaRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    if (currentSlideIndex < currentArticle.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      slideAreaRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const currentSlide = currentArticle.slides[currentSlideIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] text-slate-900 font-sans p-2 lg:p-0">
      {/* Sidebar: Article List */}
      <aside className="w-full lg:w-72 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 gap-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BookOpen className="w-3 h-3" /> 内容系列
          </h3>
          <div className="space-y-2">
            {MOCK_DATA.map(article => (
              <button
                key={article.id}
                onClick={() => {
                  setCurrentArticle(article);
                  setCurrentSlideIndex(0);
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  currentArticle.id === article.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-[10px] opacity-70 font-mono mb-1">{article.series}</span>
                <span className="text-sm font-bold leading-tight">{article.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <User className="w-3 h-3" />
            <span>{currentArticle.author}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <Clock className="w-3 h-3" />
            <span>{currentArticle.date}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Slide Area Container */}
        <div className="flex-1 flex flex-col gap-4">
          <div 
            ref={slideAreaRef}
            className="relative w-full aspect-video bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center p-0 transition-all duration-700 ease-in-out"
          >
            {/* The actual slide content */}
            <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 overflow-auto">
              {currentSlide.content}
            </div>

            {/* Slide Overlay Info */}
            <div className="absolute bottom-6 left-6 flex items-center gap-4 pointer-events-none">
              <span className="px-3 py-1 bg-slate-900/5 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-widest text-slate-400">
                {currentSlideIndex + 1} / {currentArticle.slides.length}
              </span>
            </div>
            
            <div className="absolute top-6 right-6 flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={toggleFullScreen}
                className="p-3 bg-white/80 hover:bg-white backdrop-blur shadow-sm rounded-full text-slate-400 hover:text-slate-900 transition-all"
                title="进入演示模式"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/40 shadow-sm mt-auto shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 px-4 py-2 border border-slate-100 rounded-2xl mr-2">
                CODEX 理论引擎 v1.0
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-4 rounded-2xl transition-all ${
                  currentSlideIndex === 0 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900 shadow-sm active:scale-95'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextSlide}
                disabled={currentSlideIndex === currentArticle.slides.length - 1}
                className={`px-8 py-4 rounded-2xl transition-all flex items-center gap-2 font-bold ${
                  currentSlideIndex === currentArticle.slides.length - 1 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95'
                }`}
              >
                <span>下一步</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Notes */}
      <aside className="w-full lg:w-80 flex flex-col gap-4">
        <div className="flex-1 bg-slate-50/50 backdrop-blur rounded-3xl border border-slate-100/50 p-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText className="w-3 h-3" /> 演示备注 / 口播稿
          </h3>
          <div className="prose prose-slate prose-sm text-slate-500 leading-relaxed font-serif italic text-lg">
            {currentSlide.notes}
          </div>
        </div>
        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <h4 className="text-sm font-bold mb-2">当前主题</h4>
          <p className="text-xs text-white/60 mb-4">{currentSlide.title}</p>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-400 transition-all duration-500" 
              style={{ width: `${((currentSlideIndex + 1) / currentArticle.slides.length) * 100}%` }} 
            />
          </div>
        </div>
      </aside>
    </div>
  );
};
