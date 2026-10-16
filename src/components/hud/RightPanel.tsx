// ABOUTME: 右侧选中信息面板：未选中时显示战区总览数据。
const OVERVIEW = [
  { label: '战区总面积', value: '1.00 km²' },
  { label: '已规划区域', value: '0' },
  { label: '总建筑数', value: '0' },
  { label: '诡火等级', value: '—' },
  { label: '预计防御力', value: '0' },
] as const;

export function RightPanel() {
  return (
    <aside className="yn-panel pointer-events-auto absolute right-3 top-[68px] z-20 flex w-72 flex-col">
      <div className="flex items-center justify-between border-b border-[rgba(74,85,104,0.4)] px-3 py-2">
        <span className="text-[14px] font-bold tracking-[0.12em]">战区总览</span>
        <span className="yn-label">INTEL</span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {OVERVIEW.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-dashed border-[rgba(74,85,104,0.3)] pb-1.5"
          >
            <span className="text-[12px] text-[rgba(232,237,245,0.55)]">{row.label}</span>
            <span className="yn-num text-[13px] font-semibold text-[var(--yn-snow)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-[rgba(74,85,104,0.4)] px-3 py-2">
        <p className="text-[11px] leading-4 text-[rgba(232,237,245,0.4)]">
          点击地图区域或建筑可查看详细信息（阶段一开放）。
        </p>
      </div>
    </aside>
  );
}
