import type { ColliderShape, ItemType } from '../core/types';

// In Phase 1 we ship with three Kenney Food Kit items wired through the
// registry. GLBs live under public/assets/items/<pack>/<id>.glb and icons
// under public/assets/icons/<pack>/<id>.png. URLs respect import.meta.env.BASE_URL
// so they resolve correctly under both GitHub Pages (/<repo>/) and Capacitor
// (./).

interface RegistryEntry {
  shortId: string;
  displayName: string;
  pack: string;
  baseMass: number;
  colliderShape: ColliderShape;
  // Tint as a "primitive fallback" so the game runs even when GLBs aren't
  // bundled (CI without asset checkout, first dev runs).
  fallbackColor: [number, number, number];
  fallbackPrimitive: 'box' | 'sphere' | 'cylinder' | 'torus' | 'capsule';
}

const ENTRIES: RegistryEntry[] = [
  {
    shortId: 'apple',
    displayName: 'Apple',
    pack: 'kitchen',
    baseMass: 0.5,
    colliderShape: 'SPHERE',
    fallbackColor: [0.9, 0.25, 0.25],
    fallbackPrimitive: 'sphere',
  },
  {
    shortId: 'mug',
    displayName: 'Mug',
    pack: 'kitchen',
    baseMass: 0.6,
    colliderShape: 'CAPSULE',
    fallbackColor: [0.95, 0.95, 0.95],
    fallbackPrimitive: 'cylinder',
  },
  {
    shortId: 'donut',
    displayName: 'Donut',
    pack: 'kitchen',
    baseMass: 0.4,
    colliderShape: 'BOX',
    fallbackColor: [0.95, 0.7, 0.4],
    fallbackPrimitive: 'torus',
  },
];

export interface ResolvedAsset {
  type: ItemType;
  fallbackColor: [number, number, number];
  fallbackPrimitive: 'box' | 'sphere' | 'cylinder' | 'torus' | 'capsule';
}

function base(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) {
    const b = import.meta.env.BASE_URL;
    return b.endsWith('/') ? b : `${b}/`;
  }
  return '/';
}

function buildType(entry: RegistryEntry): ItemType {
  const id = `${entry.pack}_${entry.shortId}`;
  return {
    id,
    displayName: entry.displayName,
    meshUrl: `${base()}assets/items/${entry.pack}/${entry.shortId}.glb`,
    iconUrl: `${base()}assets/icons/${entry.pack}/${entry.shortId}.png`,
    baseMass: entry.baseMass,
    colliderShape: entry.colliderShape,
    pack: entry.pack,
  };
}

const REGISTRY: ResolvedAsset[] = ENTRIES.map((entry) => ({
  type: buildType(entry),
  fallbackColor: entry.fallbackColor,
  fallbackPrimitive: entry.fallbackPrimitive,
}));

export function getAllAssets(): ResolvedAsset[] {
  return REGISTRY.slice();
}

export function getAssetByTypeId(id: string): ResolvedAsset | undefined {
  return REGISTRY.find((a) => a.type.id === id);
}

export function getKitchenStarterTypes(): ItemType[] {
  return REGISTRY.filter((a) => a.type.pack === 'kitchen').map((a) => a.type);
}
