/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const COLORS = {
  bg: '#050505',
  card: '#0d0d0d',
  primary: '#ff003c',
  accent: '#00f3ff',
  gold: '#d4af37',
  text: '#e0e0e0',
  textMuted: '#666666',
  border: '#1a1a1a',
};

export interface CharacterTraitItem {
  label: string;
  value: string;
  rating?: number;
}

export interface CharacterTraitCategory {
  category: string;
  items: CharacterTraitItem[];
}

export interface Character {
  id: string;
  name: string;
  title: string;
  role: 'Survivor' | 'Hunter';
  type: string;
  description: string;
  skills: { name: string; description: string; icon?: string; tags?: string[] }[];
  presence?: { tier: number; name: string; description: string; cooldown?: string; tags?: string[] }[];
  imageUrl: string;
  order?: number;
  remark?: string;
  traits?: CharacterTraitCategory[];
  mechanics?: { title: string; content: string; icon?: string }[];
  linkedMechanics?: { characterId: string; mechanicIndex: number }[];
  lastUpdated?: any;
}

export interface TalentDefinition {
  id?: string;
  role: 'Survivor' | 'Hunter';
  nodeId: string;
  name: string;
  description: string;
  targetStat?: string;
  modifier?: string;
  effect?: string;
  x?: number;
  y?: number;
  tags?: string[];
  updatedAt?: any;
}

export interface TraitFactor {
  id: string;
  characterId: string;
  category: string;
  name: string;
  effect: string;
  source: string;
  sourceType?: 'external_trait' | 'talent' | 'auxiliary_trait' | 'other';
  type: 'positive' | 'negative' | 'neutral';
  targetStat?: string;
  modifier?: string;
  updatedAt?: any;
}

export const SURVIVOR_TRAITS_TEMPLATE: CharacterTraitCategory[] = [
  {
    category: '移动 MOVEMENT',
    items: [
      { label: '跑动速度', value: '3.8米/秒' },
      { label: '走路速度', value: '2.11米/秒' },
      { label: '蹲走速度', value: '1.14米/秒' },
      { label: '爬行速度', value: '0.44米/秒' }
    ]
  },
  {
    category: '破译 DECODING',
    items: [
      { label: '密码机破译时长', value: '81秒' },
      { label: '破译完美判定额外增长进度', value: '1.00%' },
      { label: '破译触电回退进度', value: '1.00%' },
      { label: '破译触电无法破译时长', value: '2.0秒' },
      { label: '大门开启时长', value: '18.0秒' }
    ]
  },
  {
    category: '交互 INTERACTION',
    items: [
      { label: '放板时间', value: '0.73秒' },
      { label: '快速翻板时长', value: '1.17秒' },
      { label: '中速翻板时长', value: '1.63秒' },
      { label: '慢速翻板时长', value: '2.07秒' },
      { label: '快速翻窗时长', value: '0.87秒' },
      { label: '慢速翻窗时长', value: '1.27秒' },
      { label: '箱子翻找时长', value: '7.14秒' }
    ]
  },
  {
    category: '治疗 HEALING',
    items: [
      { label: '治疗受伤求生者时长', value: '15.0秒' },
      { label: '受伤被他人治疗时间', value: '15.0秒' },
      { label: '倒地自我治疗时间', value: '30.0秒' }
    ]
  },
  {
    category: '其他 OTHERS',
    items: [
      { label: '脚印持续时长', value: '4.0秒' },
      { label: '受击加速时长', value: '4.0秒' },
      { label: '被背负时挣扎掉落时长', value: '16.0秒' },
      { label: '狂欢之椅起飞时长', value: '60.0秒' },
      { label: '椅上被救援时长', value: '0.86秒' }
    ]
  }
];

export const SURVIVOR_TRAITS_MODERN_TEMPLATE: CharacterTraitCategory[] = [
  {
    category: '移动 MOVEMENT',
    items: [
      { label: '跑动速度', value: '3.8米/秒' },
      { label: '走路速度', value: '2.11米/秒' },
      { label: '蹲走速度', value: '1.14米/秒' },
      { label: '爬行速度', value: '0.44米/秒' }
    ]
  },
  {
    category: '破译 DECODING',
    items: [
      { label: '密码机破译时长', value: '81秒' },
      { label: '破译完美判定额外增长进度', value: '1.00%' },
      { label: '破译触电回退进度', value: '1.00%' },
      { label: '破译触电无法破译时长', value: '2.0秒' },
      { label: '大门开启时长', value: '18.0秒' }
    ]
  },
  {
    category: '交互 INTERACTION',
    items: [
      { label: '放板时间', value: '0.73秒' },
      { label: '快速翻板时长', value: '1.17秒' },
      { label: '中速翻板时长', value: '1.63秒' },
      { label: '慢速翻板时长', value: '2.07秒' },
      { label: '快速翻窗时长', value: '0.87秒' },
      { label: '慢速翻窗时长', value: '1.27秒' },
      { label: '箱子翻找时长', value: '10秒' }
    ]
  },
  {
    category: '治疗 HEALING',
    items: [
      { label: '治疗受伤求生者时长', value: '15.0秒' },
      { label: '受伤被他人治疗时间', value: '15.0秒' },
      { label: '倒地自我治疗时间', value: '30.0秒' }
    ]
  },
  {
    category: '其他 OTHERS',
    items: [
      { label: '脚印持续时长', value: '4.0秒' },
      { label: '受击加速时长', value: '2.0秒' },
      { label: '被背负时挣扎掉落时长', value: '16.0秒' },
      { label: '狂欢之椅起飞时长', value: '60.0秒' },
      { label: '椅上被救援时长', value: '0.86秒' }
    ]
  }
];

