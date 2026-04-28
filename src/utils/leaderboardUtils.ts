import { Character } from '../constants';

// Helper to extract numeric value for sorting
export const extractValue = (valStr: string): number => {
  if (!valStr || valStr === 'N/A') return -Infinity;
  const match = valStr.match(/(-?\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : -Infinity;
};

export const generateLeaderboardData = (
  characters: Character[],
  role: 'Survivor' | 'Hunter',
  traitLabel: string,
  sortOrder: 'asc' | 'desc',
  customMetricConfig?: { traitLabels: string[] }
) => {
  const factionCharacters = characters.filter(c => c.role === role && !c.id.startsWith('base_'));
  const explodedData: any[] = [];

  factionCharacters.forEach(char => {
    if (customMetricConfig) {
      const charTraits = char.traits?.flatMap(t => t.items) || [];
      const values = customMetricConfig.traitLabels.map(label => {
        const item = charTraits.find(i => i.label === label);
        return item ? extractValue(item.value) : 0;
      });
      
      const validValues = values.filter(v => v !== -Infinity);
      if (validValues.length > 0) {
        const numericValue = validValues.reduce((sum, v) => sum + v, 0);
        explodedData.push({
          id: char.id,
          name: char.name,
          title: char.title,
          imageUrl: char.imageUrl,
          value: numericValue.toString(),
          numericValue
        });
      }
    } else if (traitLabel) {
      const matchingItems = char.traits?.flatMap(t => t.items).filter(i => i.label === traitLabel) || [];
      
      if (matchingItems.length > 0) {
        matchingItems.forEach(item => {
          if (item && item.value && item.value !== 'N/A') {
            const parts = String(item.value).split(/[/／、,，]/);
            parts.forEach(part => {
              const trimmedPart = part.trim();
              if (!trimmedPart) return;
              
              const numVal = extractValue(trimmedPart);
              if (numVal !== -Infinity) {
                explodedData.push({
                  id: char.id,
                  name: char.name,
                  title: char.title,
                  imageUrl: char.imageUrl,
                  value: trimmedPart,
                  numericValue: numVal
                });
              }
            });
          }
        });
      }
    }
  });

  const sortedData = explodedData.sort((a, b) => {
    if (a.numericValue === b.numericValue) {
      const charA = characters.find(c => c.id === a.id);
      const charB = characters.find(c => c.id === b.id);
      const orderA = charA?.order ?? 999;
      const orderB = charB?.order ?? 999;
      
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    }
    if (a.numericValue === -Infinity) return 1;
    if (b.numericValue === -Infinity) return -1;
    
    return sortOrder === 'asc' ? a.numericValue - b.numericValue : b.numericValue - a.numericValue;
  });

  const groups: { rank: number, value: string, numericValue: number, characters: any[] }[] = [];
  
  let currentRank = 1;
  sortedData.forEach((item, index) => {
    if (item.value === 'N/A' || item.numericValue === -Infinity) {
      return;
    }

    if (index > 0 && item.numericValue === sortedData[index - 1].numericValue) {
      const lastGroup = groups[groups.length - 1];
      lastGroup.characters.push(item);
    } else {
      if (index > 0) {
        currentRank += groups[groups.length - 1].characters.length;
      }
      groups.push({
        rank: currentRank,
        value: item.value,
        numericValue: item.numericValue,
        characters: [item]
      });
    }
  });

  return { sortedData, groups };
};
