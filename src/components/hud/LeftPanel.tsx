// ABOUTME: 左侧军事部署面板：战区规划/建筑部署/部队调动/资源管理/情报中心 五个标签。
import { useState } from 'react';

const TABS = [
  { id: 'plan', label: '战区规划' },
  { id: 'build', label: '建筑部署' },
  { id: 'troop', label: '部队调动' },
  { id: 'resource', label: '资源管理' },
  { id: 'intel', label: '情报中心' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ZONE_TYPES = [
  { name: '指挥核心区', desc: '诡火所在，必须重点保护', color: 'var(--yn-zone-command)' },
  { name: '城防区', desc: '外围隘口，抵御诡物进攻', color: 'var(--yn-zone-defense)' },
  { name: '生活区', desc: '腹地，提升人口与产出', color: 'var(--yn-zone-living)' },
  { name: '生产区', desc: '靠近资源点，产出资源', color: 'var(--yn-zone-production)' },
  { name: '补给区', desc: '交通要道，仓储与运输', color: 'var(--yn-zone-supply)' },
  { name: '战略缓冲区', desc: '外围无人区，陷阱与路障', color: 'var(--yn-zone-buffer)' },
];

export function LeftPanel() {
  const [tab, setTab] = useState<TabId>('plan');

  return (
    <aside className="yn-panel pointer-events-auto absolute left-3 top-[68px] z-20 flex w-60 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[rgba(74,85,104,0.4)] px-3 py-2">
        <span className="text-[14px] font-bold tracking-[0.12em]">军事部署</span>
        <span className="yn-label">CMD</span>
      </div>

      <div className="flex flex-col gap-px border-b border-[rgba(74,85,104,0.4)] py-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-left text-[13px] transition-colors duration-100 hover:bg-[rgba(74,158,255,0.12)] ${
              tab === t.id
                ? 'border-l-2 border-[var(--yn-ghost-blue)] bg-[rgba(74,158,255,0.16)] text-[var(--yn-snow)]'
                : 'border-l-2 border-transparent text-[rgba(232,237,245,0.6)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[52vh] overflow-y-auto p-3">
        {tab === 'plan' ? (
          <div className="flex flex-col gap-2">
            <span className="yn-label">可划定区域类型</span>
            {ZONE_TYPES.map((z) => (
              <div
                key={z.name}
                className="cursor-default rounded-[2px] border border-[rgba(74,85,104,0.35)] bg-[rgba(45,53,72,0.4)] px-2.5 py-2 transition-colors duration-100 hover:brightness-110"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: z.color, boxShadow: `0 0 6px ${z.color}` }}
                  />
                  <span className="text-[13px] font-semibold">{z.name}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-[rgba(232,237,245,0.5)]">{z.desc}</p>
              </div>
            ))}
            <p className="mt-1 text-[11px] leading-4 text-[rgba(232,237,245,0.4)]">
              阶段〇：区域划分功能将于阶段一开放。
            </p>
          </div>
        ) : (
          <p className="text-[12px] leading-5 text-[rgba(232,237,245,0.45)]">
            「{TABS.find((t) => t.id === tab)?.label}」面板将在后续阶段开放。
          </p>
        )}
      </div>
    </aside>
  );
}
