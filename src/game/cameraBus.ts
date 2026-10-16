// ABOUTME: 相机指令总线：HUD 按钮与 3D 场景之间解耦通信（聚焦点 / 视角复位 / 全局视图）。
import * as THREE from 'three';

export type CameraCommand =
  | { type: 'focus'; point: THREE.Vector3 }
  | { type: 'reset' }
  | { type: 'global' };

type Listener = (cmd: CameraCommand) => void;

const listeners = new Set<Listener>();

export const cameraBus = {
  send(cmd: CameraCommand): void {
    listeners.forEach((fn) => fn(cmd));
  },
  focus(point: THREE.Vector3): void {
    listeners.forEach((fn) => fn({ type: 'focus', point }));
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
