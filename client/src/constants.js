// client/src/constants.js

export const CELL_SIZE = 48;

// 0: Đường đi, 1: Tường (cố định viền ngoài)
// 2: 🦸‍♂️ WhoAmI, 3: ⚔️ Skills, 4: 🏆 Projects, 5: 🌍 Social Network, 6: 📬 Contact
// Map này là template - walls và icons sẽ random mỗi lần chơi
export const BASE_MAP_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const ICON_INFO = {
  2: { emoji: "🦸‍♂️", name: "WhoAmI", type: "whoami" },
  3: { emoji: "⚔️", name: "Skills", type: "skills" },
  4: { emoji: "🏆", name: "Projects", type: "projects" },
  5: { emoji: "🌍", name: "Social", type: "social" },
  6: { emoji: "📬", name: "Contact", type: "contact" },
};

export const TOTAL_ICONS = 5;

// Tạo map ngẫu nhiên
export const generateRandomMap = () => {
  const map = BASE_MAP_MATRIX.map((row) => [...row]);

  // Lấy tất cả vị trí trống (không phải viền ngoài)
  const emptyPositions = [];
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[0].length - 1; x++) {
      emptyPositions.push({ x, y });
    }
  }

  // Shuffle positions
  const shuffled = emptyPositions.sort(() => Math.random() - 0.5);

  // Đặt tường ngẫu nhiên (8-12 walls)
  const numWalls = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numWalls && i < shuffled.length; i++) {
    const pos = shuffled[i];
    map[pos.y][pos.x] = 1;
  }

  // Đặt icons (2-6)
  let iconIndex = 0;
  for (
    let icon = 2;
    icon <= 6 && iconIndex + numWalls < shuffled.length;
    icon++
  ) {
    const pos = shuffled[numWalls + iconIndex];
    map[pos.y][pos.x] = icon;
    iconIndex++;
  }

  return map;
};

// Generate random entities positions
export const generateRandomEntities = (mapMatrix) => {
  const emptyPositions = [];
  for (let y = 1; y < mapMatrix.length - 1; y++) {
    for (let x = 1; x < mapMatrix[0].length - 1; x++) {
      if (mapMatrix[y][x] === 0) {
        emptyPositions.push({ x, y });
      }
    }
  }

  const shuffled = emptyPositions.sort(() => Math.random() - 0.5);

  return {
    playerStart: shuffled[0] || { x: 7, y: 4 },
    pets: [
      { ...shuffled[1], dir: "right" } || { x: 2, y: 1, dir: "right" },
      { ...shuffled[2], dir: "left" } || { x: 12, y: 1, dir: "left" },
    ],
    bugs: [
      { ...shuffled[3], dir: "down" } || { x: 4, y: 4, dir: "down" },
      { ...shuffled[4], dir: "up" } || { x: 10, y: 5, dir: "up" },
      { ...shuffled[5], dir: "left" } || { x: 6, y: 3, dir: "left" },
    ],
    hearts: [shuffled[6] || { x: 8, y: 2 }],
  };
};

export let mapMatrix = generateRandomMap();
