import { Character, Tag, TalentDefinition } from '../constants';

/**
 * 清洁文件名，去除特殊字符并压缩多余空格
 */
export const sanitizeFileName = (input: string): string => {
  return input
    .replace(/[\\/:*?"<>|]/g, '_') // 替换 Windows/Linux 禁用字符为下划线
    .replace(/\s+/g, ' ')          // 压缩多余空格
    .trim();                       // 去除首尾空格
};

const downloadMarkdown = (content: string, fileName: string) => {
  const sanitizedName = sanitizeFileName(fileName);
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return sanitizedName;
};

export const exportLeaderboardToMarkdown = (
  title: string,
  role: string,
  traitLabel: string,
  sortOrder: 'asc' | 'desc',
  characterCount: number,
  groupedData: { rank: number; value: string; characters: any[] }[],
  traitRemarks: Record<string, string>
) => {
  const timestamp = new Date().toLocaleString();
  let content = `# 排行榜数据卡: ${title}\n\n`;
  content += `- **导出时间**: ${timestamp}\n`;
  content += `- **阵营**: ${role === 'Survivor' ? '求生者' : '监管者'}\n`;
  content += `- **指标项**: ${traitLabel}\n`;
  content += `- **排序方向**: ${sortOrder === 'desc' ? '降序' : '升序'}\n`;
  content += `- **有效角色总数**: ${characterCount}\n\n`;
  
  content += `## 排名分布\n\n`;
  
  groupedData.forEach(group => {
    content += `### 第 ${group.rank} 名 (${group.value})\n`;
    group.characters.forEach(char => {
      const traitLabelClean = traitLabel.replace(/[.#$/[\]]/g, '_');
      const remarkId = `${char.id}_${traitLabelClean}_${char.value}`.replace(/[.#$/[\]]/g, '_');
      const remark = traitRemarks[remarkId] ? ` [备注: ${traitRemarks[remarkId]}]` : '';
      content += `- **${char.title}** (${char.name})${remark}\n`;
    });
    content += `\n`;
  });

  content += `---\n*由 庄园秘典 CODEX 系统自动生成数据素材*\n`;

  return downloadMarkdown(content, `leaderboard_${role}_${traitLabel}_${Date.now()}.md`);
};

export const exportCharacterCardToMarkdown = (character: Character, availableTags: Tag[] = []) => {
  const timestamp = new Date().toLocaleString();
  let content = `# 角色资料卡: ${character.title} - ${character.name}\n\n`;
  content += `- **导出时间**: ${timestamp}\n`;
  content += `- **阵营**: ${character.role === 'Survivor' ? '求生者' : '监管者'}\n`;
  content += `- **定位**: ${character.type}\n`;
  content += `- **排序ID**: ${character.order}\n\n`;

  content += `## 背景描述\n${character.description || '暂无描述'}\n\n`;

  content += `## 数值特质\n`;
  character.traits?.forEach(cat => {
    content += `### ${cat.category}\n`;
    cat.items.forEach(item => {
      content += `- **${item.label}**: ${item.value}\n`;
    });
    content += `\n`;
  });

  content += `## 外在特质\n`;
  character.skills?.forEach(skill => {
    content += `### ${skill.name}\n`;
    if (skill.cooldown) content += `- **冷却**: ${skill.cooldown}\n`;
    if (skill.cost) content += `- **消耗**: ${skill.cost}\n`;
    content += `- **描述**: ${skill.description}\n`;
    if (skill.tags?.length) content += `- **关联标签**: ${skill.tags.map(t => `\`${t}\``).join(' ')}\n`;
    content += `\n`;
  });

  if (character.role === 'Hunter' && character.presence) {
    content += `## 存在感阶级\n`;
    character.presence.forEach(p => {
      content += `### ${p.tier}阶：${p.name}\n`;
      if (p.cooldown) content += `- **冷却**: ${p.cooldown}\n`;
      content += `- **描述**: ${p.description}\n`;
      if (p.tags?.length) content += `- **关联标签**: ${p.tags.map(t => `\`${t}\``).join(' ')}\n`;
      content += `\n`;
    });
  }

  if (character.mechanics) {
    content += `## 核心机制\n`;
    character.mechanics.forEach(m => {
      content += `### ${m.title}\n`;
      content += `${m.content}\n\n`;
    });
  }

  content += `---\n*由 庄园秘典 CODEX 系统自动生成数据素材*\n`;

  return downloadMarkdown(content, `character_card_${character.title}_${character.name}_${Date.now()}.md`);
};

export const generateTagMaterialSection = (
  tag: Tag,
  relatedCharacters: Character[],
  relatedTalents: TalentDefinition[]
): string => {
  let content = `## 标签: ${tag.name}\n\n`;
  content += `- **标签ID**: ${tag.id}\n`;
  content += `- **适用阵营**: ${tag.affectedRole}\n`;
  content += `- **关联角色数**: ${relatedCharacters.length}\n`;
  content += `- **关联天赋数**: ${relatedTalents.length}\n\n`;

  if (relatedCharacters.length > 0) {
    content += `### 角色技能描述\n\n`;
    relatedCharacters.forEach(char => {
      let charSkills = '';
      char.skills?.forEach(s => {
        if (s.tags?.includes(tag.name)) {
          charSkills += `#### 外在特质: ${s.name}\n> ${s.description}\n\n`;
        }
      });
      char.presence?.forEach(p => {
        if (p.tags?.includes(tag.name)) {
          charSkills += `#### 存在感能力: ${p.name}\n> ${p.description}\n\n`;
        }
      });
      if (charSkills) {
        content += `#### [角色] ${char.title} ${char.name}\n${charSkills}`;
      }
    });
  }

  if (relatedTalents.length > 0) {
    content += `### 天赋描述\n\n`;
    relatedTalents.forEach(t => {
      content += `#### [天赋] ${t.name}\n> ${t.description}\n\n`;
    });
  }

  return content + `\n---\n`;
};

export const exportTagMaterialToMarkdown = (
  tag: Tag,
  relatedCharacters: Character[],
  relatedTalents: TalentDefinition[]
) => {
  const timestamp = new Date().toLocaleString();
  let content = `# 标签原始素材卡: ${tag.name}\n\n`;
  content += `- **导出时间**: ${timestamp}\n`;
  
  content += generateTagMaterialSection(tag, relatedCharacters, relatedTalents);
  content += `\n*由 庄园秘典 CODEX 系统自动生成数据素材*\n`;

  return downloadMarkdown(content, `tag_material_${tag.name}_${Date.now()}.md`);
};

export const exportAllTagMaterialsToMarkdown = (
  tags: Tag[],
  characters: Character[],
  talents: TalentDefinition[]
) => {
  const timestamp = new Date().toLocaleString();
  let content = `# 全量标签素材汇总导出\n\n`;
  content += `- **导出时间**: ${timestamp}\n`;
  content += `- **标签总数**: ${tags.length}\n\n`;

  content += `## 标签索引\n\n`;
  tags.forEach((tag, idx) => {
    content += `${idx + 1}. [${tag.name}](#标签-${tag.name.replace(/\s+/g, '-')})\n`;
  });
  content += `\n---\n\n`;

  tags.forEach(tag => {
    const relatedChars = characters.filter(c => 
      c.skills?.some(s => s.tags?.includes(tag.name)) || 
      c.presence?.some(p => p.tags?.includes(tag.name))
    );
    const relatedTalents = talents.filter(t => t.tags?.includes(tag.name));
    
    content += generateTagMaterialSection(tag, relatedChars, relatedTalents);
  });

  content += `\n*由 庄园秘典 CODEX 系统自动生成数据素材*\n`;

  return downloadMarkdown(content, `all_tag_materials_${Date.now()}.md`);
};
