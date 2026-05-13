import { Scene, Vector3 } from '@babylonjs/core';
import type { Item, ItemType } from '../core/types';
import { createItem } from './ItemFactory';
import { random, randomInRange } from '../utils/rng';
import { shuffleInPlace } from '../utils/sampleN';

export interface DropParams {
  scene: Scene;
  distribution: Map<ItemType, number>;
  containerWidth: number;
  containerDepth: number;
  dropHeight: number;
  dropDurationSeconds: number;
  sizeMixSkew?: number;
}

export interface DropResult {
  items: Item[];
}

// Spawn all items over `dropDurationSeconds`, then wait for the pile to settle
// (kinetic energy < threshold) or 3s, whichever comes first.
export async function dropAndSettle(params: DropParams): Promise<DropResult> {
  const {
    scene,
    distribution,
    containerWidth,
    containerDepth,
    dropHeight,
    dropDurationSeconds,
    sizeMixSkew = 0.5,
  } = params;

  const sequence: ItemType[] = [];
  for (const [type, count] of distribution) {
    for (let i = 0; i < count; i++) sequence.push(type);
  }
  shuffleInPlace(sequence);

  const totalMs = dropDurationSeconds * 1000;
  const stepMs = sequence.length > 0 ? totalMs / sequence.length : 0;

  const items: Item[] = [];
  const spawnHalfWidth = Math.max(0.3, containerWidth / 2 - 0.6);
  const spawnHalfDepth = Math.max(0.3, containerDepth / 2 - 0.6);

  for (let i = 0; i < sequence.length; i++) {
    const type = sequence[i]!;
    const size = sampleSize(sizeMixSkew);
    const position = new Vector3(
      randomInRange(-spawnHalfWidth, spawnHalfWidth),
      dropHeight + randomInRange(-0.2, 0.2),
      randomInRange(-spawnHalfDepth, spawnHalfDepth),
    );
    const initialVelocity = new Vector3(
      randomInRange(-0.3, 0.3),
      0,
      randomInRange(-0.3, 0.3),
    );
    const item = await createItem(scene, type, { position, size, initialVelocity });
    items.push(item);
    if (stepMs > 0 && i < sequence.length - 1) {
      await delay(stepMs);
    }
  }

  await settle(items, 3000);
  return { items };
}

function sampleSize(skew: number): number {
  // skew=0 -> all small (0.6), skew=1 -> all large (1.4), default 0.5 ~ 1.0
  const r = random();
  const min = 0.7;
  const max = 1.3;
  // bias by skew: at skew=0, weight towards min; at skew=1, weight towards max.
  const t = Math.pow(r, 1 + (0.5 - skew) * 2);
  return min + t * (max - min);
}

async function settle(items: Item[], maxMs: number): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < maxMs) {
    await delay(120);
    const ke = totalKineticEnergy(items);
    if (ke < 0.05) return;
  }
}

function totalKineticEnergy(items: Item[]): number {
  let ke = 0;
  for (const it of items) {
    const v = it.body.body.getLinearVelocity();
    if (!v) continue;
    const speedSq = v.x * v.x + v.y * v.y + v.z * v.z;
    ke += 0.5 * it.type.baseMass * speedSq;
  }
  return ke;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
