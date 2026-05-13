import { describe, it, expect } from 'vitest';
import {
  getAllAssets,
  getAssetByTypeId,
  getKitchenStarterTypes,
} from '../../src/items/AssetRegistry';

describe('AssetRegistry', () => {
  it('exposes three Phase-1 kitchen starter types', () => {
    const types = getKitchenStarterTypes();
    expect(types).toHaveLength(3);
    expect(types.map((t) => t.id).sort()).toEqual([
      'kitchen_apple',
      'kitchen_donut',
      'kitchen_mug',
    ]);
  });

  it('resolves mesh + icon URLs under the base URL', () => {
    const apple = getAssetByTypeId('kitchen_apple');
    expect(apple).toBeDefined();
    // happy-dom defaults BASE_URL to '/' in tests.
    expect(apple!.type.meshUrl).toMatch(/\/assets\/items\/kitchen\/apple\.glb$/);
    expect(apple!.type.iconUrl).toMatch(/\/assets\/icons\/kitchen\/apple\.png$/);
  });

  it('returns undefined for unknown ids', () => {
    expect(getAssetByTypeId('garage_wrench')).toBeUndefined();
  });

  it('all entries have non-zero base mass and a known collider shape', () => {
    for (const a of getAllAssets()) {
      expect(a.type.baseMass).toBeGreaterThan(0);
      expect(['BOX', 'CAPSULE', 'SPHERE', 'CONVEX_HULL']).toContain(
        a.type.colliderShape,
      );
    }
  });
});
