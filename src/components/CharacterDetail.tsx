import React, { useState } from 'react';
import { Character, COLORS } from '../constants';
import { Shield, Zap, Heart, Users, Search, Activity, Target, Layers, Cpu, Edit3, Trash2 } from 'lucide-react';

type DetailTab = 'traits' | 'external' | 'mechanics';

interface Props {
  character: Character;
  allCharacters?: Character[];
  onEdit?: (char: Character) => void;
  onDelete?: (char: Character) => void;
  onViewFactors?: (category: string) => void;
  onViewTalent?: (char: Character) => void;
  onViewAuxiliaryTrait?: (char: Character) => void;
}

export const CharacterDetail = ({ character, allCharacters, onEdit, onDelete, onViewFactors, onViewTalent, onViewAuxiliaryTrait }: Props) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('traits');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const baseCharacter = allCharacters?.find(c => 
    c.id === (character.role === 'Survivor' ? 'base_survivor' : 'base_hunter')
  );

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
            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-serif font-bold text-accent cyber-glow-text mb-1">
              {character.title}
            </h1>
            <p className="text-xl text-text font-mono italic opacity-70 tracking-tighter">{character.name}</p>
          </div>
          <div className="absolute top-4 right-4 bg-primary px-2 py-1 text-xs font-mono text-white cyber-glitch">
            ID: {String(character.order !== undefined ? character.order : character.id).padStart(4, '0')}
          </div>
          
          {onEdit && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
              <button 
                onClick={() => onEdit(character)}
                className="px-3 py-1.5 bg-accent text-bg hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest"
              >
                <Edit3 className="w-3.5 h-3.5" />
                编辑档案_EDIT
              </button>
              {onDelete && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除档案_DELETE
                </button>
              )}
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-card border border-primary p-8 max-w-md w-full cyber-border animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-serif text-primary mb-4 flex items-center gap-3">
                <Trash2 className="w-6 h-6" /> 确认删除档案？
              </h3>
              <p className="text-muted text-sm font-mono mb-8 leading-relaxed">
                您正在尝试删除角色 <span className="text-accent font-bold">{character.title} ({character.name})</span> 的档案。此操作不可逆，所有关联数据将被永久移除。
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-border text-muted hover:text-text hover:border-text transition-all font-mono text-xs tracking-widest"
                >
                  取消_CANCEL
                </button>
                <button 
                  onClick={() => {
                    onDelete?.(character);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-3 bg-primary text-white hover:bg-primary/80 transition-all font-mono text-xs tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.3)]"
                >
                  确认删除_CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card/50 border border-border p-6 rounded-none cyber-border space-y-4">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <span className="text-muted uppercase text-xs font-mono tracking-widest">阵营 FACTION</span>
            <span className="text-primary font-bold font-mono text-sm">{character.role === 'Survivor' ? '求生者' : '监管者'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted uppercase text-xs font-mono tracking-widest">定位 TYPE</span>
            <span className="text-text font-mono text-sm">{character.type}</span>
          </div>
          
          <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
            <button 
              onClick={() => onViewTalent?.(character)}
              className="w-full py-2 bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-bg transition-colors font-mono text-sm font-bold flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> 天赋页面_TALENT
            </button>
            {character.role === 'Hunter' && (
              <button 
                onClick={() => onViewAuxiliaryTrait?.(character)}
                className="w-full py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-colors font-mono text-sm font-bold flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> 辅助特质_AUXILIARY
              </button>
            )}
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
              <span className="text-xs font-bold tracking-widest uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8 animate-in fade-in duration-500">
          {activeTab === 'traits' && (
            <section className="bg-card/30 border border-border p-8 rounded-none cyber-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-muted opacity-20">系统分析_V2.0</div>
              <h2 className="text-2xl font-serif text-accent mb-8 flex items-center gap-3 cyber-glow-text">
                <Activity className="w-6 h-6" /> 核心特质分析
              </h2>
              
              {character.traits && character.traits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm">
                  {character.traits.filter(cat => cat.items.length > 0).map((cat, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-primary font-bold mb-2 border-b border-primary/30 pb-1 flex justify-between items-center">
                        <span>{cat.category}</span>
                        {onViewFactors && (
                          <button 
                            onClick={() => onViewFactors(cat.category)}
                            className="text-[10px] text-accent hover:text-white transition-colors flex items-center gap-1 font-mono uppercase tracking-tighter"
                          >
                            影响因素_FACTORS <Search className="w-3 h-3" />
                          </button>
                        )}
                      </h3>
                      <div className="space-y-1">
                        {cat.items.map((item, j) => {
                          const baseCat = baseCharacter?.traits?.find(bc => 
                            bc.category.split(' ')[0] === cat.category.split(' ')[0]
                          );
                          const baseItem = baseCat?.items.find(bi => bi.label === item.label);
                          const isDifferent = character.role === 'Survivor' && baseItem && baseItem.value !== item.value;

                          return (
                            <BaseStatItem 
                              key={j} 
                              label={item.label} 
                              value={item.value} 
                              isDifferent={!!isDifferent}
                              baseValue={character.role === 'Survivor' ? baseItem?.value : undefined}
                            />
                          );
                        })}
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
                    <p className="text-sm font-mono uppercase tracking-widest">暂无详细特质数据</p>
                    <p className="text-xs mt-2">请在录入页面完善该角色的特质信息</p>
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
                      <span className="text-primary opacity-50 text-sm">0{index + 1}</span> {skill.name}
                    </h3>
                    <p className="text-muted text-sm mt-2 leading-relaxed font-mono">
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
                      <h4 className="text-base font-bold text-primary font-mono mb-2">{mech.title}</h4>
                      <p className="text-sm text-muted font-mono leading-relaxed">
                        {mech.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-bg/50 border border-border">
                      <h4 className="text-base font-bold text-primary font-mono mb-2">博弈技巧</h4>
                      <p className="text-sm text-muted font-mono leading-relaxed">
                        该角色的核心博弈点在于技能的精准释放时机。建议在板窗交互点进行博弈。
                      </p>
                    </div>
                    <div className="p-4 bg-bg/50 border border-border">
                      <h4 className="text-base font-bold text-primary font-mono mb-2">进阶操作</h4>
                      <p className="text-sm text-muted font-mono leading-relaxed">
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

const BaseStatItem = ({ label, value, isDifferent, baseValue }: { label: string; value: string; isDifferent?: boolean; baseValue?: string }) => (
  <div className={`flex justify-between items-center py-1 border-b border-border/30 last:border-0 hover:bg-white/5 px-2 transition-colors ${isDifferent ? 'bg-primary/5' : ''}`}>
    <span className="text-muted">{label}</span>
    <div className="flex flex-col items-end">
      <span className={`font-bold ${isDifferent ? 'text-primary cyber-glow-text' : 'text-text'}`}>{value}</span>
      {isDifferent && baseValue && (
        <span className="text-[9px] text-muted font-mono line-through opacity-50">标准: {baseValue}</span>
      )}
    </div>
  </div>
);
