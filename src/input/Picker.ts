import { Scene } from '@babylonjs/core';
import type { Item } from '../core/types';
import { getItemFromMesh } from '../items/ItemFactory';

export function pickTopmostSelectable(
  scene: Scene,
  screenX: number,
  screenY: number,
): Item | null {
  const pickInfo = scene.pick(screenX, screenY, (mesh) => {
    const md = (mesh.metadata ?? null) as { isItem?: boolean; item?: Item } | null;
    if (!md?.isItem) return false;
    const item = md.item;
    return !!item && item.isSelectable && !item.isInTray;
  });
  if (!pickInfo?.hit || !pickInfo.pickedMesh) return null;
  return getItemFromMesh(pickInfo.pickedMesh);
}
