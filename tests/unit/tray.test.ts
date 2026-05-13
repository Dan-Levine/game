import { describe, it, expect, beforeEach } from 'vitest';
import { Tray } from '../../src/tray/Tray';
import { EventBus } from '../../src/core/EventBus';
import type { Item, ItemType } from '../../src/core/types';

function fakeType(id: string): ItemType {
  return {
    id,
    displayName: id,
    meshUrl: '',
    iconUrl: '',
    baseMass: 1,
    colliderShape: 'BOX',
    pack: 'kitchen',
  };
}

function fakeItem(type: ItemType, id = `${type.id}-${Math.random()}`): Item {
  return {
    id,
    type,
    size: 1,
    // Unused by tray logic.
    mesh: {} as Item['mesh'],
    body: {} as Item['body'],
    isSelectable: true,
    isInTray: false,
  };
}

describe('Tray', () => {
  const APPLE = fakeType('apple');
  const MUG = fakeType('mug');
  const DONUT = fakeType('donut');

  let bus: EventBus;
  let matches: Array<{ type: ItemType; count: number }>;
  let trayFulls: number;

  beforeEach(() => {
    bus = new EventBus();
    matches = [];
    trayFulls = 0;
    bus.on('match_cleared', (p) => matches.push(p));
    bus.on('tray_full', () => {
      trayFulls++;
    });
  });

  it('starts empty at the requested capacity', () => {
    const tray = new Tray({ capacity: 7, bus });
    expect(tray.capacity).toBe(7);
    expect(tray.slots).toHaveLength(7);
    expect(tray.slots.every((s) => s === null)).toBe(true);
    expect(tray.isFull()).toBe(false);
  });

  it('placeAt fills the slot and marks the item', () => {
    const tray = new Tray({ capacity: 7, bus });
    const it = fakeItem(APPLE);
    tray.placeAt(0, it);
    expect(tray.slots[0]).toBe(it);
    expect(it.isInTray).toBe(true);
  });

  it('clears a 3-of-a-kind regardless of slot positions, then slides left', () => {
    const tray = new Tray({ capacity: 7, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.placeAt(1, fakeItem(MUG));
    tray.placeAt(2, fakeItem(APPLE));
    tray.placeAt(3, fakeItem(MUG));
    tray.placeAt(4, fakeItem(APPLE));
    // After 3rd APPLE: matches and slides; MUG×2 remain at indices 0,1.
    expect(matches).toHaveLength(1);
    expect(matches[0]!.type).toBe(APPLE);
    expect(matches[0]!.count).toBe(3);
    expect(tray.count()).toBe(2);
    expect(tray.slots[0]!.type).toBe(MUG);
    expect(tray.slots[1]!.type).toBe(MUG);
    expect(tray.slots[2]).toBeNull();
  });

  it('does not clear with only 2 of a kind', () => {
    const tray = new Tray({ capacity: 7, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.placeAt(1, fakeItem(APPLE));
    expect(matches).toHaveLength(0);
    expect(tray.count()).toBe(2);
  });

  it('clears multiple match types in sequence when both threshold', () => {
    const tray = new Tray({ capacity: 7, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.placeAt(1, fakeItem(MUG));
    tray.placeAt(2, fakeItem(APPLE));
    tray.placeAt(3, fakeItem(MUG));
    tray.placeAt(4, fakeItem(APPLE));
    // First APPLE clear → APPLE match.
    expect(matches.map((m) => m.type.id)).toEqual(['apple']);
    tray.placeAt(2, fakeItem(MUG));
    // Now MUG×3 → MUG match.
    expect(matches.map((m) => m.type.id)).toEqual(['apple', 'mug']);
    expect(tray.count()).toBe(0);
  });

  it('a fully-filled but matchable run clears rather than staying full', () => {
    const tray = new Tray({ capacity: 7, bus });
    const types = [APPLE, MUG, DONUT, APPLE, MUG, DONUT, APPLE];
    types.forEach((t, i) => tray.placeAt(i, fakeItem(t)));
    // APPLE×3 matched and cleared on the third place; tray no longer full.
    expect(tray.isFull()).toBe(false);
    expect(matches.map((m) => m.type.id)).toEqual(['apple']);
    expect(tray.count()).toBe(4);
  });

  it('emits tray_full with canMatch=false on an unmatchable full tray', () => {
    const tray = new Tray({ capacity: 4, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.placeAt(1, fakeItem(MUG));
    tray.placeAt(2, fakeItem(DONUT));
    tray.placeAt(3, fakeItem(APPLE));
    expect(trayFulls).toBe(1);
    expect(tray.isFull()).toBe(true);
  });

  it('hasMatchableTriple', () => {
    const tray = new Tray({ capacity: 7, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.placeAt(1, fakeItem(APPLE));
    expect(tray.hasMatchableTriple()).toBe(false);
    // Direct mutate to test detection without triggering checkForMatches.
    tray.slots[2] = fakeItem(APPLE);
    expect(tray.hasMatchableTriple()).toBe(true);
  });

  it('expandToCapacity adds null slots', () => {
    const tray = new Tray({ capacity: 7, bus });
    tray.placeAt(0, fakeItem(APPLE));
    tray.expandToCapacity(8);
    expect(tray.capacity).toBe(8);
    expect(tray.slots).toHaveLength(8);
    expect(tray.slots[0]!.type).toBe(APPLE);
    expect(tray.slots[7]).toBeNull();
  });

  it('removeLastFilled returns the last item and slides', () => {
    const tray = new Tray({ capacity: 7, bus });
    const a = fakeItem(APPLE);
    const m = fakeItem(MUG);
    tray.placeAt(0, a);
    tray.placeAt(1, m);
    const removed = tray.removeLastFilled();
    expect(removed).toBe(m);
    expect(removed!.isInTray).toBe(false);
    expect(tray.count()).toBe(1);
    expect(tray.slots[0]).toBe(a);
  });

  it('removeLastFilled returns null on an empty tray', () => {
    const tray = new Tray({ capacity: 7, bus });
    expect(tray.removeLastFilled()).toBeNull();
  });
});
