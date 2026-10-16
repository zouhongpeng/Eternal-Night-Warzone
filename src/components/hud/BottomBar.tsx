// ABOUTME: 底部操作栏：规划/建造/拆除模式、加速/暂停、视角复位、全局视图。
import { cameraBus } from '../../game/cameraBus';

const MODE_BUTTONS = [
  { id: 'zone', label: '区域规划' },
  { id: 'build', label: '建造' },
  { id: 'demolish', label: '拆除' },
] as const;

const FLOW_BUTTONS = [
  { id: 'speed', label: '加速' },
  { id: 'pause', label: '暂停' },
] as const;

const VIEW_BUTTONS = [
  { id: 'reset', label: '视角复位' },
  { id: 'global', label: '全局视图' },
] as const;

type ButtonDef = { id: string; label: string };

function ActionButton({ def, active = false, onClick }: { def: ButtonDef; active?: boolean; onClick?: () => void }) {
  return (
    <button
      key={def.id}
      type="button"
      onClick={onClick}
      className={`h-7 rounded-[2px] border px-3 text-[12px] tracking-[0.06em] transition-all duration-100 hover:brightness-110 ${
        active
          ? 'border-[var(--yn-ghost-blue)] bg-[rgba(74,158,255,0.22)] text-[var(--yn-snow)]'
          : 'border-[rgba(74,85,104,0.6)] bg-[rgba(26,31,46,0.7)] text-[rgba(232,237,245,0.72)]'
      }`}
    >
      {def.label}
    </button>
  );
}

export function BottomBar() {
  return (
    <footer className="yn-panel pointer-events-auto absolute bottom-3 left-1/2 z-20 flex h-12 -translate-x-1/2 items-center gap-2 px-3">
      <span className="yn-label mr-1 hidden md:inline">操作</span>
      {MODE_BUTTONS.map((b) => (
        <ActionButton key={b.id} def={b} />
      ))}
      <span className="mx-1 h-5 w-px bg-[rgba(74,85,104,0.5)]" />
      {FLOW_BUTTONS.map((b) => (
        <ActionButton key={b.id} def={b} />
      ))}
      <span className="mx-1 h-5 w-px bg-[rgba(74,85,104,0.5)]" />
      <ActionButton def={VIEW_BUTTONS[0]} onClick={() => cameraBus.send({ type: 'reset' })} />
      <ActionButton def={VIEW_BUTTONS[1]} onClick={() => cameraBus.send({ type: 'global' })} />
    </footer>
  );
}
