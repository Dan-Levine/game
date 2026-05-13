import { Scene, Ray, Vector3, Camera } from '@babylonjs/core';
import type { Item } from '../core/types';

// Rolling 1/3-per-frame visibility check. For each item, cast a few rays from
// the camera to sample points on the item's bounding box; the item is
// selectable iff at least one ray's first hit is the item itself.

export class SelectabilityScheduler {
  private scene: Scene;
  private camera: Camera;
  private items: Item[] = [];
  private cursor = 0;
  private observerHandle: { remove: () => void } | null = null;

  constructor(scene: Scene, camera: Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  setItems(items: Item[]): void {
    this.items = items.filter((i) => !i.isInTray);
    this.cursor = 0;
  }

  start(): void {
    if (this.observerHandle) return;
    const obs = this.scene.onBeforeRenderObservable.add(() => this.tick());
    this.observerHandle = {
      remove: () => this.scene.onBeforeRenderObservable.remove(obs),
    };
  }

  stop(): void {
    this.observerHandle?.remove();
    this.observerHandle = null;
  }

  private tick(): void {
    if (this.items.length === 0) return;
    const batchSize = Math.max(1, Math.ceil(this.items.length / 3));
    for (let i = 0; i < batchSize; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.items.length;
      const item = this.items[idx];
      if (!item || item.isInTray) continue;
      item.isSelectable = this.checkVisibility(item);
    }
  }

  private checkVisibility(item: Item): boolean {
    const bb = item.mesh.getBoundingInfo().boundingBox;
    const cameraPos = this.camera.globalPosition;
    const samples = [
      bb.centerWorld,
      bb.maximumWorld,
      bb.minimumWorld,
      new Vector3(bb.maximumWorld.x, bb.centerWorld.y, bb.centerWorld.z),
      new Vector3(bb.minimumWorld.x, bb.centerWorld.y, bb.centerWorld.z),
      new Vector3(bb.centerWorld.x, bb.maximumWorld.y, bb.centerWorld.z),
      new Vector3(bb.centerWorld.x, bb.centerWorld.y, bb.maximumWorld.z),
    ];
    for (const target of samples) {
      const direction = target.subtract(cameraPos);
      const length = direction.length();
      if (length < 1e-4) continue;
      direction.normalize();
      const ray = new Ray(cameraPos, direction, length + 0.05);
      const hit = this.scene.pickWithRay(ray, (m) => {
        const md = (m.metadata ?? null) as { isItem?: boolean } | null;
        return !!md?.isItem;
      });
      if (hit?.pickedMesh === item.mesh) {
        return true;
      }
    }
    return false;
  }
}
