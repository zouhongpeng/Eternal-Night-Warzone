// ABOUTME: 左下角战略小地图（阶段〇为占位框；后续阶段绘制地形轮廓/诡火/区域/来袭箭头）。
export function Minimap() {
  return (
    <div className="yn-panel pointer-events-auto absolute bottom-[68px] left-3 z-20 h-[150px] w-[200px] p-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold tracking-[0.12em]">战略小地图</span>
        <span className="yn-label">MAP</span>
      </div>
      <div className="mt-1.5 flex h-[104px] items-center justify-center rounded-[2px] border border-dashed border-[rgba(74,85,104,0.5)] bg-[rgba(10,14,26,0.6)]">
        <span className="text-[11px] text-[rgba(232,237,245,0.35)]">地形缩略图 · 阶段三接入</span>
      </div>
    </div>
  );
}
