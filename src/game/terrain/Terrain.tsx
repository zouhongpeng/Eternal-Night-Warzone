// ABOUTME: 超大随机地形的 Three.js 呈现：顶点色地形 + 半透明水面 + 实例化森林，
// ABOUTME: 双击地形/水面上报聚焦点供相机平滑定位。
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  generateTerrain,
  MAP_SIZE,
  SEGMENTS,
  WATER_LEVEL,
  type TerrainData,
} from './heightfield';
import { Trees, type TreeSpot } from './Trees';

interface TerrainProps {
  seed?: number;
  onFocus?: (point: THREE.Vector3) => void;
}

const GRID = SEGMENTS + 1;
const TREE_MAX = 200;

/** 可复现随机（与地形同种子派生） */
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

function buildGeometry(data: TerrainData): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, SEGMENTS, SEGMENTS);
  geo.rotateX(-Math.PI / 2);
  // PlaneGeometry 顶点排列：j 行从上到下；rotateX(-90°) 后 z 从 -size/2 到 +size/2，
  // 与高度场 idxAt(i, j) 的世界坐标排列一致。
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const k = j * GRID + i;
      pos.setY(k, data.heights[j * GRID + i]);
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function pickTreeSpots(data: TerrainData, seed: number): TreeSpot[] {
  const rand = mulberry32(seed ^ 0x517ee);
  const forestKind = data.kindList.indexOf('forest');
  const spots: TreeSpot[] = [];
  for (let tries = 0; tries < 20000 && spots.length < TREE_MAX; tries++) {
    const i = Math.floor(rand() * GRID);
    const j = Math.floor(rand() * GRID);
    const k = j * GRID + i;
    if (data.kinds[k] !== forestKind) continue;
    const h = data.heights[k];
    if (h <= WATER_LEVEL + 1 || h > 48) continue;
    if (i < 2 || j < 2 || i > GRID - 3 || j > GRID - 3) continue;
    const wx = (i / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
    const wz = (j / SEGMENTS) * MAP_SIZE - MAP_SIZE / 2;
    spots.push({
      x: wx + (rand() - 0.5) * 3,
      z: wz + (rand() - 0.5) * 3,
      y: data.sampleHeight(wx, wz),
      scale: 0.8 + rand() * 0.7,
      rotation: rand() * Math.PI * 2,
    });
  }
  return spots;
}

export function Terrain({ seed = 20240517, onFocus }: TerrainProps) {
  const data = useMemo(() => generateTerrain(seed), [seed]);
  const geometry = useMemo(() => buildGeometry(data), [data]);
  const treeSpots = useMemo(() => pickTreeSpots(data, seed), [data, seed]);

  const terrainMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.98,
        metalness: 0,
        flatShading: false,
      }),
    [],
  );
  const waterMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1A2A4A'),
        transparent: true,
        opacity: 0.86,
        roughness: 0.25,
        metalness: 0.35,
      }),
    [],
  );

  return (
    <group
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFocus?.(e.point.clone());
      }}
    >
      {/* 地形主体 */}
      <mesh geometry={geometry} material={terrainMaterial} receiveShadow />

      {/* 河流 / 湖泊水面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, 0]} material={waterMaterial}>
        <planeGeometry args={[MAP_SIZE, MAP_SIZE, 1, 1]} />
      </mesh>

      {/* 森林（200 棵以内，InstancedMesh） */}
      <Trees spots={treeSpots} />
    </group>
  );
}
