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
  skills: { name: string; description: string; icon?: string }[];
  imageUrl: string;
  traits?: CharacterTraitCategory[];
  mechanics?: { title: string; content: string }[];
  lastUpdated?: any;
}

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
    traits: [
      {
        category: '移动 MOVEMENT',
        items: [
          { label: '模型体积', value: '半径0.34米' },
          { label: '跑动速度', value: '3.8米/秒' },
          { label: '走路速度', value: '2.11米/秒' },
          { label: '蹲走速度', value: '1.14米/秒' },
          { label: '爬行速度', value: '0.44米/秒' },
          { label: '转向速度', value: '858.0度/秒' }
        ]
      },
      {
        category: '破译 DECODING',
        items: [
          { label: '密码机破译时间', value: '81.0秒' },
          { label: '双人合作破译', value: '54.0秒' },
          { label: '三人合作破译', value: '41.54秒' },
          { label: '四人合作破译', value: '33.75秒' },
          { label: '破译完美判定', value: '1.00%' },
          { label: '破译触电进度损失', value: '1.00%' },
          { label: '破译触电无法操作', value: '2.0秒' },
          { label: '破译加速开启时间', value: '210.0秒' },
          { label: '破译加速增长进度', value: '30.00%' },
          { label: '大门开启时间', value: '18.0秒' }
        ]
      },
      {
        category: '交互 INTERACTION',
        items: [
          { label: '放板时间', value: '0.73秒' },
          { label: '快速翻板时间', value: '1.17秒' },
          { label: '中速翻板时间', value: '1.63秒' },
          { label: '慢速翻板时间', value: '2.07秒' },
          { label: '快速翻窗时间', value: '0.87秒' },
          { label: '慢速翻窗时间', value: '1.27秒' },
          { label: '箱子翻找时间', value: '10.0秒' }
        ]
      },
      {
        category: '爆点 ALERTS',
        items: [
          { label: '引起乌鸦聚集时间', value: '80.0秒' },
          { label: '放板交互爆点距离', value: '42.19米' },
          { label: '翻板交互爆点距离', value: '33.76米' },
          { label: '翻窗交互爆点距离', value: '33.76米' }
        ]
      },
      {
        category: '治疗 HEALING',
        items: [
          { label: '治疗受伤状态时间', value: '15.0秒' },
          { label: '受伤被他人治疗时间', value: '15.0秒' },
          { label: '倒地自我治疗上限', value: '30.0秒' },
          { label: '倒地自我治疗时间', value: '76.0秒' },
          { label: '单人治疗他人时间', value: '42.0秒' },
          { label: '单人治疗他人速度', value: '9.09秒' },
          { label: '双人治疗他人时间', value: '34.0秒' },
          { label: '双人治疗他人速度', value: '8.1秒' },
          { label: '多人治疗他人时间', value: '30.0秒' },
          { label: '多人治疗他人速度', value: '7.31秒' },
          { label: '治疗判定完美范围', value: '1.00%' },
          { label: '治疗判定失败损失', value: '10.0%' }
        ]
      },
      {
        category: '其他 OTHERS',
        items: [
          { label: '脚印持续时间', value: '4.0秒' },
          { label: '受击加速时间', value: '2.0秒' },
          { label: '受击增加移动速度', value: '65.00%' },
          { label: '被背负挣扎时间', value: '16.0秒' },
          { label: '被背负挣扎进度损失', value: '25.0%' },
          { label: '狂欢之椅起飞时间', value: '60.0秒' },
          { label: '椅子上被救援时间', value: '0.86秒' }
        ]
      }
    ]
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
    traits: [
      {
        category: '移动与交互 MOVEMENT & INTERACTION',
        items: [
          { label: '模型体积', value: '半径0.45米' },
          { label: '移动速度', value: '4.64米/秒' },
          { label: '转向速度', value: '900.0度/秒' },
          { label: '跨过窗户时长', value: '1.5秒' },
          { label: '摧毁木板时长', value: '2.0秒' }
        ]
      },
      {
        category: '普通攻击 NORMAL ATTACK',
        items: [
          { label: '普通攻击前摇', value: '0.4秒' },
          { label: '普通攻击距离', value: '3.5米' },
          { label: '攻击命中恢复时长', value: '3.0秒' }
        ]
      }
    ]
  },
  {
    id: '1',
    name: '艾玛·伍兹',
    title: '园丁',
    role: 'Survivor',
    type: '牵制/辅助',
    description: '拥有出色的破坏能力和自我保护能力，能够通过破坏狂欢之椅来干扰监管者的节奏。',
    skills: [
      { name: '巧手匠心', description: '随身携带工具箱，可以破坏场景中的狂欢之椅。' },
      { name: '守护', description: '开局获得一次护盾，可以抵挡一次伤害。' },
      { name: '安全感', description: '在狂欢之椅上的坚持时间增加。' },
    ],
    imageUrl: 'https://picsum.photos/seed/gardener/400/600',
    traits: [
      {
        category: '移动 MOVEMENT',
        items: [
          { label: '跑动速度', value: '3.8米/秒' },
          { label: '走路速度', value: '2.11米/秒' }
        ]
      },
      {
        category: '破译 DECODING',
        items: [
          { label: '密码机破译时间', value: '81.0秒' },
          { label: '大门开启时间', value: '18.0秒' }
        ]
      },
      {
        category: '交互 INTERACTION',
        items: [
          { label: '放板时间', value: '0.73秒' },
          { label: '快速翻板时间', value: '1.17秒' },
          { label: '快速翻窗时间', value: '0.87秒' }
        ]
      }
    ],
    mechanics: [
      { title: '护盾运用', content: '开局自带护盾，可以抵挡一次伤害。在椅子附近停留可以增加护盾充能。' },
      { title: '拆椅策略', content: '优先拆除地下室附近的椅子，为队友争取挣扎空间。' }
    ]
  },
  {
    id: '2',
    name: '伊莱·克拉克',
    title: '先知',
    role: 'Survivor',
    type: '辅助/牵制',
    description: '拥有役鸟的保护，能够预见监管者的位置并为队友提供关键的保护。',
    skills: [
      { name: '役鸟', description: '随身携带役鸟，可以观察监管者或保护自己和队友。' },
      { name: '先知', description: '开局可以预见监管者的位置。' },
      { name: '劳神', description: '役鸟每抵挡一次伤害，先知的交互速度会降低。' },
    ],
    imageUrl: 'https://picsum.photos/seed/seer/400/600',
    traits: [
      {
        category: '移动 MOVEMENT',
        items: [
          { label: '跑动速度', value: '3.8米/秒' }
        ]
      },
      {
        category: '破译 DECODING',
        items: [
          { label: '密码机破译时间', value: '81.0秒' }
        ]
      },
      {
        category: '交互 INTERACTION',
        items: [
          { label: '快速翻板时间', value: '1.17秒' },
          { label: '快速翻窗时间', value: '0.87秒' }
        ]
      }
    ],
    mechanics: [
      { title: '吸鸟技巧', content: '在监管者附近停留可以为役鸟充能。利用回头观察可以最大化充能效率。' }
    ]
  },
  {
    id: '3',
    name: '里奥·贝克',
    title: '厂长',
    role: 'Hunter',
    type: '控制/辅助',
    description: '通过怨火召唤傀儡和虚影，对求生者形成多方位的包夹。',
    skills: [
      { name: '傀儡操纵', description: '放置傀儡，可以随时与傀儡交换位置并获得视野。' },
      { name: '怨火', description: '求生者被追击或被击中时产生怨火，可以用来强化傀儡或召唤虚影。' },
    ],
    imageUrl: 'https://picsum.photos/seed/hell-ember/400/600',
    traits: [
      {
        category: '移动与交互 MOVEMENT & INTERACTION',
        items: [
          { label: '移动速度', value: '4.64米/秒' },
          { label: '跨过窗户时长', value: '1.5秒' },
          { label: '摧毁木板时长', value: '2.0秒' }
        ]
      },
      {
        category: '普通攻击 NORMAL ATTACK',
        items: [
          { label: '普通攻击前摇', value: '0.4秒' },
          { label: '普通攻击距离', value: '3.5米' },
          { label: '攻击命中恢复时长', value: '3.0秒' }
        ]
      }
    ],
    mechanics: [
      { title: '守椅思路', content: '利用傀儡进行双守，或者在求生者救人时利用怨灵进行干扰。' }
    ]
  },
  {
    id: '4',
    name: '杰克',
    title: '开膛手',
    role: 'Hunter',
    type: '追击/隐蔽',
    description: '拥有雾隐能力，在雾区中可以获得极快的移动速度和远程攻击手段。',
    skills: [
      { name: '寒雾', description: '雾区内攻击会产生雾刃，造成远程伤害。' },
      { name: '雾隐', description: '不进行大幅动作时进入隐身状态，移动速度大幅提升。' },
    ],
    imageUrl: 'https://picsum.photos/seed/ripper/400/600',
    traits: [
      {
        category: '移动与交互 MOVEMENT & INTERACTION',
        items: [
          { label: '移动速度', value: '4.74米/秒' },
          { label: '跨过窗户时长', value: '1.3秒' },
          { label: '摧毁木板时长', value: '1.8秒' }
        ]
      },
      {
        category: '普通攻击 NORMAL ATTACK',
        items: [
          { label: '普通攻击前摇', value: '0.35秒' },
          { label: '普通攻击距离', value: '3.8米' },
          { label: '攻击命中恢复时长', value: '2.8秒' }
        ]
      }
    ]
  },
];

export interface WikiEntry {
  id: string;
  title: string;
  type: 'character' | 'map' | 'mechanic' | 'guide';
  contentMode: 'text' | 'template';
  currentRevisionId: string;
  authorId: string;
  tags: string[];
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
