// ABOUTME: 程序化超大随机地形：simplex 海拔 + 湿度 + 峡谷 + 河流下切，
// ABOUTME: 输出高度场、湿度、地形分类与顶点颜色，供 Terrain 组件构建 BufferGeometry。
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import type { TerrainKindId } from '../../../shared/types';

export const MAP_SIZE = 1000; // 地图尺寸（世界单位）
export const SEGMENTS = 256; // 细分：256x256 格 => 257x257 顶点
export const MAX_HEIGHT = 100;
export const WATER_LEVEL = 12; // 水位：低于此值形成湖泊，河流下切到此深度

const GRID = SEGMENTS + 1;

/** 可复现的伪随机数发生器（mulberry32） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves: number, lacunarity = 2, gain = 0.5): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return (sum / norm + 1) / 2; // 归一化到 0..1
}

/** ridged 噪声：用于山脊，0..1（越接近山脊越高） */
function ridged(noise: (x: number, y: number) => number, x: number, y: number, octaves: number): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise(x * freq, y * freq));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export interface TerrainData {
  heights: Float32Array; // 逐顶点高度（世界 Y）
  moisture: Float32Array; // 逐顶点湿度 0..1
  kinds: Uint8Array; // 逐顶点地形分类（TerrainKindId 索引）
  colors: Float32Array; // 逐顶点 RGB（0..1）
  riverMask: Uint8Array; // 逐格河流标记（格点索引 j*SEGMENTS+i）
  kindList: TerrainKindId[];
  /** 世界坐标 -> 地形高度（线性插值） */
  sampleHeight: (x: number, z: number) => number;
}

const KIND_LIST: TerrainKindId[] = ['water', 'swamp', 'plain', 'forest', 'hill', 'mountain', 'snow', 'canyon'];
const KIND_INDEX: Record<TerrainKindId, number> = {
  water: 0,
  swamp: 1,
  plain: 2,
  forest: 3,
  hill: 4,
  mountain: 5,
  snow: 6,
  canyon: 7,
};

const COLORS = {
  water: new THREE.Color('#1A2A4A'),
  swamp: new THREE.Color('#2A2A3D'),
  plain: new THREE.Color('#2A3D2A'),
  forest: new THREE.Color('#1A2E1A'),
  hill: new THREE.Color('#4A3D2A'),
  mountain: new THREE.Color('#2D3548'),
  snow: new THREE.Color('#E8EDF5'),
  canyon: new THREE.Color('#0F1520'),
};

const idxAt = (i: number, j: number): number => j * GRID + i;

