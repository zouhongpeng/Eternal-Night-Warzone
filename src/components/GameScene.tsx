// ABOUTME: 永夜战区 3D 沙盘：超大随机地形、水面、森林 + 永夜夜空（雾/月光/星点），
// ABOUTME: 上帝视角相机（60° 俯视、阻尼旋转缩放、双击平滑定位、视角复位/全局视图）。
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Terrain } from '../game/terrain/Terrain';
import { cameraBus, type CameraCommand } from '../game/cameraBus';
import { MAP_SIZE } from '../game/terrain/heightfield';

// 默认相机：斜上方 60° 俯视（水平距离 185，垂直 320 ≈ tan60°）
const DEFAULT_POSITION = new THREE.Vector3(0, 320, 185);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

type ControlsImpl = ComponentRef<typeof OrbitControls>;

function CameraRig() {
  const controlsRef = useRef<ControlsImpl>(null);
  const { camera } = useThree();

  const targetGoal = useRef(new THREE.Vector3().copy(DEFAULT_TARGET));
  const positionGoal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    return cameraBus.subscribe((cmd: CameraCommand) => {
      const controls = controlsRef.current;
      if (!controls) return;
      if (cmd.type === 'focus') {
        // 保持当前相对偏移整体平移，点击点平滑移动到屏幕中心
        const offset = camera.position.clone().sub(controls.target);
        targetGoal.current.copy(cmd.point);
        positionGoal.current = cmd.point.clone().add(offset);
      } else if (cmd.type === 'reset') {
        targetGoal.current.copy(DEFAULT_TARGET);
        positionGoal.current = DEFAULT_POSITION.clone();
      } else if (cmd.type === 'global') {
        // 全局视图：拉高远瞰
        targetGoal.current.copy(DEFAULT_TARGET);
        positionGoal.current = new THREE.Vector3(0, MAP_SIZE * 0.95, MAP_SIZE * 0.42);
      }
    });
  }, [camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.lerp(targetGoal.current, 0.12);
    const goal = positionGoal.current;
    if (goal) {
      camera.position.lerp(goal, 0.1);
      if (camera.position.distanceTo(goal) < 0.5) {
        positionGoal.current = null;
      }
    }
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={120}
      maxDistance={900}
      minPolarAngle={0.12}
      maxPolarAngle={THREE.MathUtils.degToRad(86)}
      target={[0, 0, 0]}
    />
  );
}

/** 永夜星点：高空球壳内侧随机分布，不受雾影响 */
function Stars() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 950 + Math.random() * 250;
      const theta = Math.random() * Math.PI * 2;
      // 只在上半球
      const phi = Math.random() * Math.PI * 0.42;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 60;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#cfd8ff"
        size={1.6}
        sizeAttenuation
        transparent
        opacity={0.7}
        fog={false}
        depthWrite={false}
      />
    </points>
  );
}

export function GameScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 1, far: 2400, position: DEFAULT_POSITION.toArray() }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#0A0A14');
        scene.background = new THREE.Color('#0A0A14');
      }}
    >
      {/* 永夜暗紫指数雾：边缘地形被夜色吞没 */}
      <fogExp2 attach="fog" args={['#141126', 0.0017]} />

      {/* 微弱环境光 + 冷蓝月光 + 暗紫半球光 */}
      <ambientLight color="#3a4a66" intensity={0.55} />
      <hemisphereLight args={['#2A1F3D', '#0A0E1A', 0.4]} />
      <directionalLight color="#b8cdf0" intensity={0.9} position={[320, 480, 180]} />

      <CameraRig />
      <Stars />
      <Terrain onFocus={(p) => cameraBus.focus(p)} />
    </Canvas>
  );
}
