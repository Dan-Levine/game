import type { GameManager } from '../../src/core/GameManager';

// Debug surface attached to `window.__game__` only in non-production builds.
// The whole module is tree-shaken when `import.meta.env.MODE === 'production'`
// because main.ts gates the call to installTestHooks.

export interface TestHooks {
  loadLevel: () => Promise<void>;
  getItems: () => Array<{ id: string; typeId: string; isInTray: boolean }>;
  getItemIdsByType: (typeId: string) => string[];
  commitItemById: (itemId: string) => Promise<boolean>;
  commitFirstByType: (typeId: string) => Promise<boolean>;
  getTrayState: () => Array<{ typeId: string; itemId: string } | null>;
  getEventLog: () => Array<{ name: string; payload: unknown }>;
  clearEventLog: () => void;
  getFps: () => number;
  isReady: () => boolean;
  phase: () => string;
}

declare global {
  // eslint-disable-next-line no-var
  var __game__: TestHooks | undefined;
  interface Window {
    __game__?: TestHooks;
  }
}

export function installTestHooks(game: GameManager): TestHooks {
  const events: Array<{ name: string; payload: unknown }> = [];
  const wrapEmit = game.bus.emit.bind(game.bus);
  // Monkey-patch emit to also push into the log. Keeps the bus contract intact.
  (game.bus as unknown as { emit: typeof wrapEmit }).emit = function emit(name, payload) {
    events.push({ name: String(name), payload });
    if (events.length > 500) events.shift();
    return wrapEmit(name, payload);
  } as typeof wrapEmit;

  const hooks: TestHooks = {
    loadLevel: () => game.loadHardcodedLevel(),
    getItems: () =>
      game.items.map((i) => ({ id: i.id, typeId: i.type.id, isInTray: i.isInTray })),
    getItemIdsByType: (typeId: string) =>
      game.items
        .filter((i) => i.type.id === typeId && !i.isInTray)
        .map((i) => i.id),
    commitItemById: async (itemId: string) => {
      const item = game.items.find((i) => i.id === itemId);
      if (!item) return false;
      await game.commitItem(item);
      return true;
    },
    commitFirstByType: async (typeId: string) => {
      const item = game.items.find((i) => i.type.id === typeId && !i.isInTray);
      if (!item) return false;
      await game.commitItem(item);
      return true;
    },
    getTrayState: () =>
      game.tray.slots.map((s) =>
        s ? { typeId: s.type.id, itemId: s.id } : null,
      ),
    getEventLog: () => events.slice(),
    clearEventLog: () => {
      events.length = 0;
    },
    getFps: () => Math.round(game.engine?.getFps() ?? 0),
    isReady: () => game.phase === 'InLevel',
    phase: () => game.phase,
  };

  if (typeof window !== 'undefined') {
    (window as Window).__game__ = hooks;
  }
  return hooks;
}
