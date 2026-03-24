import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Save, Trash2, Plus, Info, ShieldCheck, Swords, Network, ExternalLink, FileText, FileJson, Search, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TalentNode, WikiEntry, SURVIVOR_TRAITS_TEMPLATE, HUNTER_TRAITS_TEMPLATE } from '../constants';
import { BulkImport } from './BulkImport';

interface TalentDefinition {
  id: string;
  role: 'Survivor' | 'Hunter';
  nodeId: string;
  name: string;
  description: string;
  targetStat?: string;
  modifier?: string;
  effect?: string;
}

const MAX_TOTAL_POINTS = 130;
const POINT_COST_PER_LEVEL = 5;

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface TalentWebProps {
  user: FirebaseUser | null;
  userProfile: any;
  onViewWiki?: (entryId: string) => void;
}

const NODE_SPACING = 120;

export const DEFAULT_NODES: (TalentNode & { x: number; y: number })[] = [
  {
    "id": "0",
    "x": -0.01,
    "y": -4.09,
    "maxLevel": 1,
    "connections": [
      "30"
    ]
  },
  {
    "id": "1",
    "x": 2.33,
    "y": 1.94,
    "maxLevel": 3,
    "connections": [
      "2",
      "14",
      "39"
    ]
  },
  {
    "id": "2",
    "x": 2.76,
    "y": 1.09,
    "maxLevel": 3,
    "connections": [
      "1",
      "20",
      "34",
      "39"
    ]
  },
  {
    "id": "3",
    "x": 0,
    "y": 2.13,
    "maxLevel": 3,
    "connections": [
      "7",
      "9",
      "19",
      "26",
      "29",
      "40"
    ]
  },
  {
    "id": "4",
    "x": -0.01,
    "y": 4.3,
    "maxLevel": 1,
    "connections": [
      "19"
    ]
  },
  {
    "id": "5",
    "x": -0.95,
    "y": -2.8,
    "maxLevel": 3,
    "connections": [
      "21",
      "30",
      "35",
      "36"
    ]
  },
  {
    "id": "6",
    "x": 1.74,
    "y": -2.35,
    "maxLevel": 3,
    "connections": [
      "12",
      "27",
      "32"
    ]
  },
  {
    "id": "7",
    "x": -0.01,
    "y": 1.1,
    "maxLevel": 3,
    "connections": [
      "3",
      "center",
      "29",
      "40"
    ]
  },
  {
    "id": "8",
    "x": 0.96,
    "y": 0.1,
    "maxLevel": 3,
    "connections": [
      "18",
      "center",
      "34",
      "39"
    ]
  },
  {
    "id": "9",
    "x": -0.95,
    "y": 2.99,
    "maxLevel": 3,
    "connections": [
      "3",
      "19",
      "25",
      "40"
    ]
  },
  {
    "id": "10",
    "x": 4,
    "y": 0.1,
    "maxLevel": 1,
    "connections": [
      "20"
    ]
  },
  {
    "id": "11",
    "x": -4.05,
    "y": 0.09,
    "maxLevel": 1,
    "connections": [
      "31"
    ]
  },
  {
    "id": "12",
    "x": 0.86,
    "y": -1.54,
    "maxLevel": 3,
    "connections": [
      "6",
      "18",
      "27",
      "36",
      "37"
    ]
  },
  {
    "id": "13",
    "x": -2.36,
    "y": -1.73,
    "maxLevel": 3,
    "connections": [
      "15",
      "21",
      "23"
    ]
  },
  {
    "id": "14",
    "x": 1.73,
    "y": 2.55,
    "maxLevel": 3,
    "connections": [
      "1",
      "26",
      "29"
    ]
  },
  {
    "id": "15",
    "x": -2.8,
    "y": -0.89,
    "maxLevel": 3,
    "connections": [
      "13",
      "23",
      "31",
      "38"
    ]
  },
  {
    "id": "16",
    "x": 2.77,
    "y": -0.9,
    "maxLevel": 3,
    "connections": [
      "18",
      "20",
      "32"
    ]
  },
  {
    "id": "17",
    "x": -2.36,
    "y": 1.93,
    "maxLevel": 3,
    "connections": [
      "24",
      "25",
      "28"
    ]
  },
  {
    "id": "18",
    "x": 1.55,
    "y": -0.79,
    "maxLevel": 3,
    "connections": [
      "8",
      "12",
      "16",
      "32",
      "34"
    ]
  },
  {
    "id": "19",
    "x": -0.01,
    "y": 3.14,
    "maxLevel": 3,
    "connections": [
      "3",
      "4",
      "9",
      "26"
    ]
  },
  {
    "id": "20",
    "x": 2.93,
    "y": 0.1,
    "maxLevel": 3,
    "connections": [
      "2",
      "10",
      "16",
      "34"
    ]
  },
  {
    "id": "21",
    "x": -1.76,
    "y": -2.35,
    "maxLevel": 3,
    "connections": [
      "5",
      "13",
      "35"
    ]
  },
  {
    "id": "center",
    "x": -0.01,
    "y": 0.08,
    "maxLevel": 0,
    "connections": [
      "7",
      "8",
      "33",
      "37"
    ]
  },
  {
    "id": "23",
    "x": -1.58,
    "y": -0.79,
    "maxLevel": 3,
    "connections": [
      "13",
      "15",
      "33",
      "35",
      "38"
    ]
  },
  {
    "id": "24",
    "x": -2.79,
    "y": 1.08,
    "maxLevel": 3,
    "connections": [
      "17",
      "28",
      "31",
      "38"
    ]
  },
  {
    "id": "25",
    "x": -1.77,
    "y": 2.55,
    "maxLevel": 3,
    "connections": [
      "9",
      "17",
      "40"
    ]
  },
  {
    "id": "26",
    "x": 0.94,
    "y": 2.99,
    "maxLevel": 3,
    "connections": [
      "3",
      "14",
      "19",
      "29"
    ]
  },
  {
    "id": "27",
    "x": 0.94,
    "y": -2.81,
    "maxLevel": 3,
    "connections": [
      "6",
      "12",
      "30",
      "36"
    ]
  },
  {
    "id": "28",
    "x": -1.58,
    "y": 1,
    "maxLevel": 3,
    "connections": [
      "17",
      "24",
      "33",
      "38",
      "40"
    ]
  },
  {
    "id": "29",
    "x": 0.87,
    "y": 1.73,
    "maxLevel": 3,
    "connections": [
      "3",
      "7",
      "14",
      "26",
      "39"
    ]
  },
  {
    "id": "30",
    "x": -0.01,
    "y": -2.98,
    "maxLevel": 3,
    "connections": [
      "0",
      "5",
      "27",
      "36"
    ]
  },
  {
    "id": "31",
    "x": -2.97,
    "y": 0.11,
    "maxLevel": 3,
    "connections": [
      "11",
      "15",
      "24",
      "38"
    ]
  },
  {
    "id": "32",
    "x": 2.33,
    "y": -1.73,
    "maxLevel": 3,
    "connections": [
      "6",
      "16",
      "18"
    ]
  },
  {
    "id": "33",
    "x": -0.98,
    "y": 0.1,
    "maxLevel": 3,
    "connections": [
      "center",
      "23",
      "28",
      "38"
    ]
  },
  {
    "id": "34",
    "x": 1.93,
    "y": 0.1,
    "maxLevel": 3,
    "connections": [
      "2",
      "8",
      "18",
      "20",
      "39"
    ]
  },
  {
    "id": "35",
    "x": -0.87,
    "y": -1.54,
    "maxLevel": 3,
    "connections": [
      "5",
      "21",
      "23",
      "36",
      "37"
    ]
  },
  {
    "id": "36",
    "x": 0.01,
    "y": -1.95,
    "maxLevel": 3,
    "connections": [
      "5",
      "12",
      "27",
      "30",
      "35",
      "37"
    ]
  },
  {
    "id": "37",
    "x": -0.01,
    "y": -0.91,
    "maxLevel": 3,
    "connections": [
      "12",
      "center",
      "35",
      "36"
    ]
  },
  {
    "id": "38",
    "x": -1.96,
    "y": 0.1,
    "maxLevel": 3,
    "connections": [
      "15",
      "23",
      "24",
      "28",
      "31",
      "33"
    ]
  },
  {
    "id": "39",
    "x": 1.56,
    "y": 1,
    "maxLevel": 3,
    "connections": [
      "1",
      "2",
      "8",
      "29",
      "34"
    ]
  },
  {
    "id": "40",
    "x": -0.88,
    "y": 1.73,
    "maxLevel": 3,
    "connections": [
      "3",
      "7",
      "9",
      "25",
      "28"
    ]
  }
];

