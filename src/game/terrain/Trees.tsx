// ABOUTME: 森林实例化渲染：树干（圆柱）+ 树冠（球体），200 棵以内，使用 InstancedMesh。
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface TreeSpot {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TreesProps {
  spots: TreeSpot[];
}

const TRUNK_COLOR = '#3a2c1d';
const CROWN_COLOR = '#16280f';

export function Trees({ spots }: TreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.28, 0.45, 3.2, 6), []);
  const crownGeo = useMemo(() => new THREE.SphereGeometry(1.9, 7, 6), []);
  const trunkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: TRUNK_COLOR, roughness: 0.95, metalness: 0 }),
    [],
  );
  const crownMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CROWN_COLOR, roughness: 1, metalness: 0 }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    spots.forEach((spot, i) => {
      // 树干
      dummy.position.set(spot.x, spot.y + 1.6 * spot.scale, spot.z);
      dummy.rotation.set(0, spot.rotation, 0);
      dummy.scale.setScalar(spot.scale);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);

      // 树冠
      dummy.position.set(spot.x, spot.y + 4.1 * spot.scale, spot.z);
      dummy.updateMatrix();
      crownRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (trunkRef.current) {
      trunkRef.current.instanceMatrix.needsUpdate = true;
      trunkRef.current.computeBoundingSphere();
    }
    if (crownRef.current) {
      crownRef.current.instanceMatrix.needsUpdate = true;
      crownRef.current.computeBoundingSphere();
    }
  }, [spots]);

  if (spots.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, trunkMat, spots.length]}
        castShadow={false}
        receiveShadow={false}
      />
      <instancedMesh
        ref={crownRef}
        args={[crownGeo, crownMat, spots.length]}
        castShadow={false}
        receiveShadow={false}
      />
    </group>
  );
}
