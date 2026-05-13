import { Scene, Vector3, HavokPlugin } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

// The Havok WASM is copied from node_modules into /public/havok/ by the
// `predev` / `prebuild` npm scripts. It's served as a static asset and
// referenced through BASE_URL so it resolves under GitHub Pages (/<repo>/)
// and Capacitor's `capacitor://localhost` (./) alike.

let cachedHavok: Awaited<ReturnType<typeof HavokPhysics>> | null = null;

function wasmUrl(): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}havok/HavokPhysics.wasm`;
}

export async function enablePhysics(scene: Scene): Promise<HavokPlugin> {
  if (!cachedHavok) {
    cachedHavok = await HavokPhysics({
      locateFile: () => wasmUrl(),
    });
  }
  const plugin = new HavokPlugin(true, cachedHavok);
  scene.enablePhysics(new Vector3(0, -9.81, 0), plugin);
  return plugin;
}
