import { Character, MOCK_CHARACTERS } from '../constants';
import { Activity, Shield, Target } from 'lucide-react';

export const CharacterComparison = () => {
  const chars = MOCK_CHARACTERS.slice(0, 4); // Show a few for comparison

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-serif text-accent">角色档案对比</h2>
          <p className="text-muted font-mono text-xs uppercase tracking-widest">ARCHIVE COMPARISON_V5.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {chars.map((char) => (
          <div key={char.id} className="bg-card/30 border border-border p-6 rounded-none cyber-border flex flex-col space-y-6">
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <div className="relative w-16 h-16 cyber-border overflow-hidden">
                <img src={char.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-accent font-serif text-xl">{char.name}</h3>
                <p className="text-muted text-xs font-mono">{char.title} | {char.role === 'Survivor' ? '求生者' : '监管者'}</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-2">
                <Activity className="w-3 h-3" /> 核心特质
              </div>
              <div className="grid grid-cols-1 gap-2">
                {char.traits && char.traits.length > 0 ? (
                  char.traits.slice(0, 2).map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-[9px] text-accent/70 font-bold border-b border-accent/20 mb-1">{cat.category}</div>
                      {cat.items.slice(0, 3).map((item, j) => (
                        <div key={j} className="flex justify-between text-[10px] font-mono py-0.5">
                          <span className="text-muted">{item.label}</span>
                          <span className="text-text">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted italic">暂无详细特质数据</p>
                )}
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-2">
                  <Shield className="w-3 h-3" /> 外在特质
                </div>
                <div className="flex flex-wrap gap-2">
                  {char.skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[9px] font-mono">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
