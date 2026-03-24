import { useEffect, useState, useRef } from 'react';
import { Character, MOCK_CHARACTERS, WikiEntry, SURVIVOR_TRAITS_TEMPLATE, SURVIVOR_TRAITS_MODERN_TEMPLATE } from './constants';
import { CharacterForm } from './components/CharacterForm';
import { CharacterDetail } from './components/CharacterDetail';
import { TraitFactorsView } from './components/TraitFactorsView';
import { CharacterExtensionView } from './components/CharacterExtensionView';
import { WikiEditor } from './components/WikiEditor';
import { WikiEntryView } from './components/WikiEntryView';
import { Leaderboard } from './components/Leaderboard';
import { MapList } from './components/MapList';
import { TalentWeb } from './components/TalentWeb';
import { BulkImport } from './components/BulkImport';
import { WikiSearch } from './components/WikiSearch';
import { WallpaperManager } from './components/WallpaperManager';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { Skull, Map as MapIcon, ShieldCheck, Swords, Plus, Book, Search, LogIn, LogOut, User as UserIcon, Edit3, Settings, Sun, Moon, Trophy, ChevronLeft, ChevronRight, RefreshCcw, Network, FileJson } from 'lucide-react';

type Tab = 'survivors' | 'hunters' | 'maps' | 'wiki' | 'leaderboard' | 'talents';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [characters, setCharacters] = useState<Character[]>(MOCK_CHARACTERS);
  const [activeTab, setActiveTab] = useState<Tab>('wiki');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [viewingFactors, setViewingFactors] = useState<{ characterId: string; characterName: string; category: string } | null>(null);
  const [viewingExtension, setViewingExtension] = useState<{ character: Character; type: 'talent' | 'auxiliary' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  
  // Wiki State
  const [selectedWikiEntry, setSelectedWikiEntry] = useState<WikiEntry | null>(null);
  const [isEditingWiki, setIsEditingWiki] = useState(false);
  const [isBulkImportingWiki, setIsBulkImportingWiki] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Sync theme to Firestore when changed
  useEffect(() => {
    if (user && userProfile && userProfile.settings?.isDarkMode !== isDarkMode) {
      updateDoc(doc(db, 'users', user.uid), {
        'settings.isDarkMode': isDarkMode
      }).catch(console.error);
    }
  }, [isDarkMode, user, userProfile]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const role = currentUser.email === 'wmglimpser@gmail.com' ? 'admin' : 'user';
          const newProfile = {
            displayName: currentUser.displayName || '庄园访客',
            role,
            contributions: 0,
            settings: {
              isDarkMode: isDarkMode,
              activeTalents: {}
            }
          };
          await setDoc(userRef, newProfile);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time user profile listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserProfile(data);
        // Sync theme from cloud if it exists
        if (data.settings?.isDarkMode !== undefined && data.settings.isDarkMode !== isDarkMode) {
          setIsDarkMode(data.settings.isDarkMode);
        }
      }
    });

    return () => unsubscribe();
  }, [user, isDarkMode]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'characters'), (snapshot) => {
      const dbChars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Merge mock characters with DB characters, prioritizing DB
      let merged = [...MOCK_CHARACTERS];
      dbChars.forEach(dbChar => {
        const index = merged.findIndex(m => m.id === dbChar.id);
        if (dbChar.deleted) {
          if (index !== -1) merged.splice(index, 1);
        } else {
          if (index !== -1) {
            merged[index] = dbChar as Character;
          } else {
            merged.push(dbChar as Character);
          }
        }
      });
      setCharacters(merged);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCharacter) {
      const updated = characters.find(c => c.id === selectedCharacter.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedCharacter)) {
        setSelectedCharacter(updated);
      }
    }
  }, [characters, selectedCharacter]);

  const handleSyncCharacterOrders = async (silent = true) => {
    if (!isAdminUser || characters.length === 0) return;

    const updates: { id: string, order: number }[] = [];

    for (const char of characters) {
      let targetOrder = char.order;
      // Derive order from ID if it follows sX or hX pattern
      if (char.id.startsWith('s')) {
        const num = parseInt(char.id.substring(1));
        if (!isNaN(num)) targetOrder = num;
      } else if (char.id.startsWith('h')) {
        const num = parseInt(char.id.substring(1));
        if (!isNaN(num)) targetOrder = 99 + num;
      }

      if (targetOrder !== char.order) {
        updates.push({ id: char.id, order: targetOrder });
      }
    }

    if (updates.length === 0) {
      if (!silent) alert("数据已是最新，无需同步排序。");
      return;
    }

    if (!silent && !window.confirm(`检测到 ${updates.length} 个角色的排序 ID 需要同步，是否继续？`)) {
      return;
    }

    console.log("Syncing character IDs...", updates.length, "updates pending");
    for (const update of updates) {
      try {
        await updateDoc(doc(db, 'characters', update.id), {
          order: update.order,
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        // Likely mock character or permission issue
      }
    }
    if (!silent) alert("同步完成！所有角色已按 ID 重新排序。");
  };

  // Hidden Auto-Sync for Admin to fix character IDs/orders
  useEffect(() => {
    handleSyncCharacterOrders(true);
  }, [user, userProfile, characters]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const survivors = characters
    .filter(c => c.role === 'Survivor')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hunters = characters
    .filter(c => c.role === 'Hunter')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const navItems = [
    { id: 'wiki', label: '庄园秘典', icon: <Book className="w-4 h-4" /> },
    { id: 'leaderboard', label: '排行榜', icon: <Trophy className="w-4 h-4" /> },
    { id: 'survivors', label: '求生者', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'hunters', label: '监管者', icon: <Swords className="w-4 h-4" /> },
    { id: 'maps', label: '地图', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'talents', label: '天赋系统', icon: <Network className="w-4 h-4" /> },
  ];

  const handleUpdateCharacter = async (charId: string, data: Partial<Character>) => {
    if (!isContributor) {
      alert("您没有权限修改档案数据。");
      return;
    }

    try {
      await setDoc(doc(db, 'characters', charId), {
        ...data,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `characters/${charId}`);
    }
  };

  const handleSaveCharacter = async (charData: any) => {
    if (!isContributor) {
      alert("您没有权限修改档案数据。请联系管理员获取贡献者权限。");
      return;
    }

    const validateChar = (data: any) => {
      if (!data.name || !data.title || !data.role) {
        throw new Error(`角色数据不完整: ${data.name || data.title || '未知角色'} (需要姓名、称号和阵营)`);
      }
    };

    try {
      if (Array.isArray(charData)) {
        // Bulk save multiple characters
        for (const data of charData) {
          validateChar(data);
          try {
            await addDoc(collection(db, 'characters'), {
              ...data,
              imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.name}/400/600`,
              skills: data.skills && data.skills.length > 0 
                ? data.skills 
                : [{ name: '初始技能', description: '该角色尚未配置详细技能说明。' }],
              lastUpdated: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'characters');
          }
        }
      } else if (isEditingCharacter && selectedCharacter) {
        validateChar(charData);
        try {
          await setDoc(doc(db, 'characters', selectedCharacter.id), {
            ...charData,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `characters/${selectedCharacter.id}`);
        }
      } else {
        validateChar(charData);
        try {
          await addDoc(collection(db, 'characters'), {
            ...charData,
            imageUrl: charData.imageUrl || `https://picsum.photos/seed/${charData.name}/400/600`,
            skills: charData.skills && charData.skills.length > 0 
              ? charData.skills 
              : [{ name: '初始技能', description: '该角色尚未配置详细技能说明。' }],
            lastUpdated: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'characters');
        }
      }
      
      if (!Array.isArray(charData)) {
        if (charData.role === 'Survivor') setActiveTab('survivors');
        if (charData.role === 'Hunter') setActiveTab('hunters');
      }
      
      setShowForm(false);
      setIsEditingCharacter(false);
      // Keep selectedCharacter if we were editing it
      if (!isEditingCharacter) {
        setSelectedCharacter(null);
      }
    } catch (error: any) {
      console.error("Error saving character:", error);
      alert(error.message || "保存失败，请检查数据格式。");
      throw error;
    }
  };

  const handleDeleteCharacter = async (char: Character) => {
    if (!isAdminUser) {
      alert("只有管理员可以删除档案。");
      return;
    }

    try {
      const isMock = MOCK_CHARACTERS.some(m => m.id === char.id);
      if (isMock) {
        // Soft delete for mock characters so they don't reappear from the local constant
        await setDoc(doc(db, 'characters', char.id), { deleted: true, lastUpdated: serverTimestamp() });
      } else {
        // Hard delete for purely DB characters
        await deleteDoc(doc(db, 'characters', char.id));
      }
      setSelectedCharacter(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `characters/${char.id}`);
    }
  };

  const handleSyncSurvivorTraits = async () => {
    if (!isAdminUser) {
      alert("只有管理员可以同步数据。");
      return;
    }

    if (!window.confirm("确定要将所有求生者的特质详情同步为标准格式吗？这可能会覆盖现有的自定义数值。")) {
      return;
    }

    try {
      const survivorsToSync = characters.filter(c => c.role === 'Survivor' && !c.id.startsWith('base_'));
      const modernIds = Array.from({ length: 26 }, (_, i) => `s${i + 23}`); // s23 to s48
      
      for (const survivor of survivorsToSync) {
        const template = modernIds.includes(survivor.id) 
          ? SURVIVOR_TRAITS_MODERN_TEMPLATE 
          : SURVIVOR_TRAITS_TEMPLATE;
          
        try {
          await updateDoc(doc(db, 'characters', survivor.id), {
            traits: JSON.parse(JSON.stringify(template)),
            lastUpdated: serverTimestamp()
          });
        } catch (e) {
          console.log(`Skipping sync for ${survivor.name} (likely mock character)`);
        }
      }
      alert("同步完成！所有求生者的特质详情已更新为标准格式。");
    } catch (err) {
      console.error("Sync error:", err);
      alert("同步过程中出现错误。");
    }
  };

  return (
    <div 
      className="min-h-screen bg-bg text-text font-sans selection:bg-primary selection:text-white relative bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: 'var(--bg-overlay), var(--bg-image)' }}
    >
      <div className="scanline" />
      
      {/* Header */}
      <header className="border-b border-border bg-card/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary flex items-center justify-center shadow-[0_0_20px_#ff003c] rotate-45 overflow-hidden">
                <img 
                  src="https://id5.res.netease.com/pc/zt/20220110193643/img/icon1_9b4384f.png" 
                  alt="Logo"
                  className="w-8 h-8 -rotate-45 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold tracking-tighter text-accent cyber-glow-text">
                  庄园秘典 <span className="text-primary">CODEX</span>
                </h1>
                <div className="text-[11px] font-mono text-muted tracking-[0.5em] uppercase">神经连接接口 v5.0.0</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <WallpaperManager user={user} userProfile={userProfile} />
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 border border-border bg-bg/50 text-muted hover:text-accent hover:border-accent transition-all"
                  title={isDarkMode ? '切换至明亮模式' : '切换至黑暗模式'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-4 bg-bg/50 border border-border px-4 py-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-accent">{userProfile?.displayName}</span>
                    <span className="text-[10px] text-muted uppercase tracking-widest">{userProfile?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="text-muted hover:text-primary transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/50 text-accent text-xs font-mono hover:bg-accent hover:text-bg transition-all"
                >
                  <LogIn className="w-4 h-4" /> 接入系统_LOGIN
                </button>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 bg-bg/50 p-1 border border-border">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setShowForm(false);
                    setIsEditingWiki(false);
                    setSelectedWikiEntry(null);
                    setViewingFactors(null);
                    setViewingExtension(null);
                  }}
                  className={`px-8 py-2 flex items-center gap-3 transition-all duration-300 relative group overflow-hidden ${
                    activeTab === item.id 
                      ? 'text-accent' 
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {activeTab === item.id && (
                    <div className="absolute inset-0 bg-accent/10 border-b-2 border-accent" />
                  )}
                  <div className={`${activeTab === item.id ? 'text-accent' : 'text-muted group-hover:text-primary'} transition-colors`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative min-h-[60vh]">
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {activeTab === 'wiki' && (
          <div className="space-y-12 relative z-10">
            {!selectedWikiEntry && !isEditingWiki && (
              <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-serif font-bold text-accent cyber-glow-text">探索庄园的终极真相</h2>
                  <p className="text-muted text-sm font-mono max-w-xl mx-auto">
                    这里是欧利蒂丝庄园的知识库。从角色技巧到地图点位，所有攻略均由社区共同维护。
                  </p>
                </div>
                <WikiSearch 
                  onSelect={setSelectedWikiEntry} 
                  onSelectCharacter={(char) => {
                    setActiveTab(char.role === 'Survivor' ? 'survivors' : 'hunters');
                    setSelectedCharacter(char);
                    setShowForm(false);
                    setIsEditingWiki(false);
                    setSelectedWikiEntry(null);
                    setViewingFactors(null);
                    setViewingExtension(null);
                  }}
                />
                <div className="flex justify-center gap-6 pt-8">
                  {(userProfile?.role === 'admin' || userProfile?.role === 'contributor' || user?.email === 'wmglimpser@gmail.com') && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditingWiki(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.3)] hover:scale-105 transition-all"
                      >
                        <Plus className="w-4 h-4" /> 创建新词条_NEW
                      </button>
                      <button 
                        onClick={() => setIsBulkImportingWiki(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-card border border-border text-muted font-mono text-sm tracking-widest hover:text-accent hover:border-accent transition-all"
                      >
                        <FileJson className="w-4 h-4" /> 批量导入_BULK
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEditingWiki && (
              <WikiEditor 
                entry={selectedWikiEntry || undefined} 
                onSave={() => {
                  setIsEditingWiki(false);
                  setSelectedWikiEntry(null);
                }} 
                onCancel={() => setIsEditingWiki(false)} 
              />
            )}

            {isBulkImportingWiki && (
              <BulkImport 
                mode="wiki" 
                onClose={() => setIsBulkImportingWiki(false)} 
                onSuccess={() => setIsBulkImportingWiki(false)} 
              />
            )}

            {selectedWikiEntry && !isEditingWiki && (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedWikiEntry(null)}
                  className="text-muted hover:text-accent flex items-center gap-2 text-xs font-mono tracking-widest transition-colors"
                >
                  ← 返回搜索_BACK
                </button>
                <WikiEntryView 
                  entry={selectedWikiEntry} 
                  onEdit={() => setIsEditingWiki(true)} 
                  userProfile={userProfile}
                  user={user}
                />
              </div>
            )}
          </div>
        )}

        {(activeTab === 'survivors' || activeTab === 'hunters') && (
          <div className="space-y-12 relative z-10">
            <div className="relative group/nav pb-8">
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-10 h-10 bg-card border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all opacity-0 group-hover/nav:opacity-100 shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div 
                ref={scrollContainerRef}
                className="flex flex-nowrap gap-4 items-center overflow-x-auto no-scrollbar scroll-smooth px-2"
              >
                {(activeTab === 'survivors' ? survivors : hunters).map(char => (
                  <button
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setShowForm(false);
                      setIsEditingCharacter(false);
                      setViewingFactors(null);
                      setViewingExtension(null);
                    }}
                    className={`group relative w-20 h-20 flex-shrink-0 transition-all duration-200 ${
                      selectedCharacter?.id === char.id && !showForm && !isEditingCharacter
                        ? 'scale-110 z-20' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className={`absolute inset-0 border bg-transparent transition-colors duration-200 ${
                      selectedCharacter?.id === char.id && !showForm && !isEditingCharacter 
                        ? 'border-accent' 
                        : 'border-border/20'
                    }`} />
                    <div className="absolute inset-0 overflow-hidden">
                      <img 
                        src={char.imageUrl} 
                        className={`w-full h-full object-contain transition-all duration-200 ${
                          selectedCharacter?.id === char.id && !showForm && !isEditingCharacter
                            ? 'brightness-100' 
                            : 'brightness-0 opacity-50 group-hover:brightness-100 group-hover:opacity-100'
                        }`} 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="absolute -bottom-5 left-0 right-0 text-[9px] font-mono font-bold text-muted group-hover:text-accent transition-colors text-center truncate uppercase tracking-tighter">
                      {char.title}
                    </div>
                  </button>
                ))}
                
                {(userProfile?.role === 'admin' || user?.email === 'wmglimpser@gmail.com') && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setShowForm(true)}
                      className={`w-20 h-20 border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:text-accent hover:border-accent transition-all ${showForm ? 'border-accent text-accent bg-accent/5' : ''}`}
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-bold">添加{activeTab === 'survivors' ? '求生者' : '监管者'}</span>
                    </button>
                    {activeTab === 'survivors' && (
                      <button 
                        onClick={handleSyncSurvivorTraits}
                        className="text-[9px] font-mono text-accent/50 hover:text-accent transition-colors uppercase tracking-tighter text-center"
                      >
                        [同步标准特质]
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-10 h-10 bg-card border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all opacity-0 group-hover/nav:opacity-100 shadow-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {showForm || isEditingCharacter ? (
              <CharacterForm 
                onSave={handleSaveCharacter} 
                onCancel={() => {
                  setShowForm(false);
                  setIsEditingCharacter(false);
                }} 
                onDelete={handleDeleteCharacter}
                initialData={isEditingCharacter ? selectedCharacter || undefined : undefined}
                allCharacters={characters}
                nextSurvivorOrder={Math.max(...characters.filter(c => c.role === 'Survivor').map(c => c.order || 0), 0) + 1}
                nextHunterOrder={Math.max(...characters.filter(c => c.role === 'Hunter').map(c => c.order || 0), 99) + 1}
              />
            ) : viewingFactors ? (
              <TraitFactorsView 
                characterId={viewingFactors.characterId}
                characterName={viewingFactors.characterName}
                category={viewingFactors.category}
                allCharacters={characters}
                baseItems={selectedCharacter?.traits?.find(t => t.category === viewingFactors.category)?.items || []}
                onBack={() => setViewingFactors(null)}
              />
            ) : viewingExtension ? (
              <CharacterExtensionView
                character={viewingExtension.character}
                type={viewingExtension.type}
                onBack={() => setViewingExtension(null)}
                canEdit={isContributor}
              />
            ) : (
              selectedCharacter && (
                <CharacterDetail 
                  character={selectedCharacter} 
                  allCharacters={characters}
                  onEdit={(userProfile?.role === 'admin' || user?.email === 'wmglimpser@gmail.com') ? () => setIsEditingCharacter(true) : undefined}
                  onDelete={(userProfile?.role === 'admin' || user?.email === 'wmglimpser@gmail.com') ? handleDeleteCharacter : undefined}
                  onViewFactors={(category) => setViewingFactors({ 
                    characterId: selectedCharacter.id, 
                    characterName: selectedCharacter.name, 
                    category 
                  })}
                  onViewTalent={(char) => setViewingExtension({ character: char, type: 'talent' })}
                  onViewAuxiliaryTrait={(char) => setViewingExtension({ character: char, type: 'auxiliary' })}
                  onUpdate={handleUpdateCharacter}
                />
              )
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard 
            characters={characters} 
            onRefresh={() => handleSyncCharacterOrders(false)}
            isAdmin={user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin'}
          />
        )}

        {activeTab === 'maps' && <MapList user={user} userProfile={userProfile} />}
        {activeTab === 'talents' && (
          <TalentWeb 
            user={user} 
            userProfile={userProfile} 
            onViewWiki={async (entryId) => {
              try {
                const entryDoc = await getDoc(doc(db, 'entries', entryId));
                if (entryDoc.exists()) {
                  setSelectedWikiEntry({ id: entryDoc.id, ...entryDoc.data() } as WikiEntry);
                  setActiveTab('wiki');
                }
              } catch (err) {
                console.error("Error fetching wiki entry:", err);
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-card/50 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-accent font-serif font-bold text-xl cyber-glow-text">庄园秘典 CODEX</h3>
            <p className="text-muted text-xs leading-relaxed">
              为庄园求生者与监管者提供的高级神经接口。
              自2018年起持续破解欧利蒂丝庄园的秘密。
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            <span className="text-primary uppercase tracking-widest mb-2">快速访问</span>
            <a href="#" className="text-muted hover:text-accent transition-colors">官方网站</a>
            <a href="#" className="text-muted hover:text-accent transition-colors">数据库 V4</a>
            <a href="#" className="text-muted hover:text-accent transition-colors">地图侦察</a>
          </div>
          <div className="text-right space-y-4">
            <div className="inline-block px-4 py-2 border border-primary text-primary text-xs font-mono cyber-glitch">
              系统状态: 正常运行
            </div>
            <p className="text-xs text-muted font-mono uppercase tracking-[0.2em]">
              © 2026 NEURAL_MANOR_OS. 保留所有权利。
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-card/90 border border-accent/30 rounded-none p-2 flex justify-around shadow-[0_0_30px_rgba(0,243,255,0.2)] z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`p-4 transition-all ${
              activeTab === item.id ? 'text-accent scale-110' : 'text-muted'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
