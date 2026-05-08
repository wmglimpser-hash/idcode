import { Character } from '../constants';

// Helper to extract numeric value for sorting
export const extractValue = (valStr: string): number => {
  if (!valStr || valStr === 'N/A') return -Infinity;
  // Robust number extraction: handles "10%", "1.5s", "-5", etc.
  const match = String(valStr).match(/(-?\d+(\.\d+)?)/);
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
          value: Math.round(numericValue * 100) / 100 + '',
          numericValue: Math.round(numericValue * 1000) / 1000 // Consistent precision for grouping
        });
      }
    } else if (traitLabel) {
      const matchingItems = char.traits?.flatMap(t => t.items).filter(i => i.label === traitLabel) || [];
      
      if (matchingItems.length > 0) {
        // Track seen values for this character to avoid duplicates (e.g. "1/1")
        const seenValues = new Set<number>();
        
        matchingItems.forEach(item => {
          if (item && item.value && item.value !== 'N/A') {
            const parts = String(item.value).split(/[/／、,，]/);
            parts.forEach(part => {
              const trimmedPart = part.trim();
              if (!trimmedPart) return;
              
              const numVal = extractValue(trimmedPart);
              if (numVal !== -Infinity && !seenValues.has(numVal)) {
                seenValues.add(numVal);
                explodedData.push({
                  id: char.id,
                  name: char.name,
                  title: char.title,
                  imageUrl: char.imageUrl,
                  value: trimmedPart,
                  numericValue: Math.round(numVal * 1000) / 1000
                });
              }
            });
          }
        });
      }
    }
  });

  const sortedData = [...explodedData].sort((a, b) => {
    // Primary sort: Numeric value
    if (Math.abs(a.numericValue - b.numericValue) < 0.0001) {
      // Secondary sort: Template order or ID for stability
      const charA = characters.find(c => c.id === a.id);
      const charB = characters.find(c => c.id === b.id);
      const orderA = charA?.order ?? 999;
      const orderB = charB?.order ?? 999;
      
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    }
    
    // Sort Infinities to the bottom
    if (a.numericValue === -Infinity) return 1;
    if (b.numericValue === -Infinity) return -1;
    
    return sortOrder === 'asc' ? a.numericValue - b.numericValue : b.numericValue - a.numericValue;
  });

  const groups: { rank: number, value: string, numericValue: number, characters: any[] }[] = [];
  
  let currentRank = 1;

  sortedData.forEach((item, index) => {
    if (item.numericValue === -Infinity) return;

    // Grouping logic: Compare with previous item in sorted list
    if (index > 0 && Math.abs(item.numericValue - sortedData[index - 1].numericValue) < 0.0001) {
      const lastGroup = groups[groups.length - 1];
      // Avoid adding same character multiple times to the same group
      if (!lastGroup.characters.find(c => c.id === item.id)) {
        lastGroup.characters.push(item);
      }
    } else {
      // Dense ranking: ranks are continuous (1, 2, 2, 3...)
      currentRank = groups.length + 1;
      
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
