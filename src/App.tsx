import { GameScene } from './components/GameScene';
import { Hud } from './components/Hud';

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--yn-abyss)]">
      <GameScene />
      <Hud />
    </div>
  );
}
