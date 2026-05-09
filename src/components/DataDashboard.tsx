import React from 'react';
import { MOCK_CHARACTERS } from '../constants';
import { TrendingUp, Users, ShieldAlert, Activity, PieChart } from 'lucide-react';

export const DataDashboard = () => {
  const survivorCount = MOCK_CHARACTERS.filter(c => c.role === 'Survivor').length;
  const hunterCount = MOCK_CHARACTERS.filter(c => c.role === 'Hunter').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard icon={<Users />} label="收录角色" value={MOCK_CHARACTERS.length.toString()} sub="本周 +2" />
        <DashboardCard icon={<TrendingUp />} label="热门角色" value="先知" sub="胜率 54%" />
        <DashboardCard icon={<ShieldAlert />} label="最高生存" value="佣兵" sub="评分 98" />
        <DashboardCard icon={<Activity />} label="活跃攻略" value="128" sub="今日 +12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card/30 border border-border p-8 rounded-none rounded-2xl shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-sans font-bold tracking-tight text-xl mb-8 flex items-center gap-3">
            <PieChart className="w-6 h-6" /> 阵营分布分析
          </h3>
          <div className="flex items-center justify-center h-[300px] relative">
            <div className="flex gap-12 items-end">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 bg-primary/20 border border-primary relative group" style={{ height: `${(survivorCount / MOCK_CHARACTERS.length) * 200}px` }}>
                  <div className="absolute inset-0 bg-primary opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary font-medium font-bold">{survivorCount}</div>
                </div>
                <span className="text-xs font-medium text-muted uppercase tracking-widest">求生者</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 bg-slate-800 dark:bg-slate-200/20 border border-slate-800 dark:border-slate-200 relative group" style={{ height: `${(hunterCount / MOCK_CHARACTERS.length) * 200}px` }}>
                  <div className="absolute inset-0 bg-slate-800 dark:bg-slate-200 opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-slate-800 dark:text-slate-100 font-medium font-bold">{hunterCount}</div>
                </div>
                <span className="text-xs font-medium text-muted uppercase tracking-widest">监管者</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/30 border border-border p-8 rounded-none rounded-2xl shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-sans font-bold tracking-tight text-xl mb-8">最新录入角色</h3>
          <div className="space-y-4">
            {MOCK_CHARACTERS.slice(0, 5).map(char => (
              <div key={char.id} className="flex items-center justify-between p-4 bg-bg/50 border border-border hover:border-slate-800 dark:border-slate-200 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <img src={char.imageUrl} className="w-10 h-10 object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                  <div>
                    <div className="text-text font-bold group-hover:text-slate-800 dark:text-slate-100 transition-colors">{char.name}</div>
                    <div className="text-[10px] text-muted uppercase tracking-widest font-medium">{char.title}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-medium text-[10px] uppercase">{char.role === 'Survivor' ? '求生者' : '监管者'}</div>
                  <div className="text-[10px] text-muted font-medium">2024-03-15</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
  <div className="bg-card/30 border border-border p-6 rounded-none rounded-2xl shadow-sm relative overflow-hidden group">
    <div className="absolute -right-4 -bottom-4 text-border opacity-10 group-hover:scale-110 transition-transform duration-500">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 80 })}
    </div>
    <div className="relative z-10">
      <div className="text-[10px] text-muted uppercase tracking-widest mb-1 font-medium">{label}</div>
      <div className="text-3xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1">{value}</div>
      <div className="text-xs text-primary font-medium">{sub}</div>
    </div>
  </div>
);