export const TalentWeb = ({ user, userProfile, onViewWiki }: TalentWebProps) => {
  const [role, setRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [talents, setTalents] = useState<TalentDefinition[]>([]);
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TalentDefinition> & {
    newId?: string;
    maxLevel?: number;
    connections?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({});
  const [builderMode, setBuilderMode] = useState(true);
  const [savedBuilds, setSavedBuilds] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [searchTerm, setSearchTerm] = useState('');

  const [treeNodes, setTreeNodes] = useState<(TalentNode & { x: number; y: number })[]>(DEFAULT_NODES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'talent_tree_layout', role), (docSnap) => {
      if (docSnap.exists()) {
        setTreeNodes(docSnap.data().nodes);
      } else {
        setTreeNodes(DEFAULT_NODES);
      }
    });
    return () => unsub();
  }, [role]);

  const nodes = treeNodes;

  // Calculate dynamic viewBox
  const padding = 100;
  const minX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x * NODE_SPACING)) - padding : -500;
  const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x * NODE_SPACING)) + padding : 500;
  const minY = nodes.length > 0 ? Math.min(...nodes.map(n => n.y * NODE_SPACING)) - padding : -500;
  const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y * NODE_SPACING)) + padding : 500;
  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;
  const viewBox = `${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`;

  const totalPointsUsed = Object.values(allocatedPoints).reduce((sum, val) => sum + (val * POINT_COST_PER_LEVEL), 0);

  const getLinkedWikiEntry = (nodeId: string) => {
    return wikiEntries.find(e => e.talentId === nodeId);
  };

  // Helper to draw curved lines for mind map feel
  const renderConnection = (from: any, to: any) => {
    const fromAllocated = from.id === 'center' || (allocatedPoints[from.id] || 0) > 0;
    const toAllocated = to.id === 'center' || (allocatedPoints[to.id] || 0) > 0;
    const isAllocated = fromAllocated && toAllocated;
    const baseColor = role === 'Survivor' ? '#00f3ff' : '#ff003c';
    const color = isAllocated ? baseColor : '#333333';
    const width = isAllocated ? 3 : 1;
    const opacity = isAllocated ? 0.8 : 0.3;

    const x1 = from.x * NODE_SPACING;
    const y1 = from.y * NODE_SPACING;
    const x2 = to.x * NODE_SPACING;
    const y2 = to.y * NODE_SPACING;

    // Create a curved path
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = x1 + dx / 2;
    const cy = y1 + dy / 2;
    
    // Add some curve based on distance
    const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;
    const path = `M ${x1} ${y1} Q ${cx + curve} ${cy - curve} ${x2} ${y2}`;

    return (
      <path
        key={`${from.id}-${to.id}`}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={width}
        opacity={opacity}
        className="transition-all duration-300"
      />
    );
  };

  const ListView = () => {
    const allTalents = talents.filter(t => t.role === role).map(talent => {
      const wiki = getLinkedWikiEntry(talent.nodeId);
      return {
        id: talent.nodeId,
        maxLevel: 3, // Default or fetch from talent
        name: talent.name || wiki?.title || talent.nodeId,
        description: talent.description || '暂无描述',
        level: allocatedPoints[talent.nodeId] || 0,
        hasData: true
      };
    });

    const filteredTalents = allTalents.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6 p-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTalents.map(talent => (
            <div 
              key={talent.id}
              onClick={() => {
                setSelectedNodeId(talent.id);
                const existingTalent = talents.find(t => t.role === role && t.nodeId === talent.id);
                if (existingTalent) {
                  setEditForm(existingTalent);
                } else {
                  setEditForm({
                    role,
                    nodeId: talent.id,
                    name: talent.name,
                    description: '',
                    targetStat: '',
                    modifier: '',
                    effect: '',
                  });
                }
                if (isContributor) setIsEditing(true);
              }}
              className={`p-4 border transition-all cursor-pointer group relative overflow-hidden ${
                selectedNodeId === talent.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/30 bg-card/50'
              }`}
            >
              {selectedNodeId === talent.id && (
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              )}
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <h3 className={`font-bold transition-colors ${selectedNodeId === talent.id ? 'text-accent' : 'text-text group-hover:text-accent'}`}>
                    {talent.name}
                  </h3>
                  <span className="text-[9px] font-mono text-muted uppercase tracking-tighter">ID: {talent.id}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[10px] font-mono text-muted bg-bg/50 px-1.5 py-0.5 border border-border">
                    {talent.level} / {talent.maxLevel}
                  </div>
                  {talent.hasData && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">{talent.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-1 max-w-[100px]">
                  {Array.from({ length: talent.maxLevel }).map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i < talent.level ? 'bg-accent shadow-[0_0_8px_rgba(0,243,255,0.5)]' : 'bg-border'}`}
                    />
                  ))}
                </div>
                {isContributor && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(talent.id);
                      setIsEditing(true);
                    }}
                    className="text-[10px] font-mono text-accent hover:underline uppercase tracking-widest"
                  >
                    编辑_EDIT
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredTalents.length === 0 && (
          <div className="text-center py-20 border border-dashed border-border bg-card/20">
            <p className="text-muted font-mono text-sm uppercase tracking-widest">未找到匹配的天赋_NO_MATCHES</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'talent_definitions'), (snapshot) => {
      const loadedTalents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TalentDefinition[];
      setTalents(loadedTalents);
    });
    return () => unsubscribe();
  }, []);

  // Fetch wiki entries that are linked to talents
  useEffect(() => {
    const q = query(collection(db, 'entries'), where('type', '==', 'talent'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WikiEntry[];
      setWikiEntries(entries);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user's saved builds
  useEffect(() => {
    if (!user) {
      setSavedBuilds([]);
      return;
    }
    const q = query(collection(db, 'talent_builds'), where('userId', '==', user.uid), where('role', '==', role));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedBuilds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, role]);

  // Sync from cloud when user logs in or role changes
  useEffect(() => {
    if (userProfile?.settings?.activeTalents?.[role]) {
      const cloudPoints = userProfile.settings.activeTalents[role];
      if (JSON.stringify(cloudPoints) !== JSON.stringify(allocatedPoints)) {
        setAllocatedPoints(cloudPoints);
      }
    }
  }, [userProfile, role]);

  // Sync to cloud when changed (debounced)
  useEffect(() => {
    if (user && userProfile && Object.keys(allocatedPoints).length > 0) {
      const cloudPoints = userProfile.settings?.activeTalents?.[role] || {};
      if (JSON.stringify(cloudPoints) !== JSON.stringify(allocatedPoints)) {
        const timeoutId = setTimeout(() => {
          updateDoc(doc(db, 'users', user.uid), {
            [`settings.activeTalents.${role}`]: allocatedPoints
          }).catch(console.error);
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [allocatedPoints, user, userProfile, role]);

  // Load points from localStorage (fallback)
  useEffect(() => {
    const saved = localStorage.getItem(`talent_points_${role}`);
    if (saved) {
      try {
        setAllocatedPoints(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading points:", e);
      }
    } else {
      setAllocatedPoints({});
    }
  }, [role]);

  // Save points to localStorage
  useEffect(() => {
    if (Object.keys(allocatedPoints).length > 0) {
      localStorage.setItem(`talent_points_${role}`, JSON.stringify(allocatedPoints));
    }
  }, [allocatedPoints, role]);

  const isUnlockable = (nodeId: string) => {
    if (nodeId === 'center') return true;
    const node = treeNodes.find(n => n.id === nodeId);
    if (!node) return false;
    
    // Find all neighbors (undirected)
    const neighbors = new Set<string>();
    node.connections.forEach(c => neighbors.add(c));
    treeNodes.forEach(n => {
      if (n.connections.includes(nodeId)) {
        neighbors.add(n.id);
      }
    });
    
    // Check if any connected node is allocated or is center
    for (const connId of neighbors) {
      if (connId === 'center' || (allocatedPoints[connId] || 0) > 0) {
        return true;
      }
    }
    
    return false;
  };

  const canRemovePoint = (nodeId: string) => {
    const currentLevel = allocatedPoints[nodeId] || 0;
    if (currentLevel <= 0) return false;
    
    if (currentLevel === 1) {
      // Check if removing this point breaks the tree
      const testAllocated = { ...allocatedPoints };
      delete testAllocated[nodeId];
      
      const reachable = new Set<string>(['center']);
      const queue = ['center'];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        
        // Find all neighbors (undirected)
        const neighbors = new Set<string>();
        const currentNode = treeNodes.find(n => n.id === current);
        if (currentNode) {
          currentNode.connections.forEach(c => neighbors.add(c));
        }
        treeNodes.forEach(n => {
          if (n.connections.includes(current)) {
            neighbors.add(n.id);
          }
        });
        
        neighbors.forEach(neighborId => {
          if (!reachable.has(neighborId) && testAllocated[neighborId] > 0) {
            reachable.add(neighborId);
            queue.push(neighborId);
          }
        });
      }
      
      // If any allocated node is not reachable, we cannot remove
      for (const id of Object.keys(testAllocated)) {
        if (testAllocated[id] > 0 && !reachable.has(id)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const allocatePoint = (nodeId: string) => {
    if (nodeId === 'center') return;
    if (!isUnlockable(nodeId)) {
      // Cannot unlock if not connected to an active node
      return;
    }
    const node = treeNodes.find(n => n.id === nodeId);
    const maxLevel = node?.maxLevel || 3;

    const currentLevel = allocatedPoints[nodeId] || 0;
    if (currentLevel < maxLevel && (totalPointsUsed + POINT_COST_PER_LEVEL) <= MAX_TOTAL_POINTS) {
      setAllocatedPoints(prev => ({
        ...prev,
        [nodeId]: currentLevel + 1
      }));
    }
  };

  const removePoint = (nodeId: string) => {
    if (nodeId === 'center') return;
    if (canRemovePoint(nodeId)) {
      setAllocatedPoints(prev => {
        const next = { ...prev };
        if (next[nodeId] > 1) {
          next[nodeId] -= 1;
        } else {
          delete next[nodeId];
        }
        return next;
      });
    }
  };

  const handleNodeClick = (nodeId: string, e?: React.MouseEvent) => {
    if (nodeId === 'center') return;
    
    if (builderMode && !isEditing) {
      if (e?.shiftKey || e?.button === 2) {
        removePoint(nodeId);
      } else {
        allocatePoint(nodeId);
      }
    }
    
    setSelectedNodeId(nodeId);
    const existingTalent = talents.find(t => t.role === role && t.nodeId === nodeId);
    const node = treeNodes.find(n => n.id === nodeId);
    
    if (existingTalent) {
      setEditForm({
        ...existingTalent,
        newId: nodeId,
        maxLevel: node?.maxLevel || 3,
        connections: node?.connections.join(', ') || ''
      });
    } else {
      setEditForm({
        role,
        nodeId,
        name: '',
        description: '',
        targetStat: '',
        modifier: '',
        effect: '',
        newId: nodeId,
        maxLevel: node?.maxLevel || 3,
        connections: node?.connections.join(', ') || ''
      });
    }
    if (isContributor) setIsEditing(true);
  };

  const handleContextMenu = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (builderMode && !isEditing) {
      removePoint(nodeId);
    }
  };

  const handleSaveBuild = async () => {
    if (!user || !buildName.trim()) return;
    setSaving(true);
    try {
      const buildId = `${user.uid}_${role.toLowerCase()}_${Date.now()}`;
      await setDoc(doc(db, 'talent_builds', buildId), {
        userId: user.uid,
        role,
        name: buildName,
        points: allocatedPoints,
        updatedAt: serverTimestamp()
      });
      setShowSaveModal(false);
      setBuildName('');
    } catch (error) {
      console.error("Error saving build:", error);
      alert("保存方案失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBuild = async (buildId: string) => {
    if (!window.confirm("确定要删除这个加点方案吗？")) return;
    try {
      await deleteDoc(doc(db, 'talent_builds', buildId));
    } catch (error) {
      console.error("Error deleting build:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedNodeId) return;
    
    // If name is missing, use default name
    const finalName = editForm.name || '未命名天赋';
    const oldId = selectedNodeId;
    const newId = editForm.newId || oldId;
    
    setSaving(true);
    try {
      // Update treeNodes
      const updatedNodes = treeNodes.map(n => {
        if (n.id === oldId) {
          return {
            ...n,
            id: newId,
            maxLevel: editForm.maxLevel ?? 3,
            connections: editForm.connections ? editForm.connections.split(',').map(s => s.trim()).filter(Boolean) : []
          };
        }
        // Update connections in other nodes if ID changed
        if (oldId !== newId && n.connections.includes(oldId)) {
          return {
            ...n,
            connections: n.connections.map(c => c === oldId ? newId : c)
          };
        }
        return n;
      });

      // Save to Firestore
      await setDoc(doc(db, 'talent_tree_layout', role), { nodes: updatedNodes });

      const docId = `${role.toLowerCase()}_${newId}`;
      const { newId: _, maxLevel: __, connections: ___, ...talentData } = editForm;
      
      // Remove undefined values to prevent Firestore errors
      const cleanTalentData = Object.fromEntries(
        Object.entries(talentData).filter(([_, v]) => v !== undefined)
      );

      await setDoc(doc(db, 'talent_definitions', docId), {
        ...cleanTalentData,
        name: finalName,
        role,
        nodeId: newId,
        updatedAt: serverTimestamp()
      });

      if (oldId !== newId) {
        // Delete old talent definition
        await deleteDoc(doc(db, 'talent_definitions', `${role.toLowerCase()}_${oldId}`));
        setSelectedNodeId(newId);
        
        // Also update allocated points if necessary
        if (allocatedPoints[oldId]) {
          setAllocatedPoints(prev => {
            const next = { ...prev };
            next[newId] = Math.min(next[oldId], editForm.maxLevel ?? 3);
            delete next[oldId];
            return next;
          });
        }
      } else {
        // Just cap the allocated points if maxLevel was reduced
        if (allocatedPoints[oldId] > (editForm.maxLevel ?? 3)) {
          setAllocatedPoints(prev => ({
            ...prev,
            [oldId]: editForm.maxLevel ?? 3
          }));
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving talent:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNodeId) return;
    if (!window.confirm("确定要删除这个天赋的定义吗？")) return;
    setSaving(true);
    try {
      const docId = `${role.toLowerCase()}_${selectedNodeId}`;
      await deleteDoc(doc(db, 'talent_definitions', docId));
      setEditForm({
        role,
        nodeId: selectedNodeId,
        name: '',
        description: '',
        targetStat: '',
        modifier: '',
        effect: ''
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error deleting talent:", error);
      alert("删除失败");
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedTalent = talents.find(t => t.role === role && t.nodeId === selectedNodeId);
  const linkedWikiEntry = wikiEntries.find(e => e.talentId === selectedNodeId);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[800px] animate-in fade-in duration-500">
      {/* Left: Web Visualization */}
      <div className="flex-1 bg-card/30 border border-border p-6 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-serif text-accent flex items-center gap-2">
              <Network className="w-5 h-5" /> 天赋系统_TALENT_WEB
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 bg-bg/80 border border-border px-3 py-1 rounded">
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">已用点数 POINTS:</span>
                <span className={`text-sm font-mono font-bold ${totalPointsUsed >= MAX_TOTAL_POINTS ? 'text-primary' : 'text-accent'}`}>
                  {totalPointsUsed} / {MAX_TOTAL_POINTS}
                </span>
              </div>
              <button 
                onClick={() => setAllocatedPoints({})}
                className="text-[10px] font-mono text-muted hover:text-primary uppercase tracking-widest transition-colors"
              >
                重置加点_RESET_POINTS
              </button>
              {user && (
                <button 
                  onClick={() => setShowSaveModal(true)}
                  className="text-[10px] font-mono text-muted hover:text-accent uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> 保存方案_SAVE_BUILD
                </button>
              )}
                  {isAdminUser && (
                    <button 
                      onClick={() => setShowBulkImport(true)}
                      className="text-[10px] font-mono text-muted hover:text-accent uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <FileJson className="w-3 h-3" /> 批量导入_BULK_IMPORT
                    </button>
                  )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* View Mode Toggle */}
            <div className="flex bg-bg border border-border p-1 rounded-sm">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                树状图_TREE
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                列表_LIST
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索天赋... SEARCH"
                className="bg-bg border border-border pl-9 pr-4 py-2 text-xs font-mono focus:border-accent outline-none w-48 transition-all focus:w-64"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setRole('Survivor'); setSelectedNodeId(null); }}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${role === 'Survivor' ? 'bg-accent text-bg' : 'bg-bg border border-border text-muted hover:text-accent'}`}
              >
                <ShieldCheck className="w-4 h-4" /> 求生者
              </button>
              <button
                onClick={() => { setRole('Hunter'); setSelectedNodeId(null); }}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${role === 'Hunter' ? 'bg-primary text-white' : 'bg-bg border border-border text-muted hover:text-primary'}`}
              >
                <Swords className="w-4 h-4" /> 监管者
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-[600px] bg-bg/30 rounded-lg border border-border/50 custom-scrollbar">
          {viewMode === 'list' ? (
            <ListView />
          ) : (
            <svg 
              ref={svgRef}
              className="w-full h-full"
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Draw Connections */}
              <g>
                {nodes.map(node => {
                  return node.connections.map(targetId => {
                    const targetNode = nodes.find(n => n.id === targetId);
                    if (!targetNode) return null;
                    return renderConnection(node, targetNode);
                  });
                })}
              </g>

              {/* Draw Nodes */}
              <g>
                {nodes.map(node => {
                  const pos = { cx: node.x * NODE_SPACING, cy: node.y * NODE_SPACING };
                  const isCenter = node.id === 'center';
                  const isSelected = selectedNodeId === node.id;
                          const hasData = talents.some(t => t.role === role && t.nodeId === node.id);
                          const currentLevel = allocatedPoints[node.id] || 0;
                          const isAllocated = currentLevel > 0;
                          const unlockable = isUnlockable(node.id);
                          
                          const baseColor = role === 'Survivor' ? '#00f3ff' : '#ff003c';
                          const fillColor = isCenter ? baseColor : (isAllocated ? baseColor : (hasData ? `${baseColor}40` : '#1a1a1a'));
                          const strokeColor = isSelected ? '#ffffff' : (isAllocated ? baseColor : (hasData ? baseColor : '#333333'));
                          const nodeOpacity = isCenter ? 1 : (isAllocated ? 1 : (unlockable ? 0.8 : 0.3));

                          return (
                            <g 
                              key={node.id} 
                              transform={`translate(${pos.cx}, ${pos.cy})`}
                              style={{ opacity: nodeOpacity }}
                            >
                              <motion.g
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={isCenter ? {} : { scale: 1.15, filter: 'brightness(1.4)' }}
                                transition={{ duration: 0.3, delay: (Math.abs(node.x) + Math.abs(node.y)) * 0.05 }}
                                onTap={(e) => handleNodeClick(node.id, e as any)}
                                onContextMenu={(e) => handleContextMenu(node.id, e)}
                                className={isCenter ? '' : 'cursor-pointer'}
                                style={{ touchAction: 'none' }}
                              >
                                {/* Selected Indicator */}
                                {(isSelected || isAllocated) && (
                                  <circle
                                    r={isCenter ? 35 : 25}
                                    fill="none"
                                    stroke={baseColor}
                                    strokeWidth="1"
                                    strokeDasharray="4 2"
                                    className="animate-spin-slow"
                                  />
                                )}

                                {isCenter && (
                                  <circle r="40" fill={baseColor} fillOpacity="0.2" filter="url(#glow)" />
                                )}
                                
                                <circle 
                                  r={isCenter ? 25 : 18} 
                                  fill={fillColor}
                                  stroke={strokeColor}
                                  strokeWidth={isSelected ? 4 : 2}
                                  className="transition-all duration-300"
                                />

                                {/* Level Indicator */}
                                {!isCenter && node.maxLevel > 1 && (
                                  <text
                                    y="5"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill={isAllocated ? "#000" : "#666"}
                                    className="pointer-events-none font-mono"
                                  >
                                    {currentLevel}
                                  </text>
                                )}
                                
                                {hasData && !isCenter && (
                                  <motion.circle 
                                    r="4" 
                                    fill={isAllocated ? "#fff" : baseColor} 
                                    cy="-25"
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  />
                                )}
                              </motion.g>
                            </g>
                          );
                        })}
                      </g>
            </svg>
          )}
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="w-full md:w-96 bg-card/30 border border-border p-6 flex flex-col">
        <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
          <h3 className="text-sm font-bold text-text font-mono flex items-center gap-2 uppercase tracking-widest">
            <Info className="w-4 h-4" /> 天赋详情_DETAILS
          </h3>
          {isContributor && (
            <button 
              onClick={() => setShowBulkImport(true)}
              className="text-[10px] text-muted hover:text-accent flex items-center gap-1 transition-colors font-mono uppercase tracking-widest"
              title="批量导入天赋定义"
            >
              <FileJson className="w-3 h-3" /> 批量导入
            </button>
          )}
        </div>

        {!selectedNodeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50">
            <Network className="w-12 h-12 mb-4" />
            <p className="text-sm font-mono uppercase tracking-widest">请在左侧选择一个天赋节点</p>
            <div className="mt-8 text-[10px] text-center space-y-1">
              <p>左键点击: 增加天赋点</p>
              <p>右键或 Shift+点击: 减少天赋点</p>
              <p>管理员可点击并拖动节点修改位置</p>
              <p>管理员可编辑天赋定义与位置</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted font-mono mb-1">NODE: {selectedNodeId.toUpperCase()}</div>
                <div className="text-xs text-accent font-mono">MAX LEVEL: {selectedNode?.maxLevel}</div>
              </div>
              {isContributor && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-mono uppercase tracking-widest text-muted hover:text-accent transition-colors border border-border px-3 py-1"
                >
                  {isEditing ? '取消编辑' : '编辑_EDIT'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">节点编号 NODE_ID</label>
                  <input
                    type="text"
                    value={editForm.newId || ''}
                    onChange={e => setEditForm({...editForm, newId: e.target.value})}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="例如：1, 2, center..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">需要消耗的层数 MAX_LEVEL</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editForm.maxLevel || 3}
                    onChange={e => setEditForm({...editForm, maxLevel: parseInt(e.target.value) || 3})}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="例如：3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">连线节点 CONNECTIONS</label>
                  <input
                    type="text"
                    value={editForm.connections || ''}
                    onChange={e => setEditForm({...editForm, connections: e.target.value})}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="逗号分隔的节点编号，例如：1, 2, 3"
                  />
                  <p className="text-[10px] text-muted opacity-70">输入其他节点的编号以建立连线，使用逗号分隔。</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">天赋名称 NAME</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="例如：破窗理论"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">天赋描述 DESCRIPTION</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none min-h-[100px]"
                    placeholder="详细的天赋效果说明..."
                  />
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <p className="text-[10px] text-accent font-mono mb-4 uppercase tracking-widest">
                    同步至特质影响因素 (可选)
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">目标属性 TARGET_STAT</label>
                      <input
                        type="text"
                        list="targetStatOptions"
                        value={editForm.targetStat || ''}
                        onChange={e => setEditForm({...editForm, targetStat: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：移动速度"
                      />
                      <datalist id="targetStatOptions">
                        {(role === 'Survivor' ? SURVIVOR_TRAITS_TEMPLATE : HUNTER_TRAITS_TEMPLATE).flatMap(category => 
                          category.items.map(item => (
                            <option key={`${category.category}-${item.label}`} value={item.label} />
                          ))
                        )}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">修正值 MODIFIER</label>
                      <input
                        type="text"
                        value={editForm.modifier || ''}
                        onChange={e => setEditForm({...editForm, modifier: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：+50% 或 x1.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">简短效果 EFFECT</label>
                      <input
                        type="text"
                        value={editForm.effect || ''}
                        onChange={e => setEditForm({...editForm, effect: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：翻窗后加速"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-accent text-bg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent/80 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" /> 保存全部_SAVE_ALL
                  </button>
                  {selectedTalent && (
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedTalent ? (
                  <>
                    <div>
                      <h4 className="text-xl font-bold text-text mb-2">{selectedTalent.name}</h4>
                      <p className="text-sm text-muted/80 leading-relaxed whitespace-pre-wrap">
                        {selectedTalent.description}
                      </p>
                    </div>
                    
                    {(selectedTalent.targetStat || selectedTalent.modifier) && (
                      <div className="bg-bg/50 border border-border p-4 space-y-3">
                        <div className="text-[10px] text-accent font-mono uppercase tracking-widest mb-2">
                          影响因素数据_FACTOR_DATA
                        </div>
                        {selectedTalent.targetStat && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted">目标属性:</span>
                            <span className="text-text font-mono">{selectedTalent.targetStat}</span>
                          </div>
                        )}
                        {selectedTalent.modifier && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted">修正值:</span>
                            <span className="text-accent font-mono font-bold">{selectedTalent.modifier}</span>
                          </div>
                        )}
                        {selectedTalent.effect && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted">效果:</span>
                            <span className="text-text">{selectedTalent.effect}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wiki Link Section */}
                    <div className="pt-4 border-t border-border/50">
                      {linkedWikiEntry ? (
                        <button
                          onClick={() => onViewWiki?.(linkedWikiEntry.id)}
                          className="w-full flex items-center justify-between p-4 bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-accent" />
                            <div className="text-left">
                              <div className="text-[10px] text-muted font-mono uppercase tracking-widest">查看详细百科</div>
                              <div className="text-sm font-bold text-accent group-hover:cyber-glow-text transition-all">{linkedWikiEntry.title}</div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-accent opacity-50 group-hover:opacity-100" />
                        </button>
                      ) : (
                        isContributor && (
                          <button
                            onClick={() => {
                              // This would ideally open the wiki editor with pre-filled data
                              // For now, we'll just show a message or handle it via a callback
                              alert("请前往百科页面创建关联词条，并选择分类为'天赋技能'且关联当前节点。");
                            }}
                            className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-border text-muted hover:text-accent hover:border-accent transition-all text-xs font-mono"
                          >
                            <Plus className="w-4 h-4" /> 创建关联百科词条
                          </button>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted py-12">
                    <p className="text-sm">该节点尚未配置天赋数据。</p>
                    <p className="text-xs mt-2 opacity-50">点击右上角"编辑"进行配置。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Saved Builds List in Sidebar */}
        {user && savedBuilds.length > 0 && !selectedNodeId && (
          <div className="mt-8 pt-8 border-t border-border/50">
            <h4 className="text-[10px] text-accent font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-3 h-3" /> 已保存方案_SAVED_BUILDS
            </h4>
            <div className="space-y-2">
              {savedBuilds.map(build => (
                <div key={build.id} className="group flex items-center justify-between p-3 bg-bg/50 border border-border hover:border-accent/50 transition-all">
                  <button
                    onClick={() => setAllocatedPoints(build.points)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-bold text-text group-hover:text-accent transition-colors">{build.name}</div>
                    <div className="text-[9px] text-muted font-mono uppercase mt-1">
                      {build.updatedAt ? new Date(build.updatedAt.toDate()).toLocaleDateString() : '刚刚'}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteBuild(build.id)}
                    className="p-2 text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBulkImport && (
        <BulkImport 
          mode="talent" 
          role={role} 
          onClose={() => setShowBulkImport(false)} 
          onSuccess={() => {
            setShowBulkImport(false);
            // Definitions are fetched via onSnapshot, so they should auto-update
          }} 
        />
      )}

      {/* Save Build Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-serif text-accent mb-4 flex items-center gap-2">
                <Save className="w-5 h-5" /> 保存加点方案_SAVE_BUILD
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted uppercase font-mono tracking-widest">方案名称 BUILD_NAME</label>
                  <input
                    type="text"
                    value={buildName}
                    onChange={e => setBuildName(e.target.value)}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    placeholder="例如：牵制流、救人流..."
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-2 border border-border text-muted hover:text-text transition-colors text-xs font-mono uppercase tracking-widest"
                  >
                    取消_CANCEL
                  </button>
                  <button
                    onClick={handleSaveBuild}
                    disabled={saving || !buildName.trim()}
                    className="flex-1 px-4 py-2 bg-accent text-bg font-bold hover:bg-accent/80 disabled:opacity-50 transition-colors text-xs font-mono uppercase tracking-widest"
                  >
                    {saving ? '保存中...' : '确认保存_CONFIRM'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
