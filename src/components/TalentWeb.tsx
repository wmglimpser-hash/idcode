import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Save, Trash2, Plus, Info, ShieldCheck, Swords, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface TalentNode {
  id: string;
  x: number;
  y: number;
  maxLevel: number;
  connections: string[];
  defaultName?: string;
}

const SURVIVOR_TALENT_NODES: TalentNode[] = [
  { id: 'center', x: 0, y: 0, maxLevel: 0, connections: ['1', '2', '3', '4'], defaultName: '中心' },
  
  // Left Branch (1) - West axis
  { id: '1', x: -1, y: 0, maxLevel: 1, connections: ['1.1', '1.2', '1.3'], defaultName: '火中取栗' },
  { id: '1.1', x: -2, y: 0, maxLevel: 3, connections: ['1.1.1'], defaultName: '马蝇效应' },
  { id: '1.1.1', x: -3, y: 0, maxLevel: 3, connections: ['1.1.1.1'], defaultName: '肌肉记忆' },
  { id: '1.1.1.1', x: -4, y: 0, maxLevel: 1, connections: [], defaultName: '膝跳反射' },
  // West-North diagonal
  { id: '1.2', x: -2, y: -1, maxLevel: 1, connections: ['1.2.1'], defaultName: '绝处逢生' },
  { id: '1.2.1', x: -3, y: -2, maxLevel: 1, connections: [], defaultName: '感觉适应' },
  // West-South diagonal
  { id: '1.3', x: -2, y: 1, maxLevel: 3, connections: ['1.3.1'], defaultName: '囚徒困境' },
  { id: '1.3.1', x: -3, y: 2, maxLevel: 3, connections: [], defaultName: '求生意志' },

  // Up Branch (2) - North axis
  { id: '2', x: 0, y: -1, maxLevel: 1, connections: ['2.1', '2.2', '2.3'], defaultName: '关系场' },
  { id: '2.1', x: 0, y: -2, maxLevel: 3, connections: ['2.1.1'], defaultName: '祸福相依' },
  { id: '2.1.1', x: 0, y: -3, maxLevel: 3, connections: ['2.1.1.1'], defaultName: '韦伯定律' },
  { id: '2.1.1.1', x: 0, y: -4, maxLevel: 1, connections: [], defaultName: '飞轮效应' },
  // North-West diagonal
  { id: '2.2', x: -1, y: -2, maxLevel: 3, connections: ['2.2.1'], defaultName: '幸存者本能' },
  { id: '2.2.1', x: -2, y: -3, maxLevel: 3, connections: [], defaultName: '防御机制' },
  // North-East diagonal
  { id: '2.3', x: 1, y: -2, maxLevel: 1, connections: ['2.3.1'], defaultName: '相濡以沫' },
  { id: '2.3.1', x: 2, y: -3, maxLevel: 1, connections: [], defaultName: '共生效应' },

  // Right Branch (3) - East axis
  { id: '3', x: 1, y: 0, maxLevel: 1, connections: ['3.1', '3.2', '3.3'], defaultName: '好奇心' },
  { id: '3.1', x: 2, y: 0, maxLevel: 3, connections: ['3.1.1'], defaultName: '不屈不挠' },
  { id: '3.1.1', x: 3, y: 0, maxLevel: 3, connections: ['3.1.1.1'], defaultName: '逃逸' },
  { id: '3.1.1.1', x: 4, y: 0, maxLevel: 1, connections: [], defaultName: '回光返照' },
  // East-North diagonal
  { id: '3.2', x: 2, y: -1, maxLevel: 1, connections: ['3.2.1'], defaultName: '分心' },
  { id: '3.2.1', x: 3, y: -2, maxLevel: 1, connections: [], defaultName: '假寐' },
  // East-South diagonal
  { id: '3.3', x: 2, y: 1, maxLevel: 3, connections: ['3.3.1'], defaultName: '心灵感应' },
  { id: '3.3.1', x: 3, y: 2, maxLevel: 3, connections: [], defaultName: '结伴效应' },

  // Down Branch (4) - South axis
  { id: '4', x: 0, y: 1, maxLevel: 1, connections: ['4.1', '4.2', '4.3'], defaultName: '鸟笼效应' },
  { id: '4.1', x: 0, y: 2, maxLevel: 3, connections: ['4.1.1'], defaultName: '救世主情节' },
  { id: '4.1.1', x: 0, y: 3, maxLevel: 3, connections: ['4.1.1.1'], defaultName: '从众心理' },
  { id: '4.1.1.1', x: 0, y: 4, maxLevel: 1, connections: [], defaultName: '化险为夷' },
  // South-West diagonal
  { id: '4.2', x: -1, y: 2, maxLevel: 1, connections: ['4.2.1'], defaultName: '悄无声息' },
  { id: '4.2.1', x: -2, y: 3, maxLevel: 1, connections: [], defaultName: '医者' },
  // South-East diagonal
  { id: '4.3', x: 1, y: 2, maxLevel: 1, connections: ['4.3.1'], defaultName: '宣泄效应' },
  { id: '4.3.1', x: 2, y: 3, maxLevel: 3, connections: [], defaultName: '共情' },
];