export function generateTerrain(seed = 20240517): TerrainData {
  const rand = mulberry32(seed);
  // 不同噪声场使用不同种子偏移，避免海拔/湿度/森林完全同构
  const elevNoise = createNoise2D(mulberry32(seed));
  const moistNoise = createNoise2D(mulberry32(seed ^ 0x9e3779b9));
  const forestNoise = createNoise2D(mulberry32(seed ^ 0x85ebca6b));
  const warpNoise = createNoise2D(mulberry32(seed ^ 0xc2b2ae35));

  const heights = new Float32Array(GRID * GRID);
  const moisture = new Float32Array(GRID * GRID);
  const kinds = new Uint8Array(GRID * GRID);
  const colors = new Float32Array(GRID * GRID * 3);
  const riverMask = new Uint8Array(SEGMENTS * SEGMENTS);
  // 下刻标记（河流/峡谷），用于禁种树木与强制峡谷着色
  const carved = new Uint8Array(GRID * GRID);

  const worldToGrid = (world: number): number => ((world + MAP_SIZE / 2) / MAP_SIZE) * SEGMENTS;

  // ---------- 1. 原始海拔：低地平原 / 丘陵 / 褶皱山脉 ----------
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const wx = (i / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
      const wz = (j / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
      const base = fbm(elevNoise, wx * 0.0012 + 100, wz * 0.0012 - 100, 5);
      const detail = fbm(elevNoise, wx * 0.008, wz * 0.008, 3) - 0.5;
      const ridge = ridged(elevNoise, wx * 0.0009 - 300, wz * 0.0009 + 200, 4);
      let h: number;
      if (base < 0.38) {
        h = (base / 0.38) * 15 + detail * 3; // 平原与盆地：0..15
      } else if (base < 0.6) {
        h = 15 + ((base - 0.38) / 0.22) * 27 + detail * 5; // 丘陵：15..42
      } else {
        const t = (base - 0.6) / 0.4;
        h = 42 + (t * 0.3 + ridge * 0.7) * 64 + detail * 4; // 山脉：42..106
      }
      heights[idxAt(i, j)] = THREE.MathUtils.clamp(h, 0, MAX_HEIGHT);
    }
  }

  // ---------- 2. 峡谷：两条低频蜿蜒曲带下切出深黑隘口 ----------
  const carve = (centerWX: number, centerWZ: number, angle: number, depth: number, width: number, meander: number, freq: number): void => {
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    const perpX = -dirZ;
    const perpZ = dirX;
    const half = MAP_SIZE * 0.62;
    for (let d = -half; d <= half; d += 2.4) {
      const m =
        warpNoise((centerWX + dirX * d) * freq, (centerWZ + dirZ * d) * freq) * meander +
        warpNoise((centerWX + dirX * d) * freq * 2.7 + 50, (centerWZ + dirZ * d) * freq * 2.7 - 50) * meander * 0.35;
      const cx = centerWX + dirX * d + perpX * m;
      const cz = centerWZ + dirZ * d + perpZ * m;
      const gc = worldToGrid(cx);
      const gr = worldToGrid(cz);
      const r = width / (MAP_SIZE / SEGMENTS);
      const i0 = Math.max(0, Math.floor(gc - r));
      const i1 = Math.min(GRID - 1, Math.ceil(gc + r));
      const j0 = Math.max(0, Math.floor(gr - r));
      const j1 = Math.min(GRID - 1, Math.ceil(gr + r));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const dist = Math.hypot(i - gc, j - gr);
          if (dist <= r) {
            const k = idxAt(i, j);
            const t = dist / r;
            const cut = depth * (1 - t * t);
            heights[k] = Math.max(2, heights[k] - cut);
            carved[k] = 1;
          }
        }
      }
    }
  };

  carve(-120, 40, 0.32, 34, 13, 70, 0.004);
  carve(160, -90, -1.15, 28, 11, 60, 0.0045);

  // ---------- 3. 河流：从山区水源沿最陡下降方向游走，下切到水位以下 ----------
  const carveRiverAt = (gi: number, gj: number, halfWidthCells: number, bed: number): void => {
    const r = halfWidthCells;
    for (let j = Math.max(0, gj - r); j <= Math.min(GRID - 1, gj + r); j++) {
      for (let i = Math.max(0, gi - r); i <= Math.min(GRID - 1, gi + r); i++) {
        const dist = Math.hypot(i - gi, j - gj);
        if (dist <= r) {
          const k = idxAt(i, j);
          const t = dist / r;
          // 仅当下切后确实位于水位以下才记为河道顶点（避免覆盖峡谷高处）
          const bedH = bed - (1 - t) * 1.5;
          if (bedH < heights[k]) {
            heights[k] = Math.min(heights[k], bedH);
            carved[k] = 1;
            if (heights[k] <= WATER_LEVEL && i < SEGMENTS && j < SEGMENTS) {
              riverMask[j * SEGMENTS + i] = 1;
            }
          }
        }
      }
    }
  };

  const spawnRiver = (): void => {
    // 在海拔 55..85 的山地区域随机选水源
    let gi = 0;
    let gj = 0;
    let found = false;
    for (let tries = 0; tries < 400 && !found; tries++) {
      gi = Math.floor(rand() * GRID);
      gj = Math.floor(rand() * GRID);
      const h = heights[idxAt(gi, gj)];
      if (h > 55 && h < 88) found = true;
    }
    if (!found) return;

    // 带惯性的最陡下降游走：偏好当前前进方向，避免在微起伏处原地打转
    let dirI = 0;
    let dirJ = 1;
    let prevI = -1;
    let prevJ = -1;
    let steps = 0;
    let belowWater = 0;
    while (steps < 1600) {
      carveRiverAt(gi, gj, 2, WATER_LEVEL - 3);
      let bestI = gi;
      let bestJ = gj;
      let bestScore = Infinity;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (di === 0 && dj === 0) continue;
          const ni = gi + di;
          const nj = gj + dj;
          if (ni < 1 || nj < 1 || ni >= GRID - 1 || nj >= GRID - 1) continue;
          if (ni === prevI && nj === prevJ) continue; // 不回头
          const nh = heights[idxAt(ni, nj)];
          // 已在湖区时仍保持方向惯性穿越；陆地上按“更低 + 同向”打分
          const inertia = -(di * dirI + dj * dirJ) * 1.6;
          const score = nh + inertia + rand() * 0.4;
          if (score < bestScore) {
            bestScore = score;
            bestI = ni;
            bestJ = nj;
          }
        }
      }
      prevI = gi;
      prevJ = gj;
      gi = bestI;
      gj = bestJ;
      // 平滑更新惯性方向
      dirI = THREE.MathUtils.lerp(dirI, gi - prevI, 0.5);
      dirJ = THREE.MathUtils.lerp(dirJ, gj - prevJ, 0.5);
      steps++;
      if (heights[idxAt(gi, gj)] <= WATER_LEVEL) {
        belowWater += 1;
        // 穿湖后继续前行一段，从湖对岸重新流出；贴边或步数耗尽则终止
        if (belowWater > 120 || gi <= 2 || gj <= 2 || gi >= GRID - 3 || gj >= GRID - 3) break;
      } else {
        belowWater = 0;
      }
    }
  };

  spawnRiver();
  spawnRiver();
  spawnRiver();

  // ---------- 4. 湿度 / 地形分类 / 顶点颜色 ----------
  const tmpColor = new THREE.Color();
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const k = idxAt(i, j);
      const wx = (i / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
      const wz = (j / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
      const h = heights[k];

      let m = fbm(moistNoise, wx * 0.003 + 400, wz * 0.003 - 400, 4);
      // 河湖附近湿度升高
      if (h < WATER_LEVEL + 6) m = Math.min(1, m + 0.28);
      moisture[k] = m;

      const forestMask = fbm(forestNoise, wx * 0.0022, wz * 0.0022, 4);
      const isCarved = carved[k] === 1;

      let kind: TerrainKindId;
      if (h <= WATER_LEVEL + 0.5) {
        kind = 'water';
      } else if (isCarved) {
        kind = 'canyon';
      } else if (h < 19) {
        // 低海拔：高湿度沼泽 / 森林团块 / 平原
        if (m > 0.62 && h < WATER_LEVEL + 4) kind = 'swamp';
        else if (forestMask > 0.62 && m > 0.45) kind = 'forest';
        else kind = 'plain';
      } else if (h < 46) {
        kind = forestMask > 0.66 ? 'forest' : 'hill';
      } else if (h < 80) {
        kind = 'mountain';
      } else {
        kind = 'snow';
      }
      kinds[k] = KIND_INDEX[kind];

      // 坡度：与相邻顶点高差，越陡越暗（峡谷壁/河岸立体感）
      const il = Math.max(0, i - 1);
      const ir = Math.min(GRID - 1, i + 1);
      const jl = Math.max(0, j - 1);
      const jr = Math.min(GRID - 1, j + 1);
      const slope =
        Math.abs(heights[idxAt(ir, j)] - heights[idxAt(il, j)]) +
        Math.abs(heights[idxAt(i, jr)] - heights[idxAt(i, jl)]);
      const shade = THREE.MathUtils.clamp(1 - slope * 0.02, 0.55, 1.08);

      tmpColor.copy(COLORS[kind]);
      // 海拔过渡带轻微混合，避免色块硬边
      if (kind === 'hill' && h < 24) tmpColor.lerp(COLORS.plain, 0.35 * (24 - h) / 8);
      if (kind === 'mountain' && h < 54) tmpColor.lerp(COLORS.hill, 0.35 * (54 - h) / 8);
      if (kind === 'snow' && h < 86) tmpColor.lerp(COLORS.mountain, 0.4 * (86 - h) / 6);
      tmpColor.multiplyScalar(shade);

      colors[k * 3] = tmpColor.r;
      colors[k * 3 + 1] = tmpColor.g;
      colors[k * 3 + 2] = tmpColor.b;
    }
  }

  // ---------- 5. 世界坐标高度采样（双线性插值，供建筑/区域贴合使用） ----------
  const sampleHeight = (x: number, z: number): number => {
    const gx = THREE.MathUtils.clamp(((x + MAP_SIZE / 2) / MAP_SIZE) * SEGMENTS, 0, SEGMENTS);
    const gz = THREE.MathUtils.clamp(((z + MAP_SIZE / 2) / MAP_SIZE) * SEGMENTS, 0, SEGMENTS);
    const i0 = Math.floor(gx);
    const j0 = Math.floor(gz);
    const i1 = Math.min(i0 + 1, SEGMENTS);
    const j1 = Math.min(j0 + 1, SEGMENTS);
    const tx = gx - i0;
    const tz = gz - j0;
    const h00 = heights[idxAt(i0, j0)];
    const h10 = heights[idxAt(i1, j0)];
    const h01 = heights[idxAt(i0, j1)];
    const h11 = heights[idxAt(i1, j1)];
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(h00, h10, tx),
      THREE.MathUtils.lerp(h01, h11, tx),
      tz,
    );
  };

  return { heights, moisture, kinds, colors, riverMask, kindList: KIND_LIST, sampleHeight };
}
