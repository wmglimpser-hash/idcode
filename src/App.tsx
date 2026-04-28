import { useEffect, useState, useRef } from 'react';
import { Character, MOCK_CHARACTERS, WikiEntry, SURVIVOR_TRAITS_TEMPLATE, SURVIVOR_TRAITS_MODERN_TEMPLATE } from './constants';
import { bulkSyncTags } from './services/tagService';
import { createBackup } from './services/backupService';
import { CharacterForm } from './components/CharacterForm';
import { CharacterDetail } from './components/CharacterDetail';
import { TraitFactorsView } from './components/TraitFactorsView';
import { CharacterExtensionView } from './components/CharacterExtensionView';
import { WikiEditor } from './components/WikiEditor';
import { WikiEntryView } from './components/WikiEntryView';
import { Leaderboard } from './components/Leaderboard';
import { MapList } from './components/MapList';
import { TagManagement } from './components/TagManagement';
import { TalentWeb } from './components/TalentWeb';
import { BulkImport } from './components/BulkImport';
import { WikiSearch } from './components/WikiSearch';
import { WallpaperManager } from './components/WallpaperManager';
import { AIAssistant } from './components/AIAssistant';
import { TheoryPresentation } from './components/TheoryPresentation';
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
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { Skull, Map as MapIcon, ShieldCheck, Swords, Plus, Book, Search, LogIn, LogOut, User as UserIcon, Edit3, Settings, Sun, Moon, Trophy, ChevronLeft, ChevronRight, RefreshCcw, Network, FileJson, Zap, Trash2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

type Tab = 'survivors' | 'hunters' | 'maps' | 'wiki' | 'leaderboard' | 'talents' | 'tags' | 'theory';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>(MOCK_CHARACTERS);
  const [activeTab, setActiveTab] = useState<Tab>('wiki');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [viewingFactors, setViewingFactors] = useState<{ characterId: string; characterName: string; category: string } | null>(null);
  const [viewingExtension, setViewingExtension] = useState<{ character: Character; type: 'talent' | 'auxiliary' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  
  // Wiki State
  const [selectedWikiEntry, setSelectedWikiEntry] = useState<WikiEntry | null>(null);
  const [leaderboardTrait, setLeaderboardTrait] = useState<{ role: 'Survivor' | 'Hunter', label: string } | null>(null);

  const handleViewRanking = (role: 'Survivor' | 'Hunter', label: string) => {
    setLeaderboardTrait({ role, label });
    setActiveTab('leaderboard');
  };
  const [isEditingWiki, setIsEditingWiki] = useState(false);
  const [isBulkImportingWiki, setIsBulkImportingWiki] = useState(false);
  const [isBulkImportingCharacters, setIsBulkImportingCharacters] = useState(false);
  
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

  const handleSyncCharacterOrders = async () => {
    if (!isAdminUser || characters.length === 0) return;

    if (!window.confirm(`确定要同步所有角色的排序 ID 吗？系统将尝试根据 ID 重新修正 order 权重。`)) {
      return;
    }

    const updates: { id: string, name: string, order: number }[] = [];

    for (const char of characters) {
      let targetOrder = char.order;
      if (char.id.startsWith('s')) {
        const num = parseInt(char.id.substring(1));
        if (!isNaN(num)) targetOrder = num;
      } else if (char.id.startsWith('h')) {
        const num = parseInt(char.id.substring(1));
        if (!isNaN(num)) targetOrder = 99 + num;
      }

      if (targetOrder !== char.order) {
        updates.push({ id: char.id, name: char.name, order: targetOrder });
      }
    }

    if (updates.length === 0) {
      alert("数据已是最新，无需同步排序。");
      return;
    }

    let successCount = 0;
    const failedItems: string[] = [];
    const successItems: string[] = [];

    for (const update of updates) {
      try {
        await updateDoc(doc(db, 'characters', update.id), {
          order: update.order,
          lastUpdated: serverTimestamp()
        });
        successCount++;
        successItems.push(update.name);
      } catch (e: any) {
        console.error(`Sync failed for ${update.name}`, e);
        failedItems.push(`${update.name} (${e.message})`);
      }
    }

    let report = `同步完成！\n- 成功更新: ${successCount} 个角色`;
    if (failedItems.length > 0) {
      report += `\n- 失败: ${failedItems.length} 个角色\n- 失败名单: ${failedItems.join(', ')}`;
    }
    if (successCount > 0) {
      report += `\n- 修改成功名单: ${successItems.join(', ')}`;
    }
    alert(report);
  };

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
    { id: 'tags', label: '标签系统', icon: <Settings className="w-4 h-4" /> },
    { id: 'talents', label: '天赋系统', icon: <Network className="w-4 h-4" /> },
    { id: 'theory', label: '理论演示', icon: <Zap className="w-4 h-4" /> },
  ];

  const handleUpdateCharacter = async (charId: string, data: Partial<Character>) => {
    if (!isContributor) {
      throw new Error("权限不足：只有贡献者或管理员可以修改档案数据。");
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

    const getTagsFromChar = (data: any) => {
      const tags = new Set<string>();
      if (Array.isArray(data.skills)) {
        data.skills.forEach((s: any) => {
          if (Array.isArray(s.tags)) {
            s.tags.forEach((t: string) => { if (t) tags.add(t); });
          }
        });
      }
      if (Array.isArray(data.presence)) {
        data.presence.forEach((p: any) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((t: string) => { if (t) tags.add(t); });
          }
        });
      }
      return Array.from(tags);
    };

    try {
      // 1. High risk operation - Trigger backup
      const action = Array.isArray(charData) ? 'bulk_save' : (isEditingCharacter ? 'edit_save' : 'create_save');
      setConfirmModal({
        show: true,
        title: '系统备份中',
        message: '正在为本次保存操作生成自动化快照备份，请稍后...',
        onConfirm: () => {},
        type: 'info'
      });
      const backupResult = await createBackup(action);
      setConfirmModal(prev => ({ ...prev, show: false }));

      if (Array.isArray(charData)) {
        // 2. Optimized Tag Sync for bulk save
        const allTagsToSync = charData.map(d => ({
          tags: getTagsFromChar(d),
          role: d.role as 'Survivor' | 'Hunter' | 'Both'
        }));
        const addedTagsCount = await bulkSyncTags(allTagsToSync, user?.uid || 'unknown');
        
        let successCount = 0;
        const failedItems: string[] = [];
        const successItems: string[] = [];

        for (const data of charData) {
          validateChar(data);
          try {
            if (data.id && !MOCK_CHARACTERS.some(m => m.id === data.id)) {
              await setDoc(doc(db, 'characters', data.id), {
                ...data,
                lastUpdated: serverTimestamp()
              }, { merge: true });
            } else {
              const docRef = data.id ? doc(db, 'characters', data.id) : doc(collection(db, 'characters'));
              await setDoc(docRef, {
                ...data,
                imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.name}/400/600`,
                skills: data.skills && data.skills.length > 0 
                  ? data.skills 
                  : (data.skills || [{ name: '初始技能', description: '该角色尚未配置详细技能说明。' }]),
                lastUpdated: serverTimestamp()
              }, { merge: true });
            }
            successCount++;
            successItems.push(data.name || data.title);
          } catch (err: any) {
            console.error(`Save failed for ${data.name}`, err);
            failedItems.push(`${data.name || data.title} (${err.message})`);
          }
        }

        let report = `批量保存结果：\n- 成功: ${successCount} 个角色\n- 自动补齐标签: ${addedTagsCount} 个`;
        if (failedItems.length > 0) {
          report += `\n- 失败: ${failedItems.length} 个角色\n- 失败单: ${failedItems.join(', ')}`;
        }
        report += `\n- 备份文件: ${backupResult.fileName}${backupResult.hasFailures ? ' (警告：备份不完整！)' : ''}`;
        if (backupResult.hasFailures) {
          report += `\n- 备份失败集合: ${backupResult.failedCollections.join(', ')}`;
        }
        alert(report);
      } else {
        // Single character save
        validateChar(charData);
        const tags = getTagsFromChar(charData);
        if (tags.length > 0 && user) {
          await bulkSyncTags([{ tags, role: charData.role }], user.uid);
        }

        if (isEditingCharacter && selectedCharacter) {
          await setDoc(doc(db, 'characters', selectedCharacter.id), {
            ...charData,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } else {
          await addDoc(collection(db, 'characters'), {
            ...charData,
            imageUrl: charData.imageUrl || `https://picsum.photos/seed/${charData.name}/400/600`,
            skills: charData.skills && charData.skills.length > 0 
              ? charData.skills 
              : [{ name: '初始技能', description: '该角色尚未配置详细技能说明。' }],
            lastUpdated: serverTimestamp()
          });
        }
        
        let report = `保存成功！\n- 角色：${charData.title} ${charData.name}`;
        report += `\n- 备份文件: ${backupResult.fileName}${backupResult.hasFailures ? ' (警告：备份不完整！)' : ''}`;
        if (backupResult.hasFailures) {
          report += `\n- 备份失败集合: ${backupResult.failedCollections.join(', ')}`;
        }
        alert(report);
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
      setConfirmModal({
        show: true,
        title: '权限不足',
        message: '只有管理员可以删除档案。',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false })),
        type: 'info'
      });
      return;
    }

    setConfirmModal({
      show: true,
      title: '确认删除',
      message: `确定要删除角色 ${char.name} 吗？此操作不可撤销。`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Backup before deletion
          const backupResult = await createBackup('delete_character');
          
          const isMock = MOCK_CHARACTERS.some(m => m.id === char.id);
          if (isMock) {
            await setDoc(doc(db, 'characters', char.id), { deleted: true, lastUpdated: serverTimestamp() });
          } else {
            await deleteDoc(doc(db, 'characters', char.id));
          }
          
          let report = `删除成功！\n- 角色：${char.title} ${char.name}`;
          report += `\n- 备份文件: ${backupResult.fileName}${backupResult.hasFailures ? ' (警告：备份不完整！)' : ''}`;
          if (backupResult.hasFailures) {
            report += `\n- 备份失败集合: ${backupResult.failedCollections.join(', ')}`;
          }
          alert(report);
          
          setSelectedCharacter(null);
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `characters/${char.id}`);
        }
      }
    });
  };

  const handleBatchDelete = async () => {
    if (!isAdminUser) {
      setConfirmModal({
        show: true,
        title: '权限不足',
        message: '只有管理员可以删除档案。',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false })),
        type: 'info'
      });
      return;
    }

    if (selectedCharacterIds.length === 0) return;

    setConfirmModal({
      show: true,
      title: '批量删除确认',
      message: `确定要删除选中的 ${selectedCharacterIds.length} 个角色吗？此操作不可撤销。`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Backup before batch delete
          const backupResult = await createBackup('batch_delete');
          
          let successCount = 0;
          const failedIds: string[] = [];
          for (const id of selectedCharacterIds) {
            try {
              const charName = characters.find(c => c.id === id)?.name || id;
              const isMock = MOCK_CHARACTERS.some(m => m.id === id);
              if (isMock) {
                await setDoc(doc(db, 'characters', id), { deleted: true, lastUpdated: serverTimestamp() });
              } else {
                await deleteDoc(doc(db, 'characters', id));
              }
              successCount++;
            } catch (e: any) {
              console.error(`Batch delete failed for ${id}`, e);
              failedIds.push(`${id} (${e.message})`);
            }
          }

          let report = `批量删除完成！\n- 成功删除: ${successCount} 个角色`;
          if (failedIds.length > 0) {
            report += `\n- 失败: ${failedIds.length} 个角色\n- 失败名单: ${failedIds.join(', ')}`;
          }
          report += `\n- 备份文件: ${backupResult.fileName}${backupResult.hasFailures ? ' (警告：备份不完整！)' : ''}`;
          if (backupResult.hasFailures) {
            report += `\n- 备份失败集合: ${backupResult.failedCollections.join(', ')}`;
          }
          alert(report);
          
          setSelectedCharacterIds([]);
          setIsBatchMode(false);
          setSelectedCharacter(null);
          setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) {
          console.error("Batch delete summary error:", err);
          alert("批量删除过程发生系统错误，请检查控制台。");
        }
      }
    });
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
    <ErrorBoundary>
      <div 
        className="min-h-screen bg-bg text-text font-sans selection:bg-primary selection:text-white relative bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-500 overflow-x-hidden flex flex-col"
        style={{ backgroundImage: 'var(--bg-overlay), var(--bg-image)' }}
      >
        <div className="scanline" />
        
        {/* Header */}
        <header className="border-b border-border bg-card/80 sticky top-0 z-50 shrink-0 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rotate-45 overflow-hidden">
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
                <div className="flex items-center gap-4">
                  {isAdminUser && (
                    <button 
                      onClick={handleSyncCharacterOrders}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent text-[10px] font-mono hover:bg-accent hover:text-bg transition-all"
                      title="同步角色档案排序 ID"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" /> 同步排序
                    </button>
                  )}
                  <div className="flex items-center gap-4 bg-bg/50 border border-border px-4 py-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-accent">{userProfile?.displayName}</span>
                    <span className="text-[10px] text-muted uppercase tracking-widest">{userProfile?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="text-muted hover:text-primary transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
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
      <main className="flex-1 relative">
        <div className="max-w-[1600px] mx-auto px-6 py-12 min-h-full">
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
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-mono text-sm tracking-widest hover:scale-105 transition-all"
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

            {isBulkImportingCharacters && (
              <BulkImport 
                mode="character" 
                allCharacters={characters}
                onClose={() => setIsBulkImportingCharacters(false)} 
                onSuccess={() => setIsBulkImportingCharacters(false)} 
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

            <AIAssistant 
              characters={characters} 
              onUpdateCharacter={handleUpdateCharacter}
              userProfile={userProfile}
            />
          </div>
        )}

        {activeTab === 'theory' && (
          <TheoryPresentation />
        )}

        {(activeTab === 'survivors' || activeTab === 'hunters') && (
          <div className="space-y-12 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-mono text-accent/70 uppercase tracking-widest">
                  {activeTab === 'survivors' ? '求生者名录_SURVIVORS' : '监管者名录_HUNTERS'}
                </h3>
                {isAdminUser && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setIsBatchMode(!isBatchMode);
                        setSelectedCharacterIds([]);
                      }}
                      className={`text-[10px] font-mono px-2 py-1 border transition-all ${
                        isBatchMode 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-border text-muted hover:text-accent hover:border-accent'
                      }`}
                    >
                      {isBatchMode ? '取消选择_CANCEL' : '批量管理_BATCH'}
                    </button>
                    {isBatchMode && (
                      <button 
                        onClick={() => {
                          const currentList = (activeTab === 'survivors' ? survivors : hunters).filter(c => !c.id.startsWith('base_'));
                          if (selectedCharacterIds.length === currentList.length) {
                            setSelectedCharacterIds([]);
                          } else {
                            setSelectedCharacterIds(currentList.map(c => c.id));
                          }
                        }}
                        className="text-[10px] font-mono px-2 py-1 border border-border text-muted hover:text-accent hover:border-accent transition-all"
                      >
                        {selectedCharacterIds.length === (activeTab === 'survivors' ? survivors : hunters).filter(c => !c.id.startsWith('base_')).length ? '取消全选_DESELECT' : '全选_SELECT_ALL'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {isBatchMode && selectedCharacterIds.length > 0 && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                  <span className="text-[10px] font-mono text-accent">已选择 {selectedCharacterIds.length} 个角色</span>
                  <button 
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary text-primary text-[10px] font-mono hover:bg-primary hover:text-white transition-all"
                  >
                    <Trash2 className="w-3 h-3" /> 批量删除_DELETE
                  </button>
                </div>
              )}
            </div>

            <div className="relative group/nav pb-8">
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-10 h-10 bg-card border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all opacity-0 group-hover/nav:opacity-100"
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
                      if (isBatchMode) {
                        setSelectedCharacterIds(prev => 
                          prev.includes(char.id) 
                            ? prev.filter(id => id !== char.id) 
                            : [...prev, char.id]
                        );
                      } else {
                        setSelectedCharacter(char);
                        setShowForm(false);
                        setIsEditingCharacter(false);
                        setViewingFactors(null);
                        setViewingExtension(null);
                      }
                    }}
                    className={`group relative w-20 h-20 flex-shrink-0 transition-all duration-200 ${
                      (isBatchMode && selectedCharacterIds.includes(char.id)) || (!isBatchMode && selectedCharacter?.id === char.id && !showForm && !isEditingCharacter)
                        ? 'scale-110 z-20' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className={`absolute inset-0 border bg-transparent transition-colors duration-200 ${
                      (isBatchMode && selectedCharacterIds.includes(char.id)) || (!isBatchMode && selectedCharacter?.id === char.id && !showForm && !isEditingCharacter)
                        ? 'border-accent shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                        : 'border-border/20'
                    }`} />
                    
                    {isBatchMode && (
                      <div className={`absolute top-1 right-1 w-4 h-4 border flex items-center justify-center z-30 transition-colors ${
                        selectedCharacterIds.includes(char.id) ? 'bg-accent border-accent' : 'bg-black/50 border-white/30'
                      }`}>
                        {selectedCharacterIds.includes(char.id) && <ShieldCheck className="w-3 h-3 text-bg" />}
                      </div>
                    )}

                    <div className="absolute inset-0 overflow-hidden">
                      <img 
                        src={char.imageUrl} 
                        className={`w-full h-full object-contain transition-all duration-200 ${
                          (isBatchMode && selectedCharacterIds.includes(char.id)) || (!isBatchMode && selectedCharacter?.id === char.id && !showForm && !isEditingCharacter)
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
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-10 h-10 bg-card border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all opacity-0 group-hover/nav:opacity-100"
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
                onBulkImport={() => setIsBulkImportingCharacters(true)}
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
            onRefresh={() => handleSyncCharacterOrders()}
            isAdmin={user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin'}
            initialTrait={leaderboardTrait}
            onUpdate={handleUpdateCharacter}
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
        {activeTab === 'tags' && (
          <TagManagement 
            user={user} 
            userProfile={userProfile} 
          />
        )}
      </div>
    </main>

    {/* Footer */}
    <footer className="border-t border-border py-16 bg-card/50 relative mt-auto backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
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

    {/* Custom Confirmation Modal */}
    {confirmModal.show && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl p-6 space-y-6">
          <div className="space-y-2">
            <h3 className={`text-xl font-serif font-bold ${confirmModal.type === 'danger' ? 'text-primary' : 'text-accent'}`}>
              {confirmModal.title}
            </h3>
            <p className="text-sm text-muted font-mono leading-relaxed">
              {confirmModal.message}
            </p>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="px-6 py-2 border border-border text-muted text-xs font-mono hover:text-text transition-colors"
            >
              取消_CANCEL
            </button>
            <button 
              onClick={confirmModal.onConfirm}
              className={`px-6 py-2 font-mono text-xs text-white transition-all hover:scale-105 ${
                confirmModal.type === 'danger' ? 'bg-primary' : 'bg-accent text-bg'
              }`}
            >
              确认_CONFIRM
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Mobile Nav */}
    <div className="md:hidden fixed bottom-6 left-4 right-4 bg-card/90 border border-accent/30 rounded-none p-2 flex justify-around z-50">
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
</ErrorBoundary>
  );
}