const HUNTER_TALENT_NODES: TalentNode[] = [
  { id: 'center', x: 0, y: 0, maxLevel: 0, connections: ['1', '2', '3', '4'], defaultName: '中心' },
  
  // Left Branch (1) - West axis
  { id: '1', x: -1, y: 0, maxLevel: 1, connections: ['1.1', '1.2', '1.3'], defaultName: '狩猎本能' },
  { id: '1.1', x: -2, y: 0, maxLevel: 3, connections: ['1.1.1'], defaultName: '恐慌' },
  { id: '1.1.1', x: -3, y: 0, maxLevel: 3, connections: ['1.1.1.1'], defaultName: '狂暴' },
  { id: '1.1.1.1', x: -4, y: 0, maxLevel: 1, connections: [], defaultName: '张狂' },
  // West-North diagonal
  { id: '1.2', x: -2, y: -1, maxLevel: 1, connections: ['1.2.1'], defaultName: '恶化' },
  { id: '1.2.1', x: -3, y: -2, maxLevel: 1, connections: [], defaultName: '厄运震慑' },
  // West-South diagonal
  { id: '1.3', x: -2, y: 1, maxLevel: 3, connections: ['1.3.1'], defaultName: '约束' },
  { id: '1.3.1', x: -3, y: 2, maxLevel: 3, connections: [], defaultName: '报复' },

  // Up Branch (2) - North axis
  { id: '2', x: 0, y: -1, maxLevel: 1, connections: ['2.1', '2.2', '2.3'], defaultName: '惯性' },
  { id: '2.1', x: 0, y: -2, maxLevel: 3, connections: ['2.1.1'], defaultName: '嘲弄' },
  { id: '2.1.1', x: 0, y: -3, maxLevel: 3, connections: ['2.1.1.1'], defaultName: '狂欢' },
  { id: '2.1.1.1', x: 0, y: -4, maxLevel: 1, connections: [], defaultName: '封窗' },
  // North-West diagonal
  { id: '2.2', x: -1, y: -2, maxLevel: 3, connections: ['2.2.1'], defaultName: '破坏欲' },
  { id: '2.2.1', x: -2, y: -3, maxLevel: 3, connections: [], defaultName: '厄运' },
  // North-East diagonal
  { id: '2.3', x: 1, y: -2, maxLevel: 1, connections: ['2.3.1'], defaultName: '通缉' },
  { id: '2.3.1', x: 2, y: -3, maxLevel: 1, connections: [], defaultName: '追猎' },

  // Right Branch (3) - East axis
  { id: '3', x: 1, y: 0, maxLevel: 1, connections: ['3.1', '3.2', '3.3'], defaultName: '夜枭' },
  { id: '3.1', x: 2, y: 0, maxLevel: 3, connections: ['3.1.1'], defaultName: '报幕' },
  { id: '3.1.1', x: 3, y: 0, maxLevel: 3, connections: ['3.1.1.1'], defaultName: '挽留' },
  { id: '3.1.1.1', x: 4, y: 0, maxLevel: 1, connections: [], defaultName: '一刀斩' },
  // East-North diagonal
  { id: '3.2', x: 2, y: -1, maxLevel: 1, connections: ['3.2.1'], defaultName: '清道夫' },
  { id: '3.2.1', x: 3, y: -2, maxLevel: 1, connections: [], defaultName: '细心' },
  // East-South diagonal
  { id: '3.3', x: 2, y: 1, maxLevel: 3, connections: ['3.3.1'], defaultName: '耳鸣' },
  { id: '3.3.1', x: 3, y: 2, maxLevel: 3, connections: [], defaultName: '恋物癖' },

  // Down Branch (4) - South axis
  { id: '4', x: 0, y: 1, maxLevel: 1, connections: ['4.1', '4.2', '4.3'], defaultName: '后遗症' },
  { id: '4.1', x: 0, y: 2, maxLevel: 3, connections: ['4.1.1'], defaultName: '张狂' },
  { id: '4.1.1', x: 0, y: 3, maxLevel: 3, connections: ['4.1.1.1'], defaultName: '底牌' },
  { id: '4.1.1.1', x: 0, y: 4, maxLevel: 1, connections: [], defaultName: '幽闭' },
  // South-West diagonal
  { id: '4.2', x: -1, y: 2, maxLevel: 1, connections: ['4.2.1'], defaultName: '枯萎' },
  { id: '4.2.1', x: -2, y: 3, maxLevel: 1, connections: [], defaultName: '无名之辈' },
  // South-East diagonal
  { id: '4.3', x: 1, y: 2, maxLevel: 1, connections: ['4.3.1'], defaultName: '巨钳' },
  { id: '4.3.1', x: 2, y: 3, maxLevel: 3, connections: [], defaultName: '好客之道' },
];

