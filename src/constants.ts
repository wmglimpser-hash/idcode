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
  skills: { name: string; description: string; icon?: string }[];
  imageUrl: string;
  order?: number;
  traits?: CharacterTraitCategory[];
  mechanics?: { title: string; content: string; icon?: string }[];
  linkedMechanics?: { characterId: string; mechanicIndex: number }[];
  lastUpdated?: any;
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
    traits: [
      {
        category: '移动',
        items: [
          { label: '跑动速度', value: '3.8米/秒' },
          { label: '走路速度', value: '2.11米/秒' },
          { label: '蹲走速度', value: '1.14米/秒' },
          { label: '爬行速度', value: '0.44米/秒' }
        ]
      },
      {
        category: '破译',
        items: [
          { label: '密码机破译时长', value: '81秒' },
          { label: '破译完美判定额外增长进度', value: '1.00%' },
          { label: '破译触电回退进度', value: '1.00%' },
          { label: '破译触电无法破译时长', value: '2.0秒' },
          { label: '大门开启时长', value: '18.0秒' }
        ]
      },
      {
        category: '交互',
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
        category: '治疗',
        items: [
          { label: '治疗受伤求生者时长', value: '15.0秒' },
          { label: '受伤被他人治疗时间', value: '15.0秒' },
          { label: '倒地自我治疗时间', value: '30.0秒' }
        ]
      },
      {
        category: '其他',
        items: [
          { label: '脚印持续时长', value: '4.0秒' },
          { label: '受击加速时长', value: '4.0秒' },
          { label: '被背负时挣扎掉落时长', value: '16.0秒' },
          { label: '狂欢之椅起飞时长', value: '60.0秒' },
          { label: '椅上被救援时长', value: '0.86秒' }
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
    order: 0,
    traits: []
  },
  // Survivors
  { 
    id: 's1', 
    name: '幸运儿', 
    title: '幸运儿', 
    role: 'Survivor', 
    type: '辅助/牵制', 
    description: '庄园中唯一的幸运儿。', 
    skills: [], 
    imageUrl: 'https://picsum.photos/seed/lucky/400/600', 
    order: 1,
    traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE))
  },
  { id: 's2', name: '艾米丽·黛儿', title: '医生', role: 'Survivor', type: '辅助/治疗', description: '拥有高超的医术。', skills: [], imageUrl: 'https://picsum.photos/seed/doctor/400/600', order: 2, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's3', name: '弗雷迪·莱利', title: '律师', role: 'Survivor', type: '辅助/破译', description: '精通法律的律师。', skills: [], imageUrl: 'https://picsum.photos/seed/lawyer/400/600', order: 3, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's4', name: '克利切·皮尔森', title: '慈善家', role: 'Survivor', type: '牵制/辅助', description: '身手敏捷的慈善家。', skills: [], imageUrl: 'https://picsum.photos/seed/thief/400/600', order: 4, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's5', name: '艾玛·伍兹', title: '园丁', role: 'Survivor', type: '牵制/辅助', description: '拥有出色的破坏能力。', skills: [], imageUrl: 'https://picsum.photos/seed/gardener/400/600', order: 5, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's6', name: '瑟维·勒·罗伊', title: '魔术师', role: 'Survivor', type: '牵制/辅助', description: '精通魔术的表演者。', skills: [], imageUrl: 'https://picsum.photos/seed/magician/400/600', order: 6, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's7', name: '库特·弗兰克', title: '冒险家', role: 'Survivor', type: '破译/辅助', description: '热爱冒险的旅行家。', skills: [], imageUrl: 'https://picsum.photos/seed/explorer/400/600', order: 7, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's8', name: '奈布·萨贝达', title: '佣兵', role: 'Survivor', type: '救援/牵制', description: '身经百战的佣兵。', skills: [], imageUrl: 'https://picsum.photos/seed/mercenary/400/600', order: 8, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's9', name: '玛尔塔·贝坦菲尔', title: '空军', role: 'Survivor', type: '救援/牵制', description: '英姿飒爽的空军。', skills: [], imageUrl: 'https://picsum.photos/seed/coordinator/400/600', order: 9, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's10', name: '特蕾西·列兹尼克', title: '机械师', role: 'Survivor', type: '破译/辅助', description: '精通机械的天才。', skills: [], imageUrl: 'https://picsum.photos/seed/mechanic/400/600', order: 10, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's11', name: '威廉·艾利斯', title: '前锋', role: 'Survivor', type: '救援/牵制', description: '充满力量的前锋。', skills: [], imageUrl: 'https://picsum.photos/seed/forward/400/600', order: 11, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's12', name: '海伦娜·亚当斯', title: '盲女', role: 'Survivor', type: '破译/辅助', description: '拥有敏锐听觉的盲女。', skills: [], imageUrl: 'https://picsum.photos/seed/mindseye/400/600', order: 12, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's13', name: '菲欧娜·吉尔曼', title: '祭司', role: 'Survivor', type: '辅助/牵制', description: '神秘的祭司。', skills: [], imageUrl: 'https://picsum.photos/seed/priestess/400/600', order: 13, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's14', name: '薇拉·奈尔', title: '调香师', role: 'Survivor', type: '牵制/辅助', description: '迷人的调香师。', skills: [], imageUrl: 'https://picsum.photos/seed/perfumer/400/600', order: 14, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's15', name: '凯文·阿尤索', title: '牛仔', role: 'Survivor', type: '救援/辅助', description: '豪迈的牛仔。', skills: [], imageUrl: 'https://picsum.photos/seed/cowboy/400/600', order: 15, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's16', name: '玛格丽莎·泽莱', title: '舞女', role: 'Survivor', type: '牵制/辅助', description: '优雅的舞女。', skills: [], imageUrl: 'https://picsum.photos/seed/dancer/400/600', order: 16, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's17', name: '伊莱·克拉克', title: '先知', role: 'Survivor', type: '辅助/牵制', description: '拥有役鸟的保护。', skills: [], imageUrl: 'https://picsum.photos/seed/seer/400/600', order: 17, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's18', name: '伊索·卡尔', title: '入殓师', role: 'Survivor', type: '辅助/救援', description: '冷静的入殓师。', skills: [], imageUrl: 'https://picsum.photos/seed/embalmer/400/600', order: 18, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's19', name: '诺顿·坎贝尔', title: '勘探员', role: 'Survivor', type: '牵制/辅助', description: '精通磁力的勘探员。', skills: [], imageUrl: 'https://picsum.photos/seed/prospector/400/600', order: 19, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's20', name: '帕缇夏·多里瓦尔', title: '咒术师', role: 'Survivor', type: '牵制/辅助', description: '神秘的咒术师。', skills: [], imageUrl: 'https://picsum.photos/seed/enchantress/400/600', order: 20, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's21', name: '穆罗', title: '野人', role: 'Survivor', type: '牵制/辅助', description: '与野猪为伴的野人。', skills: [], imageUrl: 'https://picsum.photos/seed/wildling/400/600', order: 21, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's22', name: '麦克·莫顿', title: '杂技演员', role: 'Survivor', type: '牵制/辅助', description: '活泼的杂技演员。', skills: [], imageUrl: 'https://picsum.photos/seed/acrobat/400/600', order: 22, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_TEMPLATE)) },
  { id: 's23', name: '何塞·巴登', title: '大副', role: 'Survivor', type: '救援/牵制', description: '沉稳的大副。', skills: [], imageUrl: 'https://picsum.photos/seed/firstofficer/400/600', order: 23, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's24', name: '黛米·波本', title: '调酒师', role: 'Survivor', type: '辅助/牵制', description: '热情的调酒师。', skills: [], imageUrl: 'https://picsum.photos/seed/barmaid/400/600', order: 24, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's25', name: '维克多·葛兰兹', title: '邮差', role: 'Survivor', type: '辅助/破译', description: '忠诚的邮差。', skills: [], imageUrl: 'https://picsum.photos/seed/postman/400/600', order: 25, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's26', name: '安德鲁·克雷斯', title: '守墓人', role: 'Survivor', type: '救援/牵制', description: '孤独的守墓人。', skills: [], imageUrl: 'https://picsum.photos/seed/gravekeeper/400/600', order: 26, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's27', name: '卢卡·巴尔萨', title: '囚徒', role: 'Survivor', type: '破译/辅助', description: '天才的囚徒。', skills: [], imageUrl: 'https://picsum.photos/seed/prisoner/400/600', order: 27, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's28', name: '梅莉·普林尼', title: '昆虫学家', role: 'Survivor', type: '牵制/辅助', description: '博学的昆虫学家。', skills: [], imageUrl: 'https://picsum.photos/seed/entomologist/400/600', order: 28, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's29', name: '艾格·瓦尔登', title: '画家', role: 'Survivor', type: '牵制/辅助', description: '高傲的画家。', skills: [], imageUrl: 'https://picsum.photos/seed/painter/400/600', order: 29, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's30', name: '甘吉·古普塔', title: '击球手', role: 'Survivor', type: '救援/牵制', description: '强壮的击球手。', skills: [], imageUrl: 'https://picsum.photos/seed/batter/400/600', order: 30, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's31', name: '安妮·莱斯特', title: '玩具商', role: 'Survivor', type: '辅助/牵制', description: '富有创造力的玩具商。', skills: [], imageUrl: 'https://picsum.photos/seed/toymaker/400/600', order: 31, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's32', name: '埃米尔', title: '病患', role: 'Survivor', type: '牵制/辅助', description: '沉默的病患。', skills: [], imageUrl: 'https://picsum.photos/seed/patient/400/600', order: 32, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's33', name: '艾达·梅斯默', title: '心理学家', role: 'Survivor', type: '辅助/救援', description: '专业的心理学家。', skills: [], imageUrl: 'https://picsum.photos/seed/psychologist/400/600', order: 33, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's34', name: '奥尔菲斯', title: '小说家', role: 'Survivor', type: '辅助/牵制', description: '神秘的小说家。', skills: [], imageUrl: 'https://picsum.photos/seed/novelist/400/600', order: 34, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's35', name: '回忆', title: '小女孩', role: 'Survivor', type: '辅助/牵制', description: '寻找回忆的小女孩。', skills: [], imageUrl: 'https://picsum.photos/seed/littlegirl/400/600', order: 35, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's36', name: '裘克', title: '哭泣小丑', role: 'Survivor', type: '牵制/辅助', description: '悲伤的哭泣小丑。', skills: [], imageUrl: 'https://picsum.photos/seed/weepingclown/400/600', order: 36, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's37', name: '卢基诺·迪鲁西', title: '教授', role: 'Survivor', type: '牵制/辅助', description: '博学的教授。', skills: [], imageUrl: 'https://picsum.photos/seed/professor/400/600', order: 37, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's38', name: '戚十一', title: '古董商', role: 'Survivor', type: '牵制/辅助', description: '神秘的古董商。', skills: [], imageUrl: 'https://picsum.photos/seed/antiquarian/400/600', order: 38, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's39', name: '弗雷德里克·克雷伯格', title: '作曲家', role: 'Survivor', type: '破译/辅助', description: '优雅的作曲家。', skills: [], imageUrl: 'https://picsum.photos/seed/composer/400/600', order: 39, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's40', name: '爱丽丝·德罗斯', title: '记者', role: 'Survivor', type: '救援/破译', description: '勇敢的记者。', skills: [], imageUrl: 'https://picsum.photos/seed/journalist/400/600', order: 40, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's41', name: '查尔斯·霍尔特', title: '飞行家', role: 'Survivor', type: '牵制/辅助', description: '梦想飞行的飞行家。', skills: [], imageUrl: 'https://picsum.photos/seed/aeroplanist/400/600', order: 41, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's42', name: '莉莉·巴瑞尔', title: '拉拉队员', role: 'Survivor', type: '辅助/牵制', description: '充满活力的拉拉队员。', skills: [], imageUrl: 'https://picsum.photos/seed/cheerleader/400/600', order: 42, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's43', name: '玛蒂亚斯·切尔宁', title: '木偶师', role: 'Survivor', type: '牵制/辅助', description: '神秘的木偶师。', skills: [], imageUrl: 'https://picsum.photos/seed/puppeteer/400/600', order: 43, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's44', name: '弗洛里安·布兰德', title: '火灾调查员', role: 'Survivor', type: '牵制/辅助', description: '专业的火灾调查员。', skills: [], imageUrl: 'https://picsum.photos/seed/fireinvestigator/400/600', order: 44, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's45', name: '法罗女士', title: '法罗女士', role: 'Survivor', type: '牵制/辅助', description: '优雅的法罗女士。', skills: [], imageUrl: 'https://picsum.photos/seed/faro/400/600', order: 45, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's46', name: '兰斯洛特', title: '骑士', role: 'Survivor', type: '救援/牵制', description: '英勇的骑士。', skills: [], imageUrl: 'https://picsum.photos/seed/knight/400/600', order: 46, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's47', name: '珀西', title: '气象学家', role: 'Survivor', type: '辅助/破译', description: '专业的气象学家。', skills: [], imageUrl: 'https://picsum.photos/seed/meteorologist/400/600', order: 47, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  { id: 's48', name: '威廉', title: '弓箭手', role: 'Survivor', type: '救援/牵制', description: '精准的弓箭手。', skills: [], imageUrl: 'https://picsum.photos/seed/archer/400/600', order: 48, traits: JSON.parse(JSON.stringify(SURVIVOR_TRAITS_MODERN_TEMPLATE)) },
  // Hunters
  {
    id: 'h1',
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
    order: 100,
    traits: JSON.parse(JSON.stringify(HUNTER_TRAITS_TEMPLATE)),
    mechanics: [
      { title: '守椅思路', content: '利用傀儡进行双守，或者在求生者救人时利用怨灵进行干扰。' }
    ]
  },
  {
    id: 'h2',
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
    order: 101,
    traits: [
      {
        category: '移动与交互 MOVEMENT & INTERACTION',
        items: [
          { label: '模型体积', value: '半径0.38米' },
          { label: '移动速度', value: '4.74米/秒' },
          { label: '转向速度', value: '726.0度/秒' },
          { label: '跨过窗户时长', value: '1.3秒' },
          { label: '摧毁木板时长', value: '1.8秒' },
          { label: '被砸眩晕时长', value: '3.53秒' }
        ]
      },
      {
        category: '普通攻击 NORMAL ATTACK',
        items: [
          { label: '普通攻击前摇', value: '0.35秒' },
          { label: '普通攻击距离', value: '3.8米' },
          { label: '普通攻击未命中恢复动作时长', value: '0.61秒' },
          { label: '普通攻击命中恢复动作时长', value: '2.8秒' }
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
    ]
  },
];

export interface TalentNode {
  id: string;
  maxLevel: number;
  connections: string[];
  defaultName?: string;
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