export const HUNTER_TRAITS_TEMPLATE: CharacterTraitCategory[] = [
  {
    category: '移动与交互 MOVEMENT & INTERACTION',
    items: [
      { label: '模型体积', value: '半径0.38米' },
      { label: '移动速度', value: '4.64米/秒' },
      { label: '转向速度', value: '726.0度/秒' },
      { label: '跨过窗户时长', value: '1.31秒' },
      { label: '摧毁木板时长', value: '2.54秒' },
      { label: '被砸眩晕时长', value: '3.53秒' }
    ]
  },
  {
    category: '普通攻击 NORMAL ATTACK',
    items: [
      { label: '普通攻击前摇', value: '0.35秒' },
      { label: '普通攻击距离', value: '2.87米' },
      { label: '普通攻击未命中恢复动作时长', value: '0.61秒' },
      { label: '普通攻击命中恢复动作时长', value: '4.26秒' }
    ]
  },
  {
    category: '蓄力攻击 CHARGED ATTACK',
    items: [
      { label: '蓄力攻击前摇', value: '2.06秒' },
      { label: '蓄力攻击距离', value: '3.46米' },
      { label: '蓄力攻击未命中恢复动作时长', value: '0.98秒' },
      { label: '蓄力攻击命中恢复动作时长', value: '4.35秒' }
    ]
  },
  {
    category: '牵气球 BALLOONING',
    items: [
      { label: '牵起气球时长', value: '1.96秒' },
      { label: '被挣脱后眩晕时长', value: '5.64秒' },
      { label: '牵气球攻击前摇', value: '0.93秒' },
      { label: '牵气球攻击距离', value: '2.87米' }
    ]
  },
  {
    category: '其他 OTHERS',
    items: [
      { label: '恐惧半径大小', value: '32.07米' },
      { label: '攻击命中场景恢复动作时长', value: '1.01秒' }
    ]
  }
];

export const MOCK_CHARACTERS: Character[] = [
  {
    id: 'base_survivor',
    name: '基础信息',
    title: '求生者概览',
    role: 'Survivor',
    type: '系统/基础',
    description: '求生者阵营的基础规则与通用信息。',
    skills: [
      { name: '破译密码机', description: '求生者的核心目标，破译5台密码机以开启大门。' },
      { name: '救助队友', description: '从狂欢之椅上救下队友，延续团队生存。' },
    ],
    imageUrl: 'https://picsum.photos/seed/survivor-base/400/600',
    order: 0,
    traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE))
  },
  {
    id: 'base_hunter',
    name: '基础信息',
    title: '监管者概览',
    role: 'Hunter',
    type: '系统/基础',
    description: '监管者阵营的基础规则与通用信息。',
    skills: [
      { name: '追击求生者', description: '利用实体能力和普通攻击击倒求生者。' },
      { name: '放上狂欢之椅', description: '将倒地的求生者送往庄园，淘汰对手。' },
    ],
    imageUrl: 'https://picsum.photos/seed/hunter-base/400/600',
    order: 0,
    traits: JSON.parse(JSON.stringify(HUNTER_TRAITS_TEMPLATE))
  }
];

export interface TalentNode {
  id: string;
  maxLevel: number;
  connections: string[];
  defaultName?: string;
  talentId?: string;
}


export interface WikiEntry {
  id: string;
  title: string;
  type: 'character' | 'map' | 'mechanic' | 'guide' | 'talent';
  contentMode: 'text' | 'template';
  currentRevisionId: string;
  authorId: string;
  tags: string[];
  talentId?: string; // Link to a talent node
  lastUpdated: any;
}

export interface Revision {
  id: string;
  entryId: string;
  authorId: string;
  content: any;
  timestamp: any;
  status: 'pending' | 'approved' | 'rejected';
  changeSummary?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: 'user' | 'contributor' | 'admin';
  contributions: number;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  resources?: string;
}

export interface MapResource {
  id: string;
  title: string;
  content: string;
  mapId?: string; // Optional link to a map
  updatedAt: any;
  authorId: string;
}

export const MOCK_MAPS: GameMap[] = [
  {
    id: 'm1',
    name: '军工厂',
    description: '曾经是著名的军工厂，现在是一片废墟。地形开阔，适合博弈。',
    imageUrl: 'https://picsum.photos/seed/factory/800/400',
    difficulty: 'Easy',
  },
  {
    id: 'm2',
    name: '红教堂',
    description: '庄严的教堂见证了无数秘密。墙壁可以被破坏，改变地形。',
    imageUrl: 'https://picsum.photos/seed/church/800/400',
    difficulty: 'Medium',
  },
  {
    id: 'm3',
    name: '圣心医院',
    description: '两层结构的医院大楼是博弈的核心。',
    imageUrl: 'https://picsum.photos/seed/hospital/800/400',
    difficulty: 'Medium',
  },
];

export interface Tag {
  id: string;
  name: string;
  color: string;
  affectedRole: 'Survivor' | 'Hunter' | 'Both';
  affectedStats: string[];
  updatedAt: any;
  authorId: string;
}

export const DEFAULT_TAG_CONFIG = [
  { name: '移动', color: '#06b6d4', keywords: ['移动', '移速', '速度', '冲刺', '加速', '距离'] },
  { name: '破译', color: '#10b981', keywords: ['破译', '修机', '密码机', '进度', '校准'] },
  { name: '交互', color: '#f59e0b', keywords: ['交互', '翻窗', '翻板', '窗板', '放板', '跨越', '牵制'] },
  { name: '治疗', color: '#ef4444', keywords: ['治疗', '自愈', '倒地', '受伤', '愈合', '救人'] },
];
