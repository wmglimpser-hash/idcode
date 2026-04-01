
const nodes = [
  { "id": "0", "x": -0.01, "y": -4.09, "maxLevel": 1, "connections": ["30"] },
  { "id": "1", "x": 2.33, "y": 1.94, "maxLevel": 3, "connections": ["2", "14", "39"] },
  { "id": "2", "x": 2.76, "y": 1.09, "maxLevel": 3, "connections": ["1", "20", "34", "39"] },
  { "id": "3", "x": 0, "y": 2.13, "maxLevel": 3, "connections": ["7", "9", "19", "26", "29", "40"] },
  { "id": "4", "x": -0.01, "y": 4.3, "maxLevel": 1, "connections": ["19"] },
  { "id": "5", "x": -0.95, "y": -2.8, "maxLevel": 3, "connections": ["21", "30", "35", "36"] },
  { "id": "6", "x": 1.74, "y": -2.35, "maxLevel": 3, "connections": ["12", "27", "32"] },
  { "id": "7", "x": -0.01, "y": 1.1, "maxLevel": 3, "connections": ["3", "center", "29", "40"] },
  { "id": "8", "x": 0.96, "y": 0.1, "maxLevel": 3, "connections": ["18", "center", "34", "39"] },
  { "id": "9", "x": -0.95, "y": 2.99, "maxLevel": 3, "connections": ["3", "19", "25", "40"] },
  { "id": "10", "x": 4, "y": 0.1, "maxLevel": 1, "connections": ["20"] },
  { "id": "11", "x": -4.05, "y": 0.09, "maxLevel": 1, "connections": ["31"] },
  { "id": "12", "x": 0.86, "y": -1.54, "maxLevel": 3, "connections": ["6", "18", "27", "36", "37"] },
  { "id": "13", "x": -2.36, "y": -1.73, "maxLevel": 3, "connections": ["15", "21", "23"] },
  { "id": "14", "x": 1.73, "y": 2.55, "maxLevel": 3, "connections": ["1", "26", "29"] },
  { "id": "15", "x": -2.8, "y": -0.89, "maxLevel": 3, "connections": ["13", "23", "31", "38"] },
  { "id": "16", "x": 2.77, "y": -0.9, "maxLevel": 3, "connections": ["18", "20", "32"] },
  { "id": "17", "x": -2.36, "y": 1.93, "maxLevel": 3, "connections": ["24", "25", "28"] },
  { "id": "18", "x": 1.55, "y": -0.79, "maxLevel": 3, "connections": ["8", "12", "16", "32", "34"] },
  { "id": "19", "x": -0.01, "y": 3.14, "maxLevel": 3, "connections": ["3", "4", "9", "26"] },
  { "id": "20", "x": 2.93, "y": 0.1, "maxLevel": 3, "connections": ["2", "10", "16", "34"] },
  { "id": "21", "x": -1.76, "y": -2.35, "maxLevel": 3, "connections": ["5", "13", "35"] },
  { "id": "center", "x": -0.01, "y": 0.08, "maxLevel": 0, "connections": ["7", "8", "33", "37"] },
  { "id": "23", "x": -1.58, "y": -0.79, "maxLevel": 3, "connections": ["13", "15", "33", "35", "38"] },
  { "id": "24", "x": -2.79, "y": 1.08, "maxLevel": 3, "connections": ["17", "28", "31", "38"] },
  { "id": "25", "x": -1.77, "y": 2.55, "maxLevel": 3, "connections": ["9", "17", "40"] },
  { "id": "26", "x": 0.94, "y": 2.99, "maxLevel": 3, "connections": ["3", "14", "19", "29"] },
  { "id": "27", "x": 0.94, "y": -2.81, "maxLevel": 3, "connections": ["6", "12", "30", "36"] },
  { "id": "28", "x": -1.58, "y": 1, "maxLevel": 3, "connections": ["17", "24", "33", "38", "40"] },
  { "id": "29", "x": 0.87, "y": 1.73, "maxLevel": 3, "connections": ["3", "7", "14", "26", "39"] },
  { "id": "30", "x": -0.01, "y": -2.98, "maxLevel": 3, "connections": ["0", "5", "27", "36"] },
  { "id": "31", "x": -2.97, "y": 0.11, "maxLevel": 3, "connections": ["11", "15", "24", "38"] },
  { "id": "32", "x": 2.33, "y": -1.73, "maxLevel": 3, "connections": ["6", "16", "18"] },
  { "id": "33", "x": -0.98, "y": 0.1, "maxLevel": 3, "connections": ["center", "23", "28", "38"] },
  { "id": "34", "x": 1.93, "y": 0.1, "maxLevel": 3, "connections": ["2", "8", "18", "20", "39"] },
  { "id": "35", "x": -0.87, "y": -1.54, "maxLevel": 3, "connections": ["5", "21", "23", "36", "37"] },
  { "id": "36", "x": 0.01, "y": -1.95, "maxLevel": 3, "connections": ["5", "12", "27", "30", "35", "37"] },
  { "id": "37", "x": -0.01, "y": -0.91, "maxLevel": 3, "connections": ["12", "center", "35", "36"] },
  { "id": "38", "x": -1.96, "y": 0.1, "maxLevel": 3, "connections": ["15", "23", "24", "28", "31", "33"] },
  { "id": "39", "x": 1.56, "y": 1, "maxLevel": 3, "connections": ["1", "2", "8", "29", "34"] },
  { "id": "40", "x": -0.88, "y": 1.73, "maxLevel": 3, "connections": ["3", "7", "9", "25", "28"] }
];

const idMap = {};
nodes.forEach((node, index) => {
  idMap[node.id] = (index + 1).toString();
});

const newNodes = nodes.map(node => ({
  id: idMap[node.id],
  x: node.x,
  y: node.y,
  maxLevel: node.maxLevel,
  connections: node.connections.map(c => idMap[c]).filter(Boolean)
}));

console.log(JSON.stringify(newNodes, null, 2));
