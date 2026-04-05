import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Save, Trash2, Plus, Info, ShieldCheck, Swords, Network, ExternalLink, FileText, FileJson, Search, List, X, Edit3, Wand2, Tag, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TalentNode, WikiEntry, DEFAULT_TAG_CONFIG, SURVIVOR_TRAITS_MODERN_TEMPLATE, HUNTER_TRAITS_TEMPLATE } from '../constants';
import { BulkImport } from './BulkImport';

interface TalentDefinition {
  id: string;
  role: 'Survivor' | 'Hunter';
  nodeId: string;
  name: string;
  description: string;
  targetStats: string[];
  modifier: string;
  effect: string;
  tags?: string[];
  tagColors?: Record<string, string>;
  targetRole?: 'Survivor' | 'Hunter' | 'Both';
}

const MAX_TOTAL_POINTS = 130;
const POINT_COST_PER_LEVEL = 5;

const TAG_COLORS = [
  { name: '默认', value: '' },
  { name: '红色', value: '#ff003c' },
  { name: '青色', value: '#00f3ff' },
  { name: '金色', value: '#d4af37' },
  { name: '紫色', value: '#a855f7' },
  { name: '绿色', value: '#22c55e' },
  { name: '橙色', value: '#f97316' },
];

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface TalentWebProps {
  user: FirebaseUser | null;
  userProfile: any;
  onViewWiki?: (entryId: string) => void;
}

const NODE_SPACING = 120;

// Default tags and their keywords for auto-tagging
// Moved to constants.ts for shared use

export const DEFAULT_NODES: (TalentNode & { x: number; y: number })[] = [
  { "id": "1", "x": -0.01, "y": -4.09, "maxLevel": 1, "connections": ["31"] },
  { "id": "2", "x": 2.33, "y": 1.94, "maxLevel": 3, "connections": ["3", "15", "40"] },
  { "id": "3", "x": 2.76, "y": 1.09, "maxLevel": 3, "connections": ["2", "21", "35", "40"] },
  { "id": "4", "x": 0, "y": 2.13, "maxLevel": 3, "connections": ["8", "10", "20", "27", "30", "41"] },
  { "id": "5", "x": -0.01, "y": 4.3, "maxLevel": 1, "connections": ["20"] },
  { "id": "6", "x": -0.95, "y": -2.8, "maxLevel": 3, "connections": ["22", "31", "36", "37"] },
  { "id": "7", "x": 1.74, "y": -2.35, "maxLevel": 3, "connections": ["13", "28", "33"] },
  { "id": "8", "x": -0.01, "y": 1.1, "maxLevel": 3, "connections": ["4", "23", "30", "41"] },
  { "id": "9", "x": 0.96, "y": 0.1, "maxLevel": 3, "connections": ["19", "23", "35", "40"] },
  { "id": "10", "x": -0.95, "y": 2.99, "maxLevel": 3, "connections": ["4", "20", "26", "41"] },
  { "id": "11", "x": 4, "y": 0.1, "maxLevel": 1, "connections": ["21"] },
  { "id": "12", "x": -4.05, "y": 0.09, "maxLevel": 1, "connections": ["32"] },
  { "id": "13", "x": 0.86, "y": -1.54, "maxLevel": 3, "connections": ["7", "19", "28", "37", "38"] },
  { "id": "14", "x": -2.36, "y": -1.73, "maxLevel": 3, "connections": ["16", "22", "24"] },
  { "id": "15", "x": 1.73, "y": 2.55, "maxLevel": 3, "connections": ["2", "27", "30"] },
  { "id": "16", "x": -2.8, "y": -0.89, "maxLevel": 3, "connections": ["14", "24", "32", "39"] },
  { "id": "17", "x": 2.77, "y": -0.9, "maxLevel": 3, "connections": ["19", "21", "33"] },
  { "id": "18", "x": -2.36, "y": 1.93, "maxLevel": 3, "connections": ["25", "26", "29"] },
  { "id": "19", "x": 1.55, "y": -0.79, "maxLevel": 3, "connections": ["9", "13", "17", "33", "35"] },
  { "id": "20", "x": -0.01, "y": 3.14, "maxLevel": 3, "connections": ["4", "5", "10", "27"] },
  { "id": "21", "x": 2.93, "y": 0.1, "maxLevel": 3, "connections": ["3", "11", "17", "35"] },
  { "id": "22", "x": -1.76, "y": -2.35, "maxLevel": 3, "connections": ["6", "14", "36"] },
  { "id": "23", "x": -0.01, "y": 0.08, "maxLevel": 0, "connections": ["8", "9", "34", "38"] },
  { "id": "24", "x": -1.58, "y": -0.79, "maxLevel": 3, "connections": ["14", "16", "34", "36", "39"] },
  { "id": "25", "x": -2.79, "y": 1.08, "maxLevel": 3, "connections": ["18", "29", "32", "39"] },
  { "id": "26", "x": -1.77, "y": 2.55, "maxLevel": 3, "connections": ["10", "18", "41"] },
  { "id": "27", "x": 0.94, "y": 2.99, "maxLevel": 3, "connections": ["4", "15", "20", "30"] },
  { "id": "28", "x": 0.94, "y": -2.81, "maxLevel": 3, "connections": ["7", "13", "31", "37"] },
  { "id": "29", "x": -1.58, "y": 1, "maxLevel": 3, "connections": ["18", "25", "34", "39", "41"] },
  { "id": "30", "x": 0.87, "y": 1.73, "maxLevel": 3, "connections": ["4", "8", "15", "27", "40"] },
  { "id": "31", "x": -0.01, "y": -2.98, "maxLevel": 3, "connections": ["1", "6", "28", "37"] },
  { "id": "32", "x": -2.97, "y": 0.11, "maxLevel": 3, "connections": ["12", "16", "25", "39"] },
  { "id": "33", "x": 2.33, "y": -1.73, "maxLevel": 3, "connections": ["7", "17", "19"] },
  { "id": "34", "x": -0.98, "y": 0.1, "maxLevel": 3, "connections": ["23", "24", "29", "39"] },
  { "id": "35", "x": 1.93, "y": 0.1, "maxLevel": 3, "connections": ["3", "9", "19", "21", "40"] },
  { "id": "36", "x": -0.87, "y": -1.54, "maxLevel": 3, "connections": ["6", "22", "24", "37", "38"] },
  { "id": "37", "x": 0.01, "y": -1.95, "maxLevel": 3, "connections": ["6", "13", "28", "31", "36", "38"] },
  { "id": "38", "x": -0.01, "y": -0.91, "maxLevel": 3, "connections": ["13", "23", "36", "37"] },
  { "id": "39", "x": -1.96, "y": 0.1, "maxLevel": 3, "connections": ["16", "24", "25", "29", "32", "34"] },
  { "id": "40", "x": 1.56, "y": 1, "maxLevel": 3, "connections": ["2", "3", "9", "30", "35"] },
  { "id": "41", "x": -0.88, "y": 1.73, "maxLevel": 3, "connections": ["4", "8", "10", "26", "29"] }
];

