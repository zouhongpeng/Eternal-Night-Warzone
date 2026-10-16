// ABOUTME: HUD 总装：顶部状态栏 / 左侧部署面板 / 右侧信息面板 / 底部操作栏 / 左下小地图。
import { TopBar } from './hud/TopBar';
import { LeftPanel } from './hud/LeftPanel';
import { RightPanel } from './hud/RightPanel';
import { BottomBar } from './hud/BottomBar';
import { Minimap } from './hud/Minimap';

export function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <TopBar />
      <LeftPanel />
      <RightPanel />
      <Minimap />
      <BottomBar />
    </div>
  );
}
