import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Plus, Trash2, X, RefreshCcw } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface Wallpaper {
  id: string;
  url: string;
  isCustom: boolean;
}

interface WallpaperManagerProps {
  user: FirebaseUser | null;
  userProfile: any;
}

const DEFAULT_WALLPAPERS: Wallpaper[] = [
  { id: 'default-dark', url: 'https://storage.googleapis.com/m-infra.appspot.com/v0/b/m-infra.appspot.com/o/mc32cnrkrtci62albw45f7%2F1742308781830_1.png?alt=media&token=e5309324-f726-4448-8924-d36885317374', isCustom: false },
  { id: 'default-light', url: 'https://storage.googleapis.com/m-infra.appspot.com/v0/b/m-infra.appspot.com/o/mc32cnrkrtci62albw45f7%2F1742308781830_0.png?alt=media&token=86790539-756d-4731-955a-478696899b82', isCustom: false },
  { id: 'default-1', url: 'https://picsum.photos/seed/manor/1920/1080', isCustom: false },
  { id: 'default-2', url: 'https://picsum.photos/seed/hunter/1920/1080', isCustom: false },
  { id: 'default-3', url: 'https://picsum.photos/seed/survivor/1920/1080', isCustom: false },
];

export const WallpaperManager = ({ user, userProfile }: WallpaperManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(() => {
    const saved = localStorage.getItem('custom_wallpapers');
    return saved ? [...DEFAULT_WALLPAPERS, ...JSON.parse(saved)] : DEFAULT_WALLPAPERS;
  });
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('current_wallpaper') || null;
  });

  // Sync from cloud when user logs in
  useEffect(() => {
    if (userProfile?.settings) {
      if (userProfile.settings.customWallpapers) {
        const custom = userProfile.settings.customWallpapers.map((url: string, index: number) => ({
          id: `custom-${index}-${Date.now()}`,
          url,
          isCustom: true
        }));
        setWallpapers([...DEFAULT_WALLPAPERS, ...custom]);
      }
      if (userProfile.settings.currentWallpaper !== undefined) {
        setCurrentWallpaper(userProfile.settings.currentWallpaper);
      }
    }
  }, [userProfile]);

  // Sync to cloud when changed
  useEffect(() => {
    if (user && userProfile) {
      const customUrls = wallpapers.filter(w => w.isCustom).map(w => w.url);
      const cloudCustomUrls = userProfile.settings?.customWallpapers || [];
      const cloudCurrentWallpaper = userProfile.settings?.currentWallpaper || null;

      if (JSON.stringify(customUrls) !== JSON.stringify(cloudCustomUrls) || currentWallpaper !== cloudCurrentWallpaper) {
        updateDoc(doc(db, 'users', user.uid), {
          'settings.customWallpapers': customUrls,
          'settings.currentWallpaper': currentWallpaper
        }).catch(console.error);
      }
    }
  }, [wallpapers, currentWallpaper, user, userProfile]);

  const [newUrl, setNewUrl] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const customWallpapers = wallpapers.filter(w => w.isCustom);
    localStorage.setItem('custom_wallpapers', JSON.stringify(customWallpapers));
  }, [wallpapers]);

  useEffect(() => {
    if (currentWallpaper) {
      document.documentElement.style.setProperty('--bg-image', `url(${currentWallpaper})`);
      localStorage.setItem('current_wallpaper', currentWallpaper);
    } else {
      document.documentElement.style.removeProperty('--bg-image');
      localStorage.removeItem('current_wallpaper');
    }
  }, [currentWallpaper]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddWallpaper = () => {
    if (!newUrl.trim()) return;
    const newWallpaper: Wallpaper = {
      id: `custom-${Date.now()}`,
      url: newUrl.trim(),
      isCustom: true,
    };
    setWallpapers(prev => [...prev, newWallpaper]);
    setNewUrl('');
  };

  const handleRemoveWallpaper = (id: string) => {
    setWallpapers(prev => prev.filter(w => w.id !== id));
    if (currentWallpaper === wallpapers.find(w => w.id === id)?.url) {
      setCurrentWallpaper(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 border border-border bg-bg/50 text-muted hover:text-accent hover:border-accent transition-all"
        title="切换壁纸"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border z-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
            <h3 className="text-sm font-bold text-accent font-mono tracking-widest">壁纸设置_WALLPAPER</h3>
            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto pr-1">
            <button
              onClick={() => setCurrentWallpaper(null)}
              className={`relative aspect-video border flex flex-col items-center justify-center gap-1 transition-all ${
                currentWallpaper === null ? 'border-accent text-accent' : 'border-border text-muted hover:border-accent/50 hover:text-accent/50'
              }`}
            >
              <RefreshCcw className="w-5 h-5" />
              <span className="text-[10px] font-mono">默认壁纸</span>
            </button>
            
            {wallpapers.map(wp => (
              <div key={wp.id} className="relative group aspect-video border border-border overflow-hidden">
                <img 
                  src={wp.url} 
                  alt="Wallpaper" 
                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                  onClick={() => setCurrentWallpaper(wp.url)}
                  referrerPolicy="no-referrer"
                />
                {currentWallpaper === wp.url && (
                  <div className="absolute inset-0 border-2 border-accent pointer-events-none" />
                )}
                {wp.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWallpaper(wp.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-bg/90 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="输入图片 URL..."
                className="flex-1 bg-bg border border-border text-xs p-2 text-text outline-none focus:border-accent font-mono"
              />
              <button
                onClick={handleAddWallpaper}
                disabled={!newUrl.trim()}
                className="px-3 py-2 bg-accent/10 text-accent border border-accent/50 hover:bg-accent hover:text-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted font-mono">推荐壁纸比例为 16:9 (如 1920x1080)</p>
          </div>
        </div>
      )}
    </div>
  );
};
