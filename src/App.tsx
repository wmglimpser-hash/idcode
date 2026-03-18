import { useEffect, useState } from 'react';
import { Character, MOCK_CHARACTERS, WikiEntry } from './constants';
import { CharacterForm } from './components/CharacterForm';
import { CharacterDetail } from './components/CharacterDetail';
import { WikiEditor } from './components/WikiEditor';
import { WikiEntryView } from './components/WikiEntryView';
import { WikiModeration } from './components/WikiModeration';
import { batchImportSurvivors } from './utils/batchImport';
import { Leaderboard } from './components/Leaderboard';
import { MapList } from './components/MapList';
import { WikiSearch } from './components/WikiSearch';
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
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { Skull, Map as MapIcon, ShieldCheck, Swords, Plus, Book, Search, LogIn, LogOut, User as UserIcon, Edit3, Settings, Sun, Moon, Trophy } from 'lucide-react';

type Tab = 'survivors' | 'hunters' | 'maps' | 'wiki' | 'leaderboard' | 'moderation';

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
  const [showForm, setShowForm] = useState(false);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  
  // Wiki State
  const [selectedWikiEntry, setSelectedWikiEntry] = useState<WikiEntry | null>(null);
  const [isEditingWiki, setIsEditingWiki] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

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
        // Sync user profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          const role = currentUser.email === 'wmglimpser@gmail.com' ? 'admin' : 'user';
          const newProfile = {
            displayName: currentUser.displayName || '庄园访客',
            role,
            contributions: 0
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setUserProfile(newProfile);
        } else {
          const data = userDoc.data();
          // Auto-upgrade wmglimpser to admin if they are just a user
          if (currentUser.email === 'wmglimpser@gmail.com' && data?.role === 'user') {
            await updateDoc(doc(db, 'users', currentUser.uid), { role: 'admin' });
            setUserProfile({ ...data, role: 'admin' });
          } else {
            setUserProfile(data);
          }
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'characters'), (snapshot) => {
      const dbChars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
      if (dbChars.length > 0) {
        // Merge mock characters with DB characters, prioritizing DB
        const merged = [...MOCK_CHARACTERS];
        dbChars.forEach(dbChar => {
          const index = merged.findIndex(m => m.id === dbChar.id);
          if (index !== -1) {
            merged[index] = dbChar;
          } else {
            merged.push(dbChar);
          }
        });
        setCharacters(merged);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const survivors = characters.filter(c => c.role === 'Survivor');
  const hunters = characters.filter(c => c.role === 'Hunter');

  const navItems = [
    { id: 'wiki', label: '庄园秘典', icon: <Book className="w-4 h-4" /> },
    { id: 'leaderboard', label: '排行榜', icon: <Trophy className="w-4 h-4" /> },
    { id: 'survivors', label: '求生者', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'hunters', label: '监管者', icon: <Swords className="w-4 h-4" /> },
    { id: 'maps', label: '地图档案', icon: <MapIcon className="w-4 h-4" /> },
    ...(userProfile?.role === 'admin' ? [{ id: 'moderation', label: '审判庭', icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  const handleSaveCharacter = async (charData: any) => {
    const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
    const isContributor = userProfile?.role === 'contributor' || isAdminUser;

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
      setSelectedCharacter(null);
    } catch (error: any) {
      console.error("Error saving character:", error);
      alert(error.message || "保存失败，请检查数据格式。");
      throw error;
    }
  };

  return (
    <div 
      className="min-h-screen bg-bg text-text font-sans selection:bg-primary selection:text-white relative bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: 'var(--bg-overlay), var(--bg-image)' }}
    >
      <div className="scanline" />
      
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary flex items-center justify-center shadow-[0_0_20px_#ff003c] rotate-45">
                <Skull className="text-white w-6 h-6 -rotate-45" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold tracking-tighter text-accent cyber-glow-text">
                  庄园秘典 <span className="text-primary">CODEX</span>
                </h1>
                <div className="text-[8px] font-mono text-muted tracking-[0.5em] uppercase">神经连接接口 v5.0.0</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 border border-border bg-bg/50 text-muted hover:text-accent hover:border-accent transition-all"
                title={isDarkMode ? '切换至明亮模式' : '切换至黑暗模式'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {user ? (
                <div className="flex items-center gap-4 bg-bg/50 border border-border px-4 py-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-accent">{userProfile?.displayName}</span>
                    <span className="text-[8px] text-muted uppercase tracking-widest">{userProfile?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="text-muted hover:text-primary transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/50 text-accent text-[10px] font-mono hover:bg-accent hover:text-bg transition-all"
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
                  <span className="text-xs font-bold tracking-widest">{item.label}</span>
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
                  }}
                />
                <div className="flex justify-center gap-6 pt-8">
                  <button 
                    onClick={() => setIsEditingWiki(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-mono text-xs tracking-widest shadow-[0_0_20px_rgba(255,0,60,0.3)] hover:scale-105 transition-all"
                  >
                    <Plus className="w-4 h-4" /> 创建新词条_NEW
                  </button>
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

            {selectedWikiEntry && !isEditingWiki && (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedWikiEntry(null)}
                  className="text-muted hover:text-accent flex items-center gap-2 text-[10px] font-mono tracking-widest transition-colors"
                >
                  ← 返回搜索_BACK
                </button>
                <WikiEntryView 
                  entry={selectedWikiEntry} 
                  onEdit={() => setIsEditingWiki(true)} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'moderation' && userProfile?.role === 'admin' && (
          <div className="space-y-8 relative z-10">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div>
                <h2 className="text-3xl font-serif text-primary cyber-glow-text">审判庭_MODERATION</h2>
                <p className="text-muted text-xs font-mono mt-2">管理员专用：审核社区提交的修订内容。</p>
              </div>
              <button 
                onClick={async () => {
                  if (confirm('确定要批量导入48名求生者吗？这将在数据库中创建大量文档。')) {
                    try {
                      const results = await batchImportSurvivors();
                      alert(`成功导入 ${results.length} 名求生者！`);
                    } catch (error: any) {
                      alert(`导入失败: ${error.message}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-primary/10 border border-primary/50 text-primary text-[10px] font-mono hover:bg-primary hover:text-white transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 批量导入求生者_BATCH_IMPORT
              </button>
            </div>
            <WikiModeration />
          </div>
        )}

        {(activeTab === 'survivors' || activeTab === 'hunters') && (
          <div className="space-y-12 relative z-10">
            <div className="flex flex-wrap gap-4 border-b border-border/50 pb-8 items-center">
              {(activeTab === 'survivors' ? survivors : hunters).map(char => (
                <button
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacter(char);
                    setShowForm(false);
                  }}
                  className={`group relative w-20 h-20 transition-all duration-500 ${
                    selectedCharacter?.id === char.id && !showForm
                      ? 'scale-110 z-20' 
                      : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <div className={`absolute inset-0 cyber-border border-2 ${selectedCharacter?.id === char.id && !showForm ? 'border-accent shadow-[0_0_20px_rgba(0,243,255,0.4)]' : 'border-border'}`} />
                  <img src={char.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-0 left-0 right-0 bg-accent/80 text-[9px] font-bold text-bg py-1 text-center">
                    {char.title}
                  </div>
                </button>
              ))}
              
              <button 
                onClick={() => setShowForm(true)}
                className={`w-20 h-20 border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:text-accent hover:border-accent transition-all ${showForm ? 'border-accent text-accent bg-accent/5' : ''}`}
              >
                <Plus className="w-6 h-6" />
                <span className="text-[10px] font-bold">添加{activeTab === 'survivors' ? '求生者' : '监管者'}</span>
              </button>
            </div>

            {showForm || isEditingCharacter ? (
              <CharacterForm 
                onSave={handleSaveCharacter} 
                onCancel={() => {
                  setShowForm(false);
                  setIsEditingCharacter(false);
                }} 
                initialData={isEditingCharacter ? selectedCharacter || undefined : undefined}
              />
            ) : (
              selectedCharacter && (
                <CharacterDetail 
                  character={selectedCharacter} 
                  onEdit={() => setIsEditingCharacter(true)}
                />
              )
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard characters={characters} />
        )}

        {activeTab === 'maps' && <MapList />}
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
            <div className="inline-block px-4 py-2 border border-primary text-primary text-[10px] font-mono cyber-glitch">
              系统状态: 正常运行
            </div>
            <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
              © 2026 NEURAL_MANOR_OS. 保留所有权利。
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-card/90 border border-accent/30 rounded-none p-2 flex justify-around shadow-[0_0_30px_rgba(0,243,255,0.2)] z-50 backdrop-blur-xl">
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
