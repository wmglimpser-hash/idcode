
const nodes = [
  { "id": "1", "x": -0.01, "y": -4.09, "maxLevel": 1, "connections": ["31"] },
  { "id": "2", "x": 2.33, "y": 1.94, "maxLevel": 3, "connections": ["3", "15", "40"] },
  { "id": "3", "x": 2.76, "y": 1.09, "maxLevel": 3, "connections": ["2", "21", "35", "40"] },
  { "id": "4", "x": 0, "y": 2.13, "maxLevel": 3, "connections": ["8", "10", "20", "27", "30", "41"] },
  { "id": "5", "x": -0.01, "y": 4.3, "maxLevel": 1, "connections": ["20"] },
  { "id": "6", "x": -0.95, "y": -2.8, "maxLevel": 3, "connections": ["22", "31", "36", "37"] },
  { "id": "7", "x": 1.74, "y": -2.35, "maxLevel": 3, "connections": ["13", "28", "33"] },
  { "id": "8", "x": -0.01, "y": 1.1, "maxLevel": 3, "connections": ["4", "center", "30", "41"] },
  { "id": "9", "x": 0.96, "y": 0.1, "maxLevel": 3, "connections": ["19", "center", "35", "40"] },
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
  { "id": "center", "x": -0.01, "y": 0.08, "maxLevel": 0, "connections": ["8", "9", "34", "38"] },
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
  { "id": "34", "x": -0.98, "y": 0.1, "maxLevel": 3, "connections": ["center", "24", "29", "39"] },
  { "id": "35", "x": 1.93, "y": 0.1, "maxLevel": 3, "connections": ["3", "9", "19", "21", "40"] },
  { "id": "36", "x": -0.87, "y": -1.54, "maxLevel": 3, "connections": ["6", "22", "24", "37", "38"] },
  { "id": "37", "x": 0.01, "y": -1.95, "maxLevel": 3, "connections": ["6", "13", "28", "31", "36", "38"] },
  { "id": "38", "x": -0.01, "y": -0.91, "maxLevel": 3, "connections": ["13", "center", "36", "37"] },
  { "id": "39", "x": -1.96, "y": 0.1, "maxLevel": 3, "connections": ["16", "24", "25", "29", "32", "34"] },
  { "id": "40", "x": 1.56, "y": 1, "maxLevel": 3, "connections": ["2", "3", "9", "30", "35"] },
  { "id": "41", "x": -0.88, "y": 1.73, "maxLevel": 3, "connections": ["4", "8", "10", "26", "29"] }
];

const findCounterpart = (node) => {
  // Mirror across Y axis (x -> -x)
  const targetX = -node.x;
  const targetY = node.y;
  return nodes.find(n => Math.abs(n.x - targetX) < 0.1 && Math.abs(n.y - targetY) < 0.1);
};

nodes.forEach(node => {
  if (node.id === 'center') return;
  const counterpart = findCounterpart(node);
  if (!counterpart) {
    console.log(`Node ${node.id} (${node.x}, ${node.y}) has no counterpart!`);
  }
});
