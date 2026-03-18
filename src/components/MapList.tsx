import React from 'react';
import { MOCK_MAPS } from '../constants';
import { Map as MapIcon, Info } from 'lucide-react';

export const MapList = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-accent cyber-glow-text">庄园地图侦察</h2>
          <p className="text-muted font-mono text-xs tracking-widest uppercase">地形分析与战术数据</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_MAPS.map((map) => (
          <div key={map.id} className="group bg-card/30 cyber-border overflow-hidden hover:border-accent transition-all duration-500">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={map.imageUrl} 
                alt={map.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-80" />
              <div className="absolute bottom-3 left-4">
                <span className={`text-[9px] font-mono px-2 py-0.5 border ${
                  map.difficulty === 'Easy' ? 'border-emerald-500 text-emerald-500' : 
                  map.difficulty === 'Medium' ? 'border-amber-500 text-amber-500' : 'border-primary text-primary'
                }`}>
                  {map.difficulty === 'Easy' ? '低威胁' : map.difficulty === 'Medium' ? '中等威胁' : '极高威胁'}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-serif text-accent flex items-center gap-2">
                <MapIcon className="w-5 h-5" /> {map.name}
              </h3>
              <p className="text-muted text-xs font-mono leading-relaxed h-12 overflow-hidden">
                {map.description}
              </p>
              <button className="w-full py-2 bg-bg border border-border text-text text-[10px] font-mono uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2">
                <Info className="w-4 h-4" /> 初始化扫描
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
