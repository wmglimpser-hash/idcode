import { Character, Tag, TalentDefinition } from '../constants';

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

  downloadMarkdown(content, `leaderboard_${role}_${traitLabel.replace(/\s+/g, '_')}_${Date.now()}.md`);
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

  downloadMarkdown(content, `character_card_${character.title}_${character.name}_${Date.now()}.md`);
};

export const exportTagMaterialToMarkdown = (
  tag: Tag,
  relatedCharacters: Character[],
  relatedTalents: TalentDefinition[]
) => {
  const timestamp = new Date().toLocaleString();
  let content = `# 标签原始素材卡: ${tag.name}\n\n`;
  content += `- **导出时间**: ${timestamp}\n`;
  content += `- **标签ID**: ${tag.id}\n`;
  content += `- **适用阵营**: ${tag.affectedRole}\n`;
  content += `- **关联角色数**: ${relatedCharacters.length}\n`;
  content += `- **关联天赋数**: ${relatedTalents.length}\n\n`;

  if (relatedCharacters.length > 0) {
    content += `## 关联角色技能详细描述\n\n`;
    relatedCharacters.forEach(char => {
      content += `### ${char.title} ${char.name}\n`;
      char.skills?.forEach(s => {
        if (s.tags?.includes(tag.name)) {
          content += `#### 外在特质: ${s.name}\n> ${s.description}\n\n`;
        }
      });
      char.presence?.forEach(p => {
        if (p.tags?.includes(tag.name)) {
          content += `#### 存在感能力: ${p.name}\n> ${p.description}\n\n`;
        }
      });
    });
  }

  if (relatedTalents.length > 0) {
    content += `## 命中的天赋描述\n\n`;
    relatedTalents.forEach(t => {
      content += `### ${t.name}\n> ${t.description}\n\n`;
    });
  }

  content += `---\n*由 庄园秘典 CODEX 系统自动生成数据素材*\n`;

  downloadMarkdown(content, `tag_material_${tag.name}_${Date.now()}.md`);
};

const downloadMarkdown = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