export const TalentWeb = ({ user, userProfile, onViewWiki }: TalentWebProps) => {
  const [role, setRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [talents, setTalents] = useState<TalentDefinition[]>([]);
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [editForm, setEditForm] = useState<Partial<TalentDefinition> & {
    newId?: string;
    maxLevel?: number;
    connections?: string;
    x?: number;
    y?: number;
    selectedTalentId?: string;
    tagInput?: string;
    selectedTagColor?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({});
  const [builderMode, setBuilderMode] = useState(true);
  const [savedBuilds, setSavedBuilds] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [buildName, setBuildName] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'tags'>('tree');
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkTagColor, setBulkTagColor] = useState('');
  const [tagToRename, setTagToRename] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTalentIds, setSelectedTalentIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showStatSelector, setShowStatSelector] = useState(false);

  const toggleStat = (stat: string) => {
    const current = editForm.targetStats || [];
    if (current.includes(stat)) {
      setEditForm({...editForm, targetStats: current.filter(s => s !== stat)});
    } else {
      setEditForm({...editForm, targetStats: [...current, stat]});
    }
  };

  const [treeNodes, setTreeNodes] = useState<(TalentNode & { x: number; y: number })[]>(DEFAULT_NODES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'talent_tree_layout', role), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nodes) {
          // Ensure unique nodes by ID to prevent React key errors
          const uniqueMap = new Map();
          (data.nodes as any[]).forEach(node => {
            if (node && node.id) {
              // Use node.id as the primary key for deduplication
              uniqueMap.set(node.id, node);
            }
          });
          setTreeNodes(Array.from(uniqueMap.values()) as (TalentNode & { x: number; y: number })[]);
        }
      } else {
        setTreeNodes(DEFAULT_NODES);
      }
    }, (error) => {
      console.error("Error fetching talent tree layout:", error);
    });
    return () => unsub();
  }, [role]);

  const nodes = treeNodes;
  const [viewBox, setViewBox] = useState("-600 -600 1200 1200");

  useEffect(() => {
    if (selectedNodeId && viewMode === 'tree') {
      const node = treeNodes.find(n => n.id === selectedNodeId);
      if (node) {
        const targetX = node.x * NODE_SPACING;
        const targetY = node.y * NODE_SPACING;
        // Focus view: center on node with a reasonable zoom
        const width = 1000; 
        const height = 800;
        setViewBox(`${targetX - width/2} ${targetY - height/2} ${width} ${height}`);
      }
    } else {
      // Full tree view - aligned to top
      const paddingSide = 80;
      const paddingTop = 60;
      const paddingBottom = 100; 
      
      const minX = treeNodes.length > 0 ? Math.min(...treeNodes.map(n => n.x * NODE_SPACING)) - paddingSide : -600;
      const maxX = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.x * NODE_SPACING)) + paddingSide : 600;
      const minY = treeNodes.length > 0 ? Math.min(...treeNodes.map(n => n.y * NODE_SPACING)) - paddingTop : -600;
      const maxY = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.y * NODE_SPACING)) + paddingBottom : 600;
      
      const width = (maxX - minX) / zoom;
      const height = (maxY - minY) / zoom;
      
      // Center the zoom
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      if (zoom === 1) {
        setViewBox(`${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
      } else {
        setViewBox(`${centerX - width/2} ${centerY - height/2} ${width} ${height}`);
      }
    }
  }, [selectedNodeId, treeNodes, viewMode, zoom]);

  const totalPointsUsed = Object.values(allocatedPoints).reduce((sum, val) => sum + (val * POINT_COST_PER_LEVEL), 0);
  const baseColor = role === 'Survivor' ? '#00f3ff' : '#ff003c';

  const getNodeColors = (node: any) => {
    const isCenter = node.id === '23';
    const isSelected = selectedNodeId === node.id;
    const hasData = talents.some(t => t.id === node.talentId || (t.role === role && t.nodeId === node.id));
    const currentLevel = allocatedPoints[node.id] || 0;
    const isAllocated = currentLevel > 0;
    const unlockable = isUnlockable(node.id);
    
    if (isCenter) {
      return {
        fill: baseColor,
        stroke: isSelected ? '#ffffff' : baseColor,
        opacity: 1,
        strokeWidth: isSelected ? 3 : 2
      };
    }
    
    if (isAllocated) {
      return {
        fill: baseColor,
        stroke: isSelected ? '#ffffff' : baseColor,
        opacity: 1,
        strokeWidth: isSelected ? 3 : 2
      };
    }
    
    if (unlockable) {
      return {
        fill: hasData ? `${baseColor}30` : '#1a1a1a',
        stroke: isSelected ? '#ffffff' : baseColor,
        opacity: 0.8,
        strokeWidth: isSelected ? 3 : 1.5
      };
    }
    
    return {
      fill: '#1a1a1a',
      stroke: isSelected ? '#ffffff' : '#333333',
      opacity: 0.3,
      strokeWidth: isSelected ? 3 : 1
    };
  };

  useEffect(() => {
    if (!user) {
      setAllocatedPoints({});
      return;
    }

    const unsub = onSnapshot(doc(db, 'user_talent_allocations', `${user.uid}_${role}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.allocatedPoints) {
          setAllocatedPoints(data.allocatedPoints);
        }
      } else {
        setAllocatedPoints({});
      }
    }, (error) => {
      console.error("Error fetching user talent allocations:", error);
    });

    return () => unsub();
  }, [user, role]);

  const getLinkedWikiEntry = (id: string) => {
    return wikiEntries.find(e => e.talentId === id);
  };

  // Helper to draw curved lines for mind map feel
  const renderConnection = (from: any, to: any) => {
    const fromAllocated = from.id === '23' || (allocatedPoints[from.id] || 0) > 0;
    const toAllocated = to.id === '23' || (allocatedPoints[to.id] || 0) > 0;
    const isAllocated = fromAllocated && toAllocated;
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

  const renderDetailsContent = () => {
    const selectedTalent = talents.find(t => t.id === editForm.selectedTalentId || (t.role === role && t.nodeId === selectedNodeId));

    return (
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {editForm.selectedTalentId && <div className="text-[10px] text-muted font-mono mb-1 uppercase tracking-widest">TALENT_ID: {editForm.selectedTalentId}</div>}
            {selectedNodeId && <div className="text-[10px] text-muted font-mono uppercase tracking-widest">NODE_ID: {selectedNodeId}</div>}
            
            {editForm.tags && editForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(new Set(editForm.tags || [])).map((tag: string) => {
                  const tagColor = editForm.tagColors?.[tag] || '#00f3ff';
                  return (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-[9px] font-mono uppercase border"
                      style={{ 
                        backgroundColor: tagColor + '10',
                        borderColor: tagColor + '30',
                        color: tagColor
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {isContributor && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs font-mono uppercase tracking-widest px-4 py-1.5 border transition-all flex items-center gap-2 ${
                isEditing 
                  ? 'bg-primary text-white border-primary' 
                  : 'text-muted hover:text-accent border-border hover:border-accent'
              }`}
            >
              {isEditing ? (
                <><X className="w-3 h-3" /> 取消编辑_CANCEL</>
              ) : (
                <><Edit3 className="w-3 h-3" /> 编辑天赋_EDIT</>
              )}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <div className="space-y-2 mb-4">
                <label className="text-[10px] text-accent uppercase font-mono tracking-widest">选择列表天赋 SELECT_TALENT</label>
                <select
                  value={editForm.selectedTalentId || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val) {
                      const selected = talents.find(t => t.id === val);
                      if (selected) {
                        setEditForm({
                          ...editForm,
                          selectedTalentId: val,
                          name: selected.name,
                          description: selected.description,
                          tags: selected.tags || [],
                          tagColors: selected.tagColors || {},
                          tagInput: ''
                        });
                      }
                    } else {
                      setEditForm({
                        ...editForm,
                        selectedTalentId: '',
                        name: '',
                        description: '',
                        tags: [],
                        tagColors: {},
                        tagInput: ''
                      });
                    }
                  }}
                  className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                >
                  <option value="">-- 新建天赋 --</option>
                  {talents.filter(t => t.role === role).map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.id}</option>
                  ))}
                </select>
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
              <div className="space-y-2 mt-4">
                <label className="text-[10px] text-muted uppercase font-mono tracking-widest">天赋描述 DESCRIPTION</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none min-h-[100px]"
                  placeholder="详细的天赋效果说明..."
                />
              </div>

              {/* Sync to Trait Influence Factors (Optional) */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <h4 className="text-[10px] text-accent uppercase font-mono tracking-widest mb-4 flex items-center gap-2">
                  <Wand2 size={10} /> 同步至特质影响因素 (可选)
                </h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted uppercase font-mono tracking-widest">影响角色 TARGET_ROLE</label>
                    <div className="flex gap-2">
                      {(['Survivor', 'Hunter', 'Both'] as const).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setEditForm({...editForm, targetRole: r})}
                          className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                            editForm.targetRole === r 
                              ? 'bg-accent border-accent text-bg' 
                              : 'bg-bg/50 border-border text-muted hover:border-accent/50'
                          }`}
                        >
                          {r === 'Survivor' ? '求生者' : r === 'Hunter' ? '监管者' : '全部'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted uppercase font-mono tracking-widest">目标属性 TARGET_STATS (逗号分隔)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.targetStats?.join(', ') || ''}
                        onChange={e => setEditForm({...editForm, targetStats: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        className="flex-1 bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：跑动速度, 走路速度"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStatSelector(true)}
                        className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-bg transition-all flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest"
                        title="从模板选择"
                      >
                        <Plus size={14} />
                        选择_SELECT
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">修正值 MODIFIER</label>
                      <input
                        type="text"
                        value={editForm.modifier || ''}
                        onChange={e => setEditForm({...editForm, modifier: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：+10% 或 -2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">具体效果 EFFECT</label>
                      <input
                        type="text"
                        value={editForm.effect || ''}
                        onChange={e => setEditForm({...editForm, effect: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：翻窗后加速"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted font-mono leading-relaxed">
                    * 填写此部分后，该天赋将自动同步至角色详情页的“影响因素”分析中。
                  </p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] text-muted uppercase font-mono tracking-widest flex items-center gap-2">
                  <Tag size={10} /> 自定义标签 TAGS
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.tagInput || ''}
                      onChange={e => setEditForm({...editForm, tagInput: e.target.value})}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editForm.tagInput?.trim()) {
                          e.preventDefault();
                          const newTag = editForm.tagInput.trim();
                          if (!editForm.tags?.includes(newTag)) {
                            const newTagColors = { ...(editForm.tagColors || {}) };
                            if (editForm.selectedTagColor) {
                              newTagColors[newTag] = editForm.selectedTagColor;
                            }
                            setEditForm({
                              ...editForm,
                              tags: [...(editForm.tags || []), newTag],
                              tagColors: newTagColors,
                              tagInput: ''
                            });
                          }
                        }
                      }}
                      className="flex-1 bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                      placeholder="输入标签并回车..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editForm.tagInput?.trim()) {
                          const newTag = editForm.tagInput.trim();
                          if (!editForm.tags?.includes(newTag)) {
                            const newTagColors = { ...(editForm.tagColors || {}) };
                            if (editForm.selectedTagColor) {
                              newTagColors[newTag] = editForm.selectedTagColor;
                            }
                            setEditForm({
                              ...editForm,
                              tags: [...(editForm.tags || []), newTag],
                              tagColors: newTagColors,
                              tagInput: ''
                            });
                          }
                        }
                      }}
                      className="bg-bg border border-border px-3 py-2 text-[10px] font-mono hover:text-accent transition-colors uppercase tracking-widest"
                    >
                      添加_ADD
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = ((editForm.name || '') + (editForm.description || '')).toLowerCase();
                        const matchingConfigs = DEFAULT_TAG_CONFIG
                          .filter(config => config.keywords.some(k => text.includes(k)));
                        
                        const autoTags = matchingConfigs.map(config => config.name);
                        const newTagColors = { ...(editForm.tagColors || {}) };
                        matchingConfigs.forEach(config => {
                          if (!newTagColors[config.name]) {
                            newTagColors[config.name] = config.color;
                          }
                        });
                        
                        const currentTags = editForm.tags || [];
                        const combinedTags = Array.from(new Set([...currentTags, ...autoTags]));
                        
                        setEditForm({
                          ...editForm,
                          tags: combinedTags,
                          tagColors: newTagColors
                        });
                      }}
                      className="bg-bg border border-border px-3 py-2 text-[10px] font-mono hover:text-accent transition-colors uppercase tracking-widest"
                      title="根据名称和描述自动识别标签"
                    >
                      自动识别_AUTO
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] text-muted font-mono uppercase mr-1">选择颜色:</span>
                    {TAG_COLORS.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setEditForm({...editForm, selectedTagColor: color.value})}
                        className={`w-5 h-5 border transition-all ${
                          (editForm.selectedTagColor || '') === color.value 
                            ? 'border-white scale-110' 
                            : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.value || '#333' }}
                        title={color.name}
                      />
                    ))}
                  </div>

                  {editForm.tags && editForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {Array.from(new Set(editForm.tags || [])).map((tag: string) => (
                        <div key={tag} className="flex items-center group">
                          <span 
                            className="px-2 py-0.5 text-[9px] font-mono uppercase border"
                            style={{ 
                              backgroundColor: (editForm.tagColors?.[tag] || '#00f3ff') + '10',
                              borderColor: (editForm.tagColors?.[tag] || '#00f3ff') + '30',
                              color: editForm.tagColors?.[tag] || '#00f3ff'
                            }}
                          >
                            {tag}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newTagColors = { ...(editForm.tagColors || {}) };
                              delete newTagColors[tag];
                              setEditForm({
                                ...editForm,
                                tags: editForm.tags?.filter(t => t !== tag),
                                tagColors: newTagColors
                              });
                            }}
                            className="p-1 text-muted hover:text-primary transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedNodeId && (
                <div className="space-y-4 mt-4 pt-4 border-t border-border/50">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted uppercase font-mono tracking-widest">节点编号 NODE_ID</label>
                    <input
                      type="text"
                      value={editForm.newId || ''}
                      onChange={e => setEditForm({...editForm, newId: e.target.value})}
                      className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                      placeholder="例如：1, 2, 23..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted uppercase font-mono tracking-widest">需要消耗的层数 MAX_LEVEL</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={editForm.maxLevel || 3}
                        onChange={e => setEditForm({...editForm, maxLevel: parseInt(e.target.value) || 3})}
                        className="flex-1 bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：3"
                      />
                      <button
                        onClick={handleSaveNodeOnly}
                        disabled={saving}
                        className="bg-bg border border-border px-3 py-2 text-[10px] font-mono hover:text-accent transition-colors uppercase tracking-widest"
                        title="单独保存节点层数与布局配置"
                      >
                        保存层数_SAVE
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">坐标 X_COORD</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.x ?? 0}
                        onChange={e => setEditForm({...editForm, x: parseFloat(e.target.value) || 0})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted uppercase font-mono tracking-widest">坐标 Y_COORD</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.y ?? 0}
                        onChange={e => setEditForm({...editForm, y: parseFloat(e.target.value) || 0})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                      />
                    </div>
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
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-accent text-bg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent/80 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" /> 保存_SAVE
              </button>
              {selectedTalent && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> 删除天赋_DELETE
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

                {/* Sync to Trait Influence Factors (Optional) */}
                {selectedTalent.targetStats && selectedTalent.targetStats.length > 0 && (
                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-[10px] text-accent uppercase font-mono tracking-widest mb-4 flex items-center gap-2">
                      <Wand2 size={10} /> 同步至特质影响因素
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-mono uppercase">影响角色:</span>
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
                          {selectedTalent.targetRole === 'Survivor' ? '求生者' : selectedTalent.targetRole === 'Hunter' ? '监管者' : '全部'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-mono uppercase">目标属性:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedTalent.targetStats.map(stat => (
                            <span key={stat} className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-mono border border-accent/20">
                              {stat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-mono uppercase">修正值:</span>
                        <span className="text-sm font-mono text-text">{selectedTalent.modifier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-mono uppercase">具体效果:</span>
                        <span className="text-sm font-mono text-text">{selectedTalent.effect}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted py-12">
                <p className="text-sm">该节点尚未配置天赋数据。</p>
                <p className="text-xs mt-2 opacity-50">点击右上角"编辑"进行配置。</p>
              </div>
            )}
          </div>
        )}

        {/* Saved Builds List */}
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
    );
  };
  const ListView = () => {
    const allTalentsRaw = talents.filter(t => t.role === role).map(talent => {
      const node = treeNodes.find(n => n.talentId === talent.id || n.id === talent.nodeId);
      const nodeId = node?.id;
      const wiki = getLinkedWikiEntry(talent.id) || (nodeId ? getLinkedWikiEntry(nodeId) : undefined);
      return {
        id: talent.id,
        nodeId: nodeId,
        maxLevel: node?.maxLevel || 3,
        name: talent.name || wiki?.title || talent.id,
        description: talent.description || '暂无描述',
        level: nodeId ? (allocatedPoints[nodeId] || 0) : 0,
        hasData: true,
        talentData: talent,
        isAllocated: nodeId ? (allocatedPoints[nodeId] || 0) > 0 : false
      };
    });

    // Ensure uniqueness by ID to prevent React key errors
    const allTalentsMap = new Map();
    allTalentsRaw.forEach(t => {
      if (t.id) allTalentsMap.set(t.id, t);
    });
    const allTalents = Array.from(allTalentsMap.values());

    const handleAutoTagAll = async () => {
      if (!isContributor) return;
      
      setSaving(true);
      try {
        const batch = [];
        for (const talent of allTalents) {
          const text = (talent.name + (talent.description || '')).toLowerCase();
          const matchingConfigs = DEFAULT_TAG_CONFIG
            .filter(config => config.keywords.some(k => text.includes(k)));
          
          const autoTags = matchingConfigs.map(config => config.name);
          const currentTags = talent.talentData.tags || [];
          const combinedTags = Array.from(new Set([...currentTags, ...autoTags]));
          
          if (combinedTags.length > currentTags.length) {
            const newTagColors = { ...(talent.talentData.tagColors || {}) };
            matchingConfigs.forEach(config => {
              if (!newTagColors[config.name]) {
                newTagColors[config.name] = config.color;
              }
            });

            const docId = `${talent.talentData.role.toLowerCase()}_${talent.talentData.nodeId}`;
            batch.push(setDoc(doc(db, 'talent_definitions', docId), {
              ...talent.talentData,
              tags: combinedTags,
              tagColors: newTagColors,
              updatedAt: serverTimestamp()
            }, { merge: true }));
          }
        }
        
        if (batch.length > 0) {
          await Promise.all(batch);
        }
      } catch (err) {
        console.error("Auto-tag all error:", err);
      } finally {
        setSaving(false);
      }
    };

    const filteredTalents = allTalents.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.talentData.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTag = !selectedTag || t.talentData.tags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });

    // Get all unique tags for the current role
    const allAvailableTags = Array.from(new Set(
      allTalents.flatMap(t => t.talentData.tags || [])
    )).sort();

    return (
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-6">
        <div className="flex flex-col gap-4">
          {/* Tag Filter Bar */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                !selectedTag ? 'bg-accent text-bg border-accent' : 'bg-transparent text-muted border-border hover:border-accent/50'
              }`}
            >
              全部_ALL
            </button>
            {DEFAULT_TAG_CONFIG.map(config => (
              <button
                key={config.name}
                onClick={() => setSelectedTag(selectedTag === config.name ? null : config.name)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                  selectedTag === config.name ? 'bg-accent text-bg border-accent' : 'bg-transparent text-muted border-border hover:border-accent/50'
                }`}
              >
                {config.name}
              </button>
            ))}
            {allAvailableTags.filter(tag => !DEFAULT_TAG_CONFIG.some(c => c.name === tag)).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                  selectedTag === tag ? 'bg-accent text-bg border-accent' : 'bg-transparent text-muted border-border hover:border-accent/50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {isContributor && (
            <div className="flex flex-col gap-4">
              {viewMode === 'tags' && (
                <div className="bg-card/30 p-4 border border-border space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-accent flex items-center gap-2">
                    <Tag className="w-3 h-3" /> 标签全局管理 GLOBAL_TAG_MANAGEMENT
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {allAvailableTags.map(tag => (
                      <div key={tag} className="flex items-center gap-1 bg-bg/50 border border-border p-1 group">
                        <span className="text-[10px] font-mono px-2">{tag}</span>
                        <button
                          onClick={() => { setTagToRename(tag); setNewTagName(tag); }}
                          className="p-1 text-muted hover:text-accent transition-colors"
                          title="重命名"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          onClick={() => { if(window.confirm(`确定要全局删除标签 "${tag}" 吗？`)) handleDeleteTagGlobal(tag); }}
                          className="p-1 text-muted hover:text-primary transition-colors"
                          title="删除"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {tagToRename && (
                    <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-sm">
                      <span className="text-[10px] font-mono text-muted uppercase">重命名 "{tagToRename}" 为:</span>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="bg-bg border border-border px-2 py-1 text-xs font-mono outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => { handleRenameTag(tagToRename, newTagName); setTagToRename(null); }}
                        className="px-3 py-1 bg-accent text-bg text-[10px] font-mono uppercase tracking-widest"
                      >
                        确认_CONFIRM
                      </button>
                      <button
                        onClick={() => setTagToRename(null)}
                        className="px-3 py-1 bg-bg border border-border text-muted text-[10px] font-mono uppercase tracking-widest"
                      >
                        取消_CANCEL
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between bg-card/30 p-3 border border-border">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedTalentIds.length === filteredTalents.length) {
                          setSelectedTalentIds([]);
                        } else {
                          setSelectedTalentIds(filteredTalents.map(t => t.id));
                        }
                      }}
                      className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                        selectedTalentIds.length > 0 && selectedTalentIds.length === filteredTalents.length 
                          ? 'bg-accent border-accent' 
                          : 'border-muted group-hover:border-accent'
                      }`}
                    >
                      {selectedTalentIds.length > 0 && selectedTalentIds.length === filteredTalents.length && (
                        <div className="w-2 h-2 bg-bg" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted">全选_SELECT_ALL</span>
                  </label>
                  <span className="text-[10px] font-mono text-muted">已选择: {selectedTalentIds.length}</span>
                </div>
                {selectedTalentIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-bg/50 p-1 border border-border">
                    <input
                      type="text"
                      value={bulkTagInput}
                      onChange={(e) => setBulkTagInput(e.target.value)}
                      placeholder="新标签..."
                      className="bg-transparent border-none px-2 py-1 text-[10px] font-mono outline-none w-24"
                    />
                    <div className="flex gap-1">
                      {TAG_COLORS.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setBulkTagColor(color.value)}
                          className={`w-3 h-3 border ${bulkTagColor === color.value ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: color.value || '#333' }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleBulkTag}
                      disabled={saving || !bulkTagInput.trim()}
                      className="px-2 py-1 bg-accent/20 text-accent hover:bg-accent hover:text-bg transition-all text-[10px] font-mono uppercase tracking-widest disabled:opacity-50"
                    >
                      添加标签_ADD_TAG
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                      onClick={handleBulkDelete}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20 transition-colors text-[10px] font-mono uppercase tracking-widest disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      批量删除_BULK_DELETE
                    </button>
                  </div>
                )}
                <button
                  onClick={handleAutoTagAll}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-bg transition-all text-[10px] font-mono uppercase tracking-widest disabled:opacity-50"
                >
                  <Wand2 size={12} />
                  自动标记所有_AUTO_TAG_ALL
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTalents.map(talent => (
            <div 
              key={talent.id}
              onClick={() => {
                if (talent.nodeId) {
                  setSelectedNodeId(talent.nodeId);
                  const node = treeNodes.find(n => n.id === talent.nodeId);
                  setEditForm({
                    ...talent.talentData,
                    newId: talent.nodeId,
                    maxLevel: node?.maxLevel || 3,
                    connections: node?.connections.join(', ') || '',
                    selectedTalentId: talent.id,
                    tags: talent.talentData.tags || [],
                    tagColors: talent.talentData.tagColors || {},
                    tagInput: ''
                  });
                  // Do not enter edit mode automatically
                  setIsEditing(false);
                } else {
                  // If talent is not on the tree, we can still select it for editing, but we don't select a node
                  setSelectedNodeId(null);
                  setEditForm({
                    ...talent.talentData,
                    selectedTalentId: talent.id,
                    tags: talent.talentData.tags || [],
                    tagColors: talent.talentData.tagColors || {},
                    tagInput: ''
                  });
                  // Do not enter edit mode automatically
                  setIsEditing(false);
                }
              }}
              className={`p-4 border transition-all cursor-pointer group relative overflow-hidden ${
                (selectedNodeId === talent.nodeId && talent.nodeId) || editForm.selectedTalentId === talent.id ? 'bg-card/80' : 'border-border hover:border-accent/30 bg-card/50'
              }`}
              style={{ 
                borderColor: ((selectedNodeId === talent.nodeId && talent.nodeId) || editForm.selectedTalentId === talent.id) ? baseColor : undefined
              }}
            >
              {isContributor && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTalentIds(prev => 
                      prev.includes(talent.id) 
                        ? prev.filter(id => id !== talent.id) 
                        : [...prev, talent.id]
                    );
                  }}
                  className="absolute top-2 right-2 w-4 h-4 border flex items-center justify-center transition-colors z-10"
                  style={{ 
                    backgroundColor: selectedTalentIds.includes(talent.id) ? baseColor : 'transparent',
                    borderColor: selectedTalentIds.includes(talent.id) ? baseColor : '#333'
                  }}
                >
                  {selectedTalentIds.includes(talent.id) && (
                    <div className="w-2 h-2 bg-bg" />
                  )}
                </div>
              )}
              {((selectedNodeId === talent.nodeId && talent.nodeId) || editForm.selectedTalentId === talent.id) && (
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: baseColor }} />
              )}
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <h3 
                    className="font-bold transition-colors"
                    style={{ color: ((selectedNodeId === talent.nodeId && talent.nodeId) || editForm.selectedTalentId === talent.id) ? baseColor : undefined }}
                  >
                    {talent.name}
                  </h3>
                  <span className="text-[9px] font-mono text-muted uppercase tracking-tighter">ID: {talent.id}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {talent.nodeId && (
                    <div className="text-[10px] font-mono text-muted bg-bg/50 px-1.5 py-0.5 border border-border">
                      {talent.level} / {talent.maxLevel}
                    </div>
                  )}
                  {talent.hasData && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: baseColor }} />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted line-clamp-2 mb-2 leading-relaxed">{talent.description}</p>
              
              {talent.talentData.tags && talent.talentData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.from(new Set(talent.talentData.tags || [])).map((tag: string) => {
                    const tagColor = talent.talentData.tagColors?.[tag] || '#00f3ff';
                    return (
                      <span 
                        key={tag} 
                        className="px-1.5 py-0.5 text-[8px] font-mono uppercase border"
                        style={{ 
                          backgroundColor: tagColor + '10',
                          borderColor: tagColor + '30',
                          color: tagColor
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-1 max-w-[100px]">
                  {Array.from({ length: talent.maxLevel }).map((_, i) => (
                    <div 
                      key={i}
                      className="h-1 flex-1 rounded-full"
                      style={{ 
                        backgroundColor: i < talent.level ? baseColor : '#333'
                      }}
                    />
                  ))}
                </div>
                {isContributor && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (talent.nodeId) {
                        setSelectedNodeId(talent.nodeId);
                        const node = treeNodes.find(n => n.id === talent.nodeId);
                        setEditForm({
                          ...talent.talentData,
                          newId: talent.nodeId,
                          maxLevel: node?.maxLevel || 3,
                          connections: node?.connections.join(', ') || '',
                          selectedTalentId: talent.id,
                          tags: talent.talentData.tags || [],
                          tagColors: talent.talentData.tagColors || {},
                          tagInput: ''
                        });
                      } else {
                        setSelectedNodeId(null);
                        setEditForm({
                          ...talent.talentData,
                          selectedTalentId: talent.id,
                          tags: talent.talentData.tags || [],
                          tagColors: talent.talentData.tagColors || {},
                          tagInput: ''
                        });
                      }
                      setIsEditing(true);
                    }}
                    className="text-[10px] font-mono hover:underline uppercase tracking-widest"
                    style={{ color: baseColor }}
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
      const uniqueMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Use document ID as the primary unique identifier
        const talentId = doc.id;
        uniqueMap.set(talentId, {
          ...data,
          id: talentId
        });
      });
      setTalents(Array.from(uniqueMap.values()) as TalentDefinition[]);
    }, (error) => {
      console.error("Error fetching talent definitions:", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch wiki entries that are linked to talents
  useEffect(() => {
    const q = query(collection(db, 'entries'), where('type', '==', 'talent'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uniqueMap = new Map();
      snapshot.docs.forEach(doc => {
        uniqueMap.set(doc.id, {
          id: doc.id,
          ...doc.data()
        });
      });
      setWikiEntries(Array.from(uniqueMap.values()) as WikiEntry[]);
    }, (error) => {
      console.error("Error fetching wiki entries:", error);
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
    }, (error) => {
      console.error("Error fetching saved builds:", error);
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
    if (nodeId === '23') return true;
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
    
    // Check if any connected node is maxed out or is center
    for (const connId of neighbors) {
      const connNode = treeNodes.find(n => n.id === connId);
      const maxLevel = connNode?.maxLevel || 3;
      if (connId === '23' || (allocatedPoints[connId] || 0) >= maxLevel) {
        return true;
      }
    }
    
    return false;
  };

  const getPathToCenter = (targetId: string) => {
    if (targetId === '23') return ['23'];
    
    const queue: { id: string; path: string[] }[] = [{ id: '23', path: ['23'] }];
    const visited = new Set<string>(['23']);
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      const node = treeNodes.find(n => n.id === id);
      if (!node) continue;
      
      const neighbors = new Set<string>();
      node.connections.forEach(c => neighbors.add(c));
      treeNodes.forEach(n => {
        if (n.connections.includes(id)) {
          neighbors.add(n.id);
        }
      });
      
      for (const neighborId of neighbors) {
        if (neighborId === targetId) {
          return [...path, targetId];
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, path: [...path, neighborId] });
        }
      }
    }
    return [];
  };

  const canRemovePoint = (nodeId: string) => {
    const currentLevel = allocatedPoints[nodeId] || 0;
    if (currentLevel <= 0) return false;
    
    // If we are removing a point and it's no longer maxed, 
    // we must check if any allocated neighbors depend on it being maxed.
    const node = treeNodes.find(n => n.id === nodeId);
    const maxLevel = node?.maxLevel || 3;
    
    if (currentLevel <= maxLevel) {
      // Check if any allocated neighbor would become invalid
      const neighbors = new Set<string>();
      if (node) {
        node.connections.forEach(c => neighbors.add(c));
      }
      treeNodes.forEach(n => {
        if (n.connections.includes(nodeId)) {
          neighbors.add(n.id);
        }
      });

      // If we are reducing from max to max-1, check if any allocated neighbor 
      // depends on this node being maxed.
      // Wait, the rule is "must be maxed to click next".
      // So if A is not maxed, B cannot have points.
      if (currentLevel === maxLevel) {
        for (const neighborId of neighbors) {
          if ((allocatedPoints[neighborId] || 0) > 0) {
            // This neighbor has points, it might depend on this node being maxed.
            // We need to check if there's ANOTHER maxed neighbor for that node.
            const neighborNode = treeNodes.find(n => n.id === neighborId);
            const otherNeighbors = new Set<string>();
            if (neighborNode) {
              neighborNode.connections.forEach(c => otherNeighbors.add(c));
            }
            treeNodes.forEach(n => {
              if (n.connections.includes(neighborId)) {
                otherNeighbors.add(n.id);
              }
            });
            
            let hasOtherMaxedParent = false;
            for (const otherId of otherNeighbors) {
              if (otherId === nodeId) continue;
              const otherNode = treeNodes.find(n => n.id === otherId);
              const otherMax = otherNode?.maxLevel || 3;
              if (otherId === '23' || (allocatedPoints[otherId] || 0) >= otherMax) {
                hasOtherMaxedParent = true;
                break;
              }
            }
            
            if (!hasOtherMaxedParent) return false;
          }
        }
      }
    }

    if (currentLevel === 1) {
      // Standard connectivity check
      const testAllocated = { ...allocatedPoints };
      delete testAllocated[nodeId];
      
      const reachable = new Set<string>(['23']);
      const queue = ['23'];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentNode = treeNodes.find(n => n.id === current);
        const neighbors = new Set<string>();
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
      
      for (const id of Object.keys(testAllocated)) {
        if (testAllocated[id] > 0 && !reachable.has(id)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const allocatePoint = (nodeId: string) => {
    if (nodeId === '23') return;
    
    const path = getPathToCenter(nodeId);
    if (path.length === 0) return;
    
    setAllocatedPoints(prev => {
      const next = { ...prev };
      let currentTotalPoints = Object.values(next).reduce((sum, val) => sum + (val * POINT_COST_PER_LEVEL), 0);
      
      // Iterate through the path from center outwards
      for (let i = 1; i < path.length; i++) {
        const pNodeId = path[i];
        const node = treeNodes.find(n => n.id === pNodeId);
        const maxLevel = node?.maxLevel || 3;
        const currentLevel = next[pNodeId] || 0;
        
        // If it's an intermediate node, it MUST be maxed to proceed to the next node in path
        // If it's the target node, we just want to add 1 point (or max it if it's part of a path unlock)
        // Actually, "点击末端节点直接解锁路径上节点" implies we fill the whole path.
        // But if we click an intermediate node, we just add 1 point to it (if its parent is maxed).
        
        let targetLevel = currentLevel;
        if (i < path.length - 1) {
          // Intermediate node: must be maxed
          targetLevel = maxLevel;
        } else {
          // Target node: just add 1
          targetLevel = Math.min(currentLevel + 1, maxLevel);
        }
        
        const pointsNeeded = (targetLevel - currentLevel) * POINT_COST_PER_LEVEL;
        if (pointsNeeded > 0) {
          if ((currentTotalPoints + pointsNeeded) <= MAX_TOTAL_POINTS) {
            next[pNodeId] = targetLevel;
            currentTotalPoints += pointsNeeded;
          } else {
            // Not enough points to fulfill this step
            break;
          }
        }
      }
      return next;
    });
  };

  const removePoint = (nodeId: string) => {
    if (nodeId === '23') return;
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
    if (nodeId === '23') return;
    
    // Always show info first when clicking a node
    setIsEditing(false);
    
    if (builderMode) {
      if (e?.shiftKey || e?.button === 2) {
        removePoint(nodeId);
      } else {
        allocatePoint(nodeId);
      }
    }
    
    setSelectedNodeId(nodeId);
    const node = treeNodes.find(n => n.id === nodeId);
    const existingTalent = talents.find(t => t.id === node?.talentId) || talents.find(t => t.role === role && t.nodeId === nodeId);
    
    if (existingTalent) {
      setEditForm({
        ...existingTalent,
        newId: nodeId,
        maxLevel: node?.maxLevel || 3,
        connections: node?.connections.join(', ') || '',
        x: node?.x || 0,
        y: node?.y || 0,
        selectedTalentId: existingTalent.id,
        tags: existingTalent.tags || [],
        tagColors: existingTalent.tagColors || {},
        tagInput: '',
        targetRole: existingTalent.targetRole || (role === 'Hunter' ? 'Hunter' : 'Survivor')
      });
    } else {
      setEditForm({
        role,
        nodeId,
        name: '',
        description: '',
        targetStats: [],
        modifier: '',
        effect: '',
        newId: nodeId,
        maxLevel: node?.maxLevel || 3,
        connections: node?.connections.join(', ') || '',
        x: node?.x || 0,
        y: node?.y || 0,
        selectedTalentId: '',
        tags: [],
        tagColors: {},
        tagInput: '',
        targetRole: role === 'Hunter' ? 'Hunter' : 'Survivor'
      });
    }
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

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedNodeId && !editForm.selectedTalentId) return;
    
    // If name is missing, use default name
    const finalName = editForm.name || '未命名天赋';
    const oldId = selectedNodeId;
    const newId = editForm.newId || oldId;
    let finalTalentId = editForm.selectedTalentId;
    
    setSaving(true);
    try {
      const { 
        newId: _, 
        maxLevel: __, 
        connections: ___, 
        selectedTalentId: ____, 
        tagInput: _____, 
        selectedTagColor: ______, 
        id: _______, // Remove id if it exists
        ...talentData 
      } = editForm;
      
      // Ensure tags and tagColors are included even if empty
      const finalTalentData = {
        ...talentData,
        tags: editForm.tags || [],
        tagColors: editForm.tagColors || {},
        name: finalName,
        role,
        nodeId: newId || null,
        updatedAt: serverTimestamp()
      };

      // Remove undefined values to prevent Firestore errors
      const cleanTalentData = Object.fromEntries(
        Object.entries(finalTalentData).filter(([_, v]) => v !== undefined)
      );

      // Save talent definition if name is provided
      if (finalName && finalName !== '未命名天赋') {
        if (!finalTalentId) {
          // Create new talent
          const newTalentRef = doc(collection(db, 'talent_definitions'));
          finalTalentId = newTalentRef.id;
          await setDoc(newTalentRef, cleanTalentData);
        } else {
          // Update existing talent - use updateDoc to ensure we only change provided fields
          // This also ensures arrays and maps are replaced correctly if provided
          await updateDoc(doc(db, 'talent_definitions', finalTalentId), cleanTalentData);
        }
      }

      // Update treeNodes if a node is selected
      if (oldId) {
        const updatedNodes = treeNodes.map(n => {
          if (n.id === oldId) {
            return {
              ...n,
              id: newId,
              maxLevel: editForm.maxLevel ?? 3,
              connections: editForm.connections ? editForm.connections.split(',').map(s => s.trim()).filter(Boolean) : [],
              x: editForm.x ?? n.x,
              y: editForm.y ?? n.y,
              talentId: finalTalentId || n.talentId
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

        if (oldId !== newId) {
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
      }

      setIsEditing(false);
      showStatus("保存成功");
    } catch (error: any) {
      console.error("Error saving talent:", error);
      showStatus("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNodeOnly = async () => {
    if (!selectedNodeId) return;
    setSaving(true);
    try {
      const oldId = selectedNodeId;
      const newId = editForm.newId || oldId;
      
      const updatedNodes = treeNodes.map(n => {
        if (n.id === oldId) {
          return {
            ...n,
            id: newId,
            maxLevel: editForm.maxLevel ?? 3,
            connections: editForm.connections ? editForm.connections.split(',').map(s => s.trim()).filter(Boolean) : [],
            x: editForm.x ?? n.x,
            y: editForm.y ?? n.y,
          };
        }
        if (oldId !== newId && n.connections.includes(oldId)) {
          return {
            ...n,
            connections: n.connections.map(c => c === oldId ? newId : c)
          };
        }
        return n;
      });

      await setDoc(doc(db, 'talent_tree_layout', role), { nodes: updatedNodes });

      // Update any talent definitions that point to the old ID
      if (oldId !== newId) {
        const talentsToUpdate = talents.filter(t => t.nodeId === oldId && t.role === role);
        await Promise.all(talentsToUpdate.map(t => 
          updateDoc(doc(db, 'talent_definitions', t.id), { nodeId: newId })
        ));
        
        setSelectedNodeId(newId);
        if (allocatedPoints[oldId]) {
          setAllocatedPoints(prev => {
            const next = { ...prev };
            next[newId] = Math.min(next[oldId], editForm.maxLevel ?? 3);
            delete next[oldId];
            return next;
          });
        }
      } else {
        if (allocatedPoints[oldId] > (editForm.maxLevel ?? 3)) {
          setAllocatedPoints(prev => ({
            ...prev,
            [oldId]: editForm.maxLevel ?? 3
          }));
        }
      }

      showStatus("节点配置已保存");
    } catch (error) {
      console.error("Error saving node config:", error);
      showStatus("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncLayout = async () => {
    if (role !== 'Hunter') return;
    setSaving(true);
    try {
      const survivorDoc = await getDoc(doc(db, 'talent_tree_layout', 'Survivor'));
      if (!survivorDoc.exists()) {
        showStatus("未找到求生者布局数据", "error");
        return;
      }
      
      const survivorNodes = survivorDoc.data().nodes as (TalentNode & { x: number; y: number })[];
      
      const hunterDoc = await getDoc(doc(db, 'talent_tree_layout', 'Hunter'));
      const hunterNodes = hunterDoc.exists() ? hunterDoc.data().nodes as (TalentNode & { x: number; y: number })[] : [];
      
      const syncedNodes = survivorNodes.map(sNode => {
        const hNode = hunterNodes.find(n => n.id === sNode.id);
        return {
          ...sNode,
          talentId: hNode?.talentId || null
        };
      });
      
      await setDoc(doc(db, 'talent_tree_layout', 'Hunter'), { nodes: syncedNodes });
      showStatus("同步成功");
    } catch (error) {
      console.error("Error syncing layout:", error);
      showStatus("同步失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNodeId && !editForm.selectedTalentId) return;
    setSaving(true);
    try {
      let deletedTalentId = editForm.selectedTalentId;
      
      if (selectedNodeId) {
        const node = treeNodes.find(n => n.id === selectedNodeId);
        const existingTalent = talents.find(t => t.id === node?.talentId) || talents.find(t => t.role === role && t.nodeId === selectedNodeId);
        
        if (existingTalent) {
          deletedTalentId = existingTalent.id;
          await deleteDoc(doc(db, 'talent_definitions', existingTalent.id));
        } else {
          const docId = `${role.toLowerCase()}_${selectedNodeId}`;
          await deleteDoc(doc(db, 'talent_definitions', docId));
        }
      } else if (deletedTalentId) {
        await deleteDoc(doc(db, 'talent_definitions', deletedTalentId));
      }
      
      // Update all treeNodes that were using this talentId (or if it was the selected node)
      const updatedNodes = treeNodes.map(n => {
        if (n.id === selectedNodeId || (deletedTalentId && n.talentId === deletedTalentId)) {
          const { talentId, ...rest } = n;
          return rest;
        }
        return n;
      });
      await setDoc(doc(db, 'talent_tree_layout', role), { nodes: updatedNodes });
      
      setEditForm({
        role,
        nodeId: selectedNodeId || '',
        name: '',
        description: '',
        targetStats: [],
        modifier: '',
        effect: '',
        selectedTalentId: ''
      });
      setIsEditing(false);
      showStatus("删除成功");
    } catch (error) {
      console.error("Error deleting talent:", error);
      showStatus("删除失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTalentIds.length === 0) return;
    
    setSaving(true);
    try {
      // Delete all selected talent definitions
      await Promise.all(selectedTalentIds.map(id => deleteDoc(doc(db, 'talent_definitions', id))));
      
      // Update treeNodes to remove references to deleted talents
      const updatedNodes = treeNodes.map(n => {
        if (n.talentId && selectedTalentIds.includes(n.talentId)) {
          const { talentId, ...rest } = n;
          return rest;
        }
        return n;
      });
      await setDoc(doc(db, 'talent_tree_layout', role), { nodes: updatedNodes });
      
      setSelectedTalentIds([]);
      // Reset edit form if the currently edited talent was deleted
      if (editForm.selectedTalentId && selectedTalentIds.includes(editForm.selectedTalentId)) {
        setEditForm({
          role,
          nodeId: selectedNodeId || '',
          name: '',
          description: '',
          targetStats: [],
          modifier: '',
          effect: '',
          selectedTalentId: ''
        });
        setIsEditing(false);
      }
      showStatus(`已删除 ${selectedTalentIds.length} 个天赋`);
    } catch (error) {
      console.error("Error bulk deleting talents:", error);
      showStatus("批量删除失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkTag = async () => {
    if (selectedTalentIds.length === 0 || !bulkTagInput.trim()) return;
    
    setSaving(true);
    try {
      const newTag = bulkTagInput.trim();
      const batch = [];
      
      for (const talentId of selectedTalentIds) {
        const talent = talents.find(t => t.id === talentId);
        if (talent) {
          const currentTags = talent.tags || [];
          if (!currentTags.includes(newTag)) {
            const newTags = [...currentTags, newTag];
            const newTagColors = { ...(talent.tagColors || {}) };
            if (bulkTagColor) {
              newTagColors[newTag] = bulkTagColor;
            }
            
            batch.push(updateDoc(doc(db, 'talent_definitions', talentId), {
              tags: newTags,
              tagColors: newTagColors,
              updatedAt: serverTimestamp()
            }));
          }
        }
      }
      
      if (batch.length > 0) {
        await Promise.all(batch);
        showStatus(`已为 ${batch.length} 个天赋添加标签 "${newTag}"`);
      } else {
        showStatus("所选天赋已包含该标签");
      }
      
      setBulkTagInput('');
      setSelectedTalentIds([]);
    } catch (error) {
      console.error("Error bulk tagging talents:", error);
      showStatus("批量添加标签失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!oldTag || !newTag || oldTag === newTag) return;
    setSaving(true);
    try {
      const batch = [];
      const talentsWithTag = talents.filter(t => t.tags?.includes(oldTag));
      
      for (const talent of talentsWithTag) {
        const newTags = talent.tags?.map(t => t === oldTag ? newTag : t) || [];
        const newTagColors = { ...(talent.tagColors || {}) };
        if (newTagColors[oldTag]) {
          newTagColors[newTag] = newTagColors[oldTag];
          delete newTagColors[oldTag];
        }
        
        batch.push(updateDoc(doc(db, 'talent_definitions', talent.id), {
          tags: newTags,
          tagColors: newTagColors,
          updatedAt: serverTimestamp()
        }));
      }
      
      if (batch.length > 0) {
        await Promise.all(batch);
        showStatus(`已将标签 "${oldTag}" 重命名为 "${newTag}" (${batch.length} 个天赋)`);
      }
    } catch (error) {
      console.error("Error renaming tag:", error);
      showStatus("重命名标签失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTagGlobal = async (tagToDelete: string) => {
    if (!tagToDelete) return;
    setSaving(true);
    try {
      const batch = [];
      const talentsWithTag = talents.filter(t => t.tags?.includes(tagToDelete));
      
      for (const talent of talentsWithTag) {
        const newTags = talent.tags?.filter(t => t !== tagToDelete) || [];
        const newTagColors = { ...(talent.tagColors || {}) };
        delete newTagColors[tagToDelete];
        
        batch.push(updateDoc(doc(db, 'talent_definitions', talent.id), {
          tags: newTags,
          tagColors: newTagColors,
          updatedAt: serverTimestamp()
        }));
      }
      
      if (batch.length > 0) {
        await Promise.all(batch);
        showStatus(`已删除标签 "${tagToDelete}" (${batch.length} 个天赋)`);
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      showStatus("删除标签失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetTree = async () => {
    setSaving(true);
    try {
      // 1. Clear all talent definitions for the current role
      const roleTalents = talents.filter(t => t.role === role);
      await Promise.all(roleTalents.map(t => deleteDoc(doc(db, 'talent_definitions', t.id))));

      // 2. Reset the tree layout to DEFAULT_NODES (which now has new IDs)
      await setDoc(doc(db, 'talent_tree_layout', role), { nodes: DEFAULT_NODES });
      
      // 3. Reset local state
      setSelectedNodeId(null);
      setEditForm({
        role,
        nodeId: '',
        name: '',
        description: '',
        targetStats: [],
        modifier: '',
        effect: '',
        selectedTalentId: ''
      });
      setIsEditing(false);
      showStatus("重置成功");
    } catch (error) {
      console.error("Error resetting tree:", error);
      showStatus("重置失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedTalent = talents.find(t => t.id === (selectedNode?.talentId || editForm.selectedTalentId)) || 
                        (selectedNodeId ? talents.find(t => t.role === role && t.nodeId === selectedNodeId) : undefined);
  const linkedWikiEntry = wikiEntries.find(e => e.talentId === selectedTalent?.id || (selectedNodeId && e.talentId === selectedNodeId));

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[800px] animate-in fade-in duration-500">
      {/* Left: Web Visualization */}
      <div className="flex-1 bg-card/30 border border-border p-6 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 z-10">
          <div className="flex items-center gap-4">
            {/* Role Selection */}
            <div className="flex bg-bg border border-border p-1 rounded-sm">
              <button
                onClick={() => { setRole('Survivor'); setSelectedNodeId(null); }}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${role === 'Survivor' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                <ShieldCheck className="w-3 h-3" /> 求生者
              </button>
              <button
                onClick={() => { setRole('Hunter'); setSelectedNodeId(null); }}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${role === 'Hunter' ? 'bg-primary text-white font-bold' : 'text-muted hover:text-primary'}`}
              >
                <Swords className="w-3 h-3" /> 监管者
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-bg border border-border p-1 rounded-sm">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                树状图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                列表
              </button>
              <button
                onClick={() => setViewMode('tags')}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'tags' ? 'bg-accent text-bg font-bold' : 'text-muted hover:text-accent'}`}
              >
                标签管理
              </button>
            </div>

            {/* Points Display */}
            <div className="flex items-center gap-2 bg-bg/80 border border-border px-3 py-1.5 rounded-sm">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">POINTS:</span>
              <span className={`text-xs font-mono font-bold ${totalPointsUsed >= MAX_TOTAL_POINTS ? 'text-primary' : 'text-accent'}`}>
                {totalPointsUsed} / {MAX_TOTAL_POINTS}
              </span>
            </div>

            {/* Edit Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                className="px-4 py-1.5 bg-bg border border-border text-muted hover:text-accent font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 rounded-sm"
              >
                <Edit3 className="w-3 h-3" /> 编辑 <ChevronDown className={`w-3 h-3 transition-transform ${showEditDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showEditDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-card border border-border shadow-xl z-50 py-1"
                  >
                    <button 
                      onClick={() => { setAllocatedPoints({}); setShowEditDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-[10px] font-mono text-muted hover:text-primary hover:bg-accent/5 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> 重置加点
                    </button>
                    {user && (
                      <button 
                        onClick={() => { setShowSaveModal(true); setShowEditDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-[10px] font-mono text-muted hover:text-accent hover:bg-accent/5 uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <Save className="w-3 h-3" /> 保存方案
                      </button>
                    )}
                    {isAdminUser && (
                      <>
                        <div className="h-px bg-border my-1" />
                        <button 
                          onClick={() => { handleResetTree(); setShowEditDropdown(false); }}
                          disabled={saving}
                          className="w-full text-left px-4 py-2 text-[10px] font-mono text-muted hover:text-red-500 hover:bg-accent/5 uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> 重置天赋树
                        </button>
                        {role === 'Hunter' && (
                          <button 
                            onClick={() => { handleSyncLayout(); setShowEditDropdown(false); }}
                            disabled={saving}
                            className="w-full text-left px-4 py-2 text-[10px] font-mono text-muted hover:text-accent hover:bg-accent/5 uppercase tracking-widest transition-colors flex items-center gap-2"
                          >
                            <Network className="w-3 h-3" /> 同步布局
                          </button>
                        )}
                        <button 
                          onClick={() => { setShowBulkImport(true); setShowEditDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-[10px] font-mono text-muted hover:text-accent hover:bg-accent/5 uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                          <FileJson className="w-3 h-3" /> 批量导入
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索... SEARCH"
                className="bg-bg border border-border pl-9 pr-4 py-1.5 text-[10px] font-mono focus:border-accent outline-none w-32 transition-all focus:w-48"
              />
            </div>

            {selectedNodeId && (
              <button
                onClick={() => { setSelectedNodeId(null); setZoom(1); }}
                className="px-3 py-1.5 bg-bg border border-border text-muted hover:text-accent font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
              >
                重置视图
              </button>
            )}
            
            <div className="flex bg-bg border border-border p-1 rounded-sm">
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                className="px-2 py-1 text-[10px] font-mono text-muted hover:text-accent"
              >
                +
              </button>
              <div className="px-2 py-1 text-[10px] font-mono text-muted border-x border-border">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                className="px-2 py-1 text-[10px] font-mono text-muted hover:text-accent"
              >
                -
              </button>
            </div>
          </div>
        </div>

        <div className={`flex-1 relative flex items-start justify-center overflow-hidden bg-bg/30 rounded-lg border border-border/50 custom-scrollbar ${viewMode !== 'tree' ? 'min-h-[850px]' : 'min-h-[750px]'}`}>
          {viewMode !== 'tree' ? (
            <ListView />
          ) : (
            <motion.svg 
              ref={svgRef}
              className="w-full h-full"
              animate={{ viewBox }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              preserveAspectRatio="xMidYMin meet"
            >
              {/* Draw Connections */}
              <g>
                {nodes.map(node => {
                  const uniqueConnections = Array.from(new Set(node.connections));
                  return uniqueConnections.map(targetId => {
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
                  const isCenter = node.id === '23';
                  const isSelected = selectedNodeId === node.id;
                  const colors = getNodeColors(node);

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${pos.cx}, ${pos.cy})`}
                      style={{ opacity: colors.opacity }}
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
                                {isSelected && (
                                  <circle
                                    r={isCenter ? 35 : 25}
                                    fill="none"
                                    stroke={baseColor}
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                  />
                                )}

                                <circle
                                  r={isCenter ? 25 : 18}
                                  fill={colors.fill}
                                  stroke={colors.stroke}
                                  strokeWidth={colors.strokeWidth}
                                  className="transition-all duration-300"
                                />

                                {/* Level Indicator */}
                                {!isCenter && (allocatedPoints[node.id] || 0) > 0 && (
                                  <text
                                    y="5"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill="#fff"
                                    className="pointer-events-none font-mono"
                                  >
                                    {allocatedPoints[node.id]}
                                  </text>
                                )}
                                
                                {/* Data Indicator */}
                                {talents.some(t => t.id === node.talentId || (t.role === role && t.nodeId === node.id)) && !isCenter && (
                                  <circle 
                                    r="3" 
                                    fill={baseColor} 
                                    cy="-25"
                                  />
                                )}
                              </motion.g>
                            </g>
                          );
                        })}
                      </g>
            </motion.svg>
          )}
        </div>
      </div>

      {/* Right: Sidebar or Modal */}
      <AnimatePresence>
        {viewMode !== 'list' ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full md:w-96 bg-card/30 border border-border p-6 flex flex-col"
          >
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <h3 className="text-sm font-bold text-text font-mono flex items-center gap-2 uppercase tracking-widest">
                <Info className="w-4 h-4" /> 天赋详情_DETAILS
              </h3>
            </div>

            {!selectedNodeId && !editForm.selectedTalentId ? (
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
            ) : renderDetailsContent()}
          </motion.div>
        ) : (
          <AnimatePresence>
            {(selectedNodeId || editForm.selectedTalentId) && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-2xl max-h-[90vh] bg-card border border-border overflow-y-auto custom-scrollbar p-8 relative"
                >
                  <button 
                    onClick={() => { setSelectedNodeId(null); setEditForm(prev => ({ ...prev, selectedTalentId: undefined })); }}
                    className="absolute top-4 right-4 text-muted hover:text-accent transition-colors z-20"
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                    <h3 className="text-sm font-bold text-text font-mono flex items-center gap-2 uppercase tracking-widest">
                      <Info className="w-4 h-4" /> 天赋详情_DETAILS
                    </h3>
                  </div>

                  {renderDetailsContent()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        )}
      </AnimatePresence>

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
      
      {/* Stat Selector Modal */}
      <AnimatePresence>
        {showStatSelector && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-bg/50">
                <div className="flex flex-col">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-accent flex items-center gap-2">
                    <Wand2 size={14} /> 选择目标属性_SELECT_TARGET_STATS
                  </h3>
                  <p className="text-[9px] text-muted font-mono uppercase mt-1">选择受此天赋影响的属性详情</p>
                </div>
                <button onClick={() => setShowStatSelector(false)} className="text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                {/* Survivor Traits */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-primary/20" />
                    <h4 className="text-[10px] text-primary uppercase font-mono tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} /> 求生者特质 SURVIVOR_TRAITS
                    </h4>
                    <div className="h-px flex-1 bg-primary/20" />
                  </div>
                  <div className="space-y-6">
                    {SURVIVOR_TRAITS_MODERN_TEMPLATE.map(category => (
                      <div key={category.category}>
                        <h5 className="text-[9px] text-muted font-mono uppercase mb-2 tracking-tighter opacity-70">{category.category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {category.items.map(item => (
                            <button
                              key={item.label}
                              onClick={() => toggleStat(item.label)}
                              className={`text-[10px] font-mono p-2 border text-left transition-all relative group ${
                                editForm.targetStats?.includes(item.label)
                                  ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(255,0,60,0.2)]'
                                  : 'bg-bg/50 border-border text-muted hover:border-primary/50 hover:text-primary'
                              }`}
                            >
                              {item.label}
                              {editForm.targetStats?.includes(item.label) && (
                                <div className="absolute top-1 right-1">
                                  <ShieldCheck size={8} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hunter Traits */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-accent/20" />
                    <h4 className="text-[10px] text-accent uppercase font-mono tracking-widest flex items-center gap-2">
                      <Swords size={12} /> 监管者特质 HUNTER_TRAITS
                    </h4>
                    <div className="h-px flex-1 bg-accent/20" />
                  </div>
                  <div className="space-y-6">
                    {HUNTER_TRAITS_TEMPLATE.map(category => (
                      <div key={category.category}>
                        <h5 className="text-[9px] text-muted font-mono uppercase mb-2 tracking-tighter opacity-70">{category.category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {category.items.map(item => (
                            <button
                              key={item.label}
                              onClick={() => toggleStat(item.label)}
                              className={`text-[10px] font-mono p-2 border text-left transition-all relative group ${
                                editForm.targetStats?.includes(item.label)
                                  ? 'bg-accent border-accent text-bg shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                                  : 'bg-bg/50 border-border text-muted hover:border-accent/50 hover:text-accent'
                              }`}
                            >
                              {item.label}
                              {editForm.targetStats?.includes(item.label) && (
                                <div className="absolute top-1 right-1">
                                  <Swords size={8} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-border bg-bg/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-muted uppercase tracking-widest">
                    已选择: <span className="text-accent">{editForm.targetStats?.length || 0}</span>
                  </div>
                  {editForm.targetStats && editForm.targetStats.length > 0 && (
                    <button 
                      onClick={() => setEditForm({...editForm, targetStats: []})}
                      className="text-[9px] font-mono text-red-500 hover:underline uppercase"
                    >
                      清空_CLEAR
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowStatSelector(false)}
                  className="px-8 py-2 bg-accent text-bg text-[10px] font-mono uppercase tracking-widest hover:bg-white transition-all font-bold"
                >
                  确认_CONFIRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Message Overlay */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-[200] flex items-center gap-3 border ${
              statusMessage.type === 'success' 
                ? 'bg-bg/90 border-accent text-accent' 
                : 'bg-bg/90 border-destructive text-destructive'
            }`}
          >
            {statusMessage.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-wide uppercase">{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
