// 永夜战区 · 跨端共享类型（后续阶段扩展，阶段〇先建立枚举约定）

/** 六大功能区域 */
export type ZoneType =
  | 'command' // 指挥核心区（橙）
  | 'defense' // 城防区（蓝）
  | 'living' // 生活区（绿）
  | 'production' // 生产区（黄）
  | 'supply' // 补给区（紫）
  | 'buffer'; // 战略缓冲区（灰）

/** 地形类型 */
export type TerrainKindId =
  | 'water'
  | 'swamp'
  | 'plain'
  | 'forest'
  | 'hill'
  | 'mountain'
  | 'snow'
  | 'canyon';

/** 昼夜相位 */
export type DayPhase = 'day' | 'dusk' | 'night' | 'dawn';