const SPACING = 100;
const CENTER_X = 500;
const CENTER_Y = 500;

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface TalentWebProps {
  user: FirebaseUser | null;
  userProfile: any;
}

export const TalentWeb = ({ user, userProfile }: TalentWebProps) => {
  const [role, setRole] = useState<'Survivor' | 'Hunter'>('Survivor');
  const [talents, setTalents] = useState<TalentDefinition[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TalentDefinition>>({});
  const [saving, setSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const isAdminUser = user?.email === 'wmglimpser@gmail.com' || userProfile?.role === 'admin';
  const isContributor = userProfile?.role === 'contributor' || isAdminUser;

  const nodes = role === 'Survivor' ? SURVIVOR_TALENT_NODES : HUNTER_TALENT_NODES;

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

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === 'center') return;
    setSelectedNodeId(nodeId);
    const existingTalent = talents.find(t => t.role === role && t.nodeId === nodeId);
    if (existingTalent) {
      setEditForm(existingTalent);
    } else {
      setEditForm({
        role,
        nodeId,
        name: '',
        description: '',
        targetStat: '',
        modifier: '',
        effect: ''
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedNodeId || !editForm.name) return;
    setSaving(true);
    try {
      const docId = `${role.toLowerCase()}_${selectedNodeId}`;
      await setDoc(doc(db, 'talent_definitions', docId), {
        ...editForm,
        role,
        nodeId: selectedNodeId,
        updatedAt: serverTimestamp()
      });
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

  const getNodePos = (x: number, y: number) => ({
    cx: CENTER_X + x * SPACING,
    cy: CENTER_Y + y * SPACING
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedTalent = talents.find(t => t.role === role && t.nodeId === selectedNodeId);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[800px] animate-in fade-in duration-500">
      {/* Left: Web Visualization */}
      <div className="flex-1 bg-card/30 border border-border cyber-border p-6 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 z-10">
          <h2 className="text-xl font-serif text-accent cyber-glow-text flex items-center gap-2">
            <Network className="w-5 h-5" /> 天赋系统_TALENT_WEB
          </h2>
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

        <div className="flex-1 relative flex items-center justify-center overflow-auto min-h-[600px] bg-bg/50 rounded-lg border border-border/50">
          <svg 
            ref={svgRef}
            width="1000" 
            height="1000" 
            viewBox="0 0 1000 1000"
            className="max-w-full h-auto drop-shadow-[0_0_15px_rgba(0,243,255,0.1)]"
          >
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={role === 'Survivor' ? '#00f3ff' : '#ff003c'} stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <filter id="blur">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Draw Connections */}
            {nodes.map(node => {
              const pos1 = getNodePos(node.x, node.y);
              return node.connections.map(targetId => {
                const targetNode = nodes.find(n => n.id === targetId);
                if (!targetNode) return null;
                const pos2 = getNodePos(targetNode.x, targetNode.y);
                return (
                  <line 
                    key={`${node.id}-${targetId}`}
                    x1={pos1.cx} 
                    y1={pos1.cy} 
                    x2={pos2.cx} 
                    y2={pos2.cy} 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="2"
                  />
                );
              });
            })}

            {/* Draw Nodes */}
            {nodes.map(node => {
              const pos = getNodePos(node.x, node.y);
              const isCenter = node.id === 'center';
              const isSelected = selectedNodeId === node.id;
              const hasData = talents.some(t => t.role === role && t.nodeId === node.id);
              
              const baseColor = role === 'Survivor' ? '#00f3ff' : '#ff003c';
              const fillColor = isCenter ? baseColor : (hasData ? `${baseColor}40` : '#1a1a1a');
              const strokeColor = isSelected ? '#ffffff' : (hasData ? baseColor : '#333333');

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${pos.cx}, ${pos.cy})`}
                >
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={isCenter ? {} : { scale: 1.15, filter: 'brightness(1.4)' }}
                    transition={{ duration: 0.3, delay: (Math.abs(node.x) + Math.abs(node.y)) * 0.05 }}
                    onClick={() => handleNodeClick(node.id)}
                    className={isCenter ? '' : 'cursor-pointer'}
                  >
                    {/* Selected Pulse Effect */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.circle
                          r={isCenter ? 40 : 30}
                          fill="none"
                          stroke={baseColor}
                          strokeWidth="2"
                          initial={{ scale: 0.8, opacity: 0.8 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </AnimatePresence>

                    {isCenter && (
                      <circle r="40" fill="url(#glow)" />
                    )}
                    
                    <circle 
                      r={isCenter ? 25 : 18} 
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 4 : 2}
                      className="transition-all duration-300"
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 8px ${baseColor})` : 'none'
                      }}
                    />
                    
                    {hasData && !isCenter && (
                      <motion.circle 
                        r="4" 
                        fill={baseColor} 
                        cy="-25"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right: Sidebar */}
      <div className="w-full md:w-96 bg-card/30 border border-border cyber-border p-6 flex flex-col">
        <h3 className="text-sm font-bold text-text font-mono mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-border pb-4">
          <Info className="w-4 h-4" /> 天赋详情_DETAILS
        </h3>

        {!selectedNodeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted opacity-50">
            <Network className="w-12 h-12 mb-4" />
            <p className="text-sm font-mono uppercase tracking-widest">请在左侧选择一个天赋节点</p>
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
                        value={editForm.targetStat || ''}
                        onChange={e => setEditForm({...editForm, targetStat: e.target.value})}
                        className="w-full bg-bg border border-border px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                        placeholder="例如：移动速度"
                      />
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
                    disabled={saving || !editForm.name}
                    className="flex-1 bg-accent text-bg px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent/80 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" /> 保存
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
      </div>
    </div>
  );
};
