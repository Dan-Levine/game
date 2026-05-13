import { GameManager } from './core/GameManager';
import { installTestHooks } from '../tests/support/testHooks';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('renderCanvas not found in DOM');
}

const game = new GameManager(canvas);

void game.boot().then(() => {
  document.getElementById('loading')?.classList.add('hidden');
});

// Hooks are exposed in dev (vite dev) and any build that opts in via
// VITE_INCLUDE_TEST_HOOKS=1 (used by the e2e pipeline). Stripped from the
// shipping production bundle.
if (import.meta.env.DEV || import.meta.env.VITE_INCLUDE_TEST_HOOKS === '1') {
  installTestHooks(game);
}
