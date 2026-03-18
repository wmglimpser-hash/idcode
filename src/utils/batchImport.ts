import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Character } from '../constants';

const survivorsData = [
  { name: '幸运儿', title: '幸运儿' },
  { name: '艾米丽·黛儿', title: '医生' },
  { name: '弗雷迪·莱利', title: '律师' },
  { name: '克利切·皮尔森', title: '慈善家' },
  { name: '艾玛·伍兹', title: '园丁' },
  { name: '瑟维·勒·罗伊', title: '魔术师' },
  { name: '库特·弗兰克', title: '冒险家' },
  { name: '奈布·萨贝达', title: '佣兵' },
  { name: '玛尔塔·贝坦菲尔', title: '空军' },
  { name: '特蕾西·列兹尼克', title: '机械师' },
  { name: '威廉·艾利斯', title: '前锋' },
  { name: '海伦娜·亚当斯', title: '盲女' },
  { name: '菲欧娜·吉尔曼', title: '祭司' },
  { name: '薇拉·奈尔', title: '调香师' },
  { name: '凯文·阿尤索', title: '牛仔' },
  { name: '玛格丽莎·泽莱', title: '舞女' },
  { name: '伊莱·克拉克', title: '先知' },
  { name: '伊索·卡尔', title: '入殓师' },
  { name: '诺顿·坎贝尔', title: '勘探员' },
  { name: '帕缇夏·多里瓦尔', title: '咒术师' },
  { name: '穆罗', title: '野人' },
  { name: '麦克·莫顿', title: '杂技演员' },
  { name: '何塞·巴登', title: '大副' },
  { name: '黛米·波本', title: '调酒师' },
  { name: '维克多·葛兰兹', title: '邮差' },
  { name: '安德鲁·克雷斯', title: '守墓人' },
  { name: '卢卡·巴尔萨', title: '囚徒' },
  { name: '梅莉·普林尼', title: '昆虫学家' },
  { name: '艾格·瓦尔登', title: '画家' },
  { name: '甘吉·古普塔', title: '击球手' },
  { name: '安妮·莱斯特', title: '玩具商' },
  { name: '埃米尔', title: '病患' },
  { name: '艾达·梅斯默', title: '心理学家' },
  { name: '奥尔菲斯', title: '小说家' },
  { name: '回忆', title: '小女孩' },
  { name: '裘克', title: '哭泣小丑' },
  { name: '卢基诺·迪鲁西', title: '教授' },
  { name: '戚十一', title: '古董商' },
  { name: '弗雷德里克·克雷伯格', title: '作曲家' },
  { name: '爱丽丝·德罗斯', title: '记者' },
  { name: '查尔斯·霍尔特', title: '飞行家' },
  { name: '海伦娜·亚当斯', title: '拉拉队员' },
  { name: '玛丽亚', title: '木偶师' },
  { name: '弗洛里安·莱斯特', title: '火灾调查员' },
  { name: '法罗', title: '法罗女士' },
  { name: '兰斯特', title: '骑士' },
  { name: '珀西·伊文斯', title: '气象学家' },
  { name: '威廉·艾利斯', title: '弓箭手' },
];

export const batchImportSurvivors = async () => {
  const results = [];
  for (const s of survivorsData) {
    const char: Omit<Character, 'id'> = {
      name: s.name,
      title: s.title,
      role: 'Survivor',
      type: '待补充',
      description: `${s.title}的个人档案。`,
      skills: [],
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(s.title)}/400/600`,
      traits: [
        { category: '移动 MOVEMENT', items: [{ label: '跑动速度', value: '3.8米/秒' }] },
        { category: '破译 DECODING', items: [{ label: '密码机破译时间', value: '81.0秒' }] },
        { category: '交互 INTERACTION', items: [{ label: '快速翻窗时间', value: '0.87秒' }] },
        { category: '治疗 HEALING', items: [{ label: '治疗他人时间', value: '15.0秒' }] },
        { category: '其他 OTHERS', items: [{ label: '脚印持续时间', value: '4.0秒' }] }
      ],
      mechanics: [],
      lastUpdated: serverTimestamp()
    };
    
    try {
      const docRef = await addDoc(collection(db, 'characters'), char);
      results.push({ title: s.title, id: docRef.id });
      console.log(`Imported: ${s.title}`);
    } catch (error) {
      console.error(`Error importing ${s.title}:`, error);
    }
  }
  return results;
};
