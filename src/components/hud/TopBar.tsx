// ABOUTME: 顶部战区状态栏：战区名称/天数、四类资源、昼夜倒计时与波次预告。
const RESOURCES = [
  { key: 'stone', label: '诡石', value: 100, color: 'var(--yn-resource)' },
  { key: 'wood', label: '木材', value: 50, color: '#b08968' },
  { key: 'food', label: '食物', value: 50, color: 'var(--yn-placeable)' },
  { key: 'pop', label: '人口', value: 0, color: 'var(--yn-snow)' },
] as const;

export function TopBar() {
  return (
    <header className="yn-panel pointer-events-auto absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b px-4">
      {/* 左：战区名称与天数 */}
      <div className="flex min-w-[232px] flex-col justify-center">
        <span className="text-[20px] font-bold tracking-[0.1em] text-[var(--yn-snow)] leading-5">
          永夜战区
        </span>
        <span className="yn-num mt-0.5 text-[11px] tracking-[0.14em] text-[var(--yn-ghost-blue)]">
          DAY 01 · NIGHT
        </span>
      </div>

      {/* 中：资源 */}
      <div className="flex items-center gap-6">
        {RESOURCES.map((r) => (
          <div key={r.key} className="flex flex-col items-center">
            <span className="yn-label">{r.label}</span>
            <span className="yn-num text-[22px] font-bold leading-6" style={{ color: r.color }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* 右：倒计时与波次预告 */}
      <div className="flex min-w-[232px] flex-col items-end justify-center">
        <span className="yn-num text-[15px] font-semibold tracking-[0.12em] text-[var(--yn-warm-orange)]">
          00:00
        </span>
        <span className="yn-label mt-0.5">下一波：待部署</span>
      </div>
    </header>
  );
}
