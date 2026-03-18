import React, { useState } from 'react';
import { Character, COLORS } from '../constants';
import { Shield, Zap, Heart, Users, Search, Activity, Target, Layers, Cpu, Edit3 } from 'lucide-react';

type DetailTab = 'traits' | 'external' | 'mechanics';

interface Props {
  character: Character;
  onEdit?: (char: Character) => void;
}

export const CharacterDetail = ({ character, onEdit }: Props) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('traits');

  const tabs = [
    { id: 'traits', label: '特质详情', icon: <Activity className="w-4 h-4" /> },
    { id: 'external', label: '外在特质', icon: <Target className="w-4 h-4" /> },
    { id: 'mechanics', label: '机制', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left: Image and Basic Info */}
      <div className="lg:col-span-4 space-y-6">
        <div className="relative group overflow-hidden cyber-border">
          <img 
            src={character.imageUrl} 
            alt={character.name} 
            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-serif font-bold text-accent cyber-glow-text mb-1">
              {character.title}
            </h1>
            <p className="text-xl text-text font-mono italic opacity-70 tracking-tighter">{character.name}</p>
          </div>
          <div className="absolute top-4 right-4 bg-primary px-2 py-1 text-[10px] font-mono text-white cyber-glitch">
            ID: {character.id.padStart(4, '0')}
          </div>
          
          {onEdit && (
            <button 
              onClick={() => onEdit(character)}
              className="absolute top-4 left-4 p-2 bg-accent text-bg hover:bg-primary hover:text-white transition-all shadow-lg"
              title="修改数据"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="bg-card/50 border border-border p-6 rounded-none cyber-border space-y-4">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <span className="text-muted uppercase text-[10px] font-mono tracking-widest">阵营 FACTION</span>
            <span className="text-primary font-bold font-mono">{character.role === 'Survivor' ? '求生者' : '监管者'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted uppercase text-[10px] font-mono tracking-widest">定位 TYPE</span>
            <span className="text-text font-mono">{character.type}</span>
          </div>
        </div>
      </div>

      {/* Right: Tabs and Content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-card/50 p-1 border border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`flex-1 min-w-[100px] py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300 relative group overflow-hidden ${
                activeTab === tab.id 
                  ? 'text-accent' 
                  : 'text-muted hover:text-text'
              }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-accent/10 border-b-2 border-accent" />
              )}
              <div className={`${activeTab === tab.id ? 'text-accent' : 'text-muted group-hover:text-primary'} transition-colors`}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8 animate-in fade-in duration-500">
          {activeTab === 'traits' && (
            <section className="bg-card/30 border border-border p-8 rounded-none cyber-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-muted opacity-20">系统分析_V2.0</div>
              <h2 className="text-2xl font-serif text-accent mb-8 flex items-center gap-3 cyber-glow-text">
                <Activity className="w-6 h-6" /> 核心特质分析
              </h2>
              
              {character.traits && character.traits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[10px]">
                  {(character.role === 'Survivor' 
                    ? [
                        ...character.traits,
                        ...['移动 MOVEMENT', '破译 DECODING', '交互 INTERACTION', '治疗 HEALING', '其他 OTHERS']
                          .filter(cat => !character.traits.some(t => t.category === cat))
                          .map(cat => ({ category: cat, items: [] }))
                      ]
                    : character.traits
                  ).map((cat, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-primary font-bold mb-2 border-b border-primary/30 pb-1 flex justify-between">
                        <span>{cat.category}</span>
                      </h3>
                      <div className="space-y-1">
                        {cat.items.length > 0 ? (
                          cat.items.map((item, j) => (
                            <BaseStatItem key={j} label={item.label} value={item.value} />
                          ))
                        ) : (
                          <div className="text-muted italic opacity-50 py-1 px-2">暂无数据_NO_DATA</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-text/80 leading-relaxed font-mono text-sm border-l-2 border-primary pl-4 py-2 bg-primary/5">
                    {character.description}
                  </p>
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border text-muted">
                    <p className="text-xs font-mono uppercase tracking-widest">暂无详细特质数据</p>
                    <p className="text-[10px] mt-2">请在录入页面完善该角色的特质信息</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'external' && (
            <section className="bg-card/30 border border-border p-8 rounded-none cyber-border">
              <h2 className="text-2xl font-serif text-accent mb-8 flex items-center gap-3 cyber-glow-text">
                <Shield className="w-6 h-6" /> 核心能力模块
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.skills.map((skill, index) => (
                  <div key={index} className="group border border-border p-4 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-mono font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                      <span className="text-primary opacity-50 text-xs">0{index + 1}</span> {skill.name}
                    </h3>
                    <p className="text-muted text-xs mt-2 leading-relaxed font-mono">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'mechanics' && (
            <section className="bg-card/30 border border-border p-8 rounded-none cyber-border">
              <h2 className="text-2xl font-serif text-accent mb-8 flex items-center gap-3 cyber-glow-text">
                <Cpu className="w-6 h-6" /> 高级机制解析
              </h2>
              <div className="space-y-4">
                {character.mechanics && character.mechanics.length > 0 ? (
                  character.mechanics.map((mech, index) => (
                    <div key={index} className="p-4 bg-bg/50 border border-border">
                      <h4 className="text-sm font-bold text-primary font-mono mb-2">{mech.title}</h4>
                      <p className="text-xs text-muted font-mono leading-relaxed">
                        {mech.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-bg/50 border border-border">
                      <h4 className="text-sm font-bold text-primary font-mono mb-2">博弈技巧</h4>
                      <p className="text-xs text-muted font-mono leading-relaxed">
                        该角色的核心博弈点在于技能的精准释放时机。建议在板窗交互点进行博弈。
                      </p>
                    </div>
                    <div className="p-4 bg-bg/50 border border-border">
                      <h4 className="text-sm font-bold text-primary font-mono mb-2">进阶操作</h4>
                      <p className="text-xs text-muted font-mono leading-relaxed">
                        利用地形优势可以最大化技能收益，特别是在复杂地形中。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const BaseStatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0 hover:bg-white/5 px-2 transition-colors">
    <span className="text-muted">{label}</span>
    <span className="text-text font-bold">{value}</span>
  </div>
);
