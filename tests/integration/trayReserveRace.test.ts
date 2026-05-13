import { describe, it, expect, beforeEach } from 'vitest';
import { Tray } from '../../src/tray/Tray';
import { EventBus } from '../../src/core/EventBus';
import type { Item, ItemType } from '../../src/core/types';

// Regression for PR feedback (P1): two rapid commits could capture the same
// slotIndex across an arc animation, causing the second to throw at placeAt.
// The fix splits placeAt into reserveSlot + confirmArrival.

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

function fakeItem(type: ItemType, id = `${type.id}-${Math.random().toString(36).slice(2)}`): Item {
  return {
    id,
    type,
    size: 1,
    mesh: {} as Item['mesh'],
    body: {} as Item['body'],
    isSelectable: true,
    isInTray: false,
  };
}

describe('Tray reserveSlot/confirmArrival flow', () => {
  let bus: EventBus;
  let tray: Tray;

  beforeEach(() => {
    bus = new EventBus();
    tray = new Tray({ capacity: 7, bus });
  });

  it('reserveSlot returns the next free index and marks the slot occupied', () => {
    const a = fakeItem(fakeType('apple'));
    const idx = tray.reserveSlot(a);
    expect(idx).toBe(0);
    expect(tray.slots[0]).toBe(a);
    expect(a.isInTray).toBe(true);
  });

  it('two concurrent reservations get distinct slot indices', async () => {
    const a = fakeItem(fakeType('apple'));
    const b = fakeItem(fakeType('apple'));
    // Simulate the race: two reservations issued before the first commit's
    // animation resolves.
    const indexA = tray.reserveSlot(a);
    const indexB = tray.reserveSlot(b);
    expect(indexA).toBe(0);
    expect(indexB).toBe(1);
    expect(tray.slots[0]).toBe(a);
    expect(tray.slots[1]).toBe(b);
    // Both arrivals can confirm independently without throwing.
    expect(() => tray.confirmArrival(indexA)).not.toThrow();
    expect(() => tray.confirmArrival(indexB)).not.toThrow();
  });

  it('reserveSlot returns -1 when the tray is full', () => {
    const t = fakeType('apple');
    for (let i = 0; i < 7; i++) tray.reserveSlot(fakeItem(t));
    // Confirm none yet — still no match check fired.
    expect(tray.isFull()).toBe(true);
    // The 8th reservation must report failure rather than overflowing.
    const overflow = tray.reserveSlot(fakeItem(t));
    expect(overflow).toBe(-1);
  });

  it('match resolution is deferred until any arrival is confirmed', () => {
    const matchEvents: string[] = [];
    bus.on('match_cleared', (p) => matchEvents.push(p.type.id));
    const apple = fakeType('apple');
    const i1 = tray.reserveSlot(fakeItem(apple));
    const i2 = tray.reserveSlot(fakeItem(apple));
    const i3 = tray.reserveSlot(fakeItem(apple));
    // No matches until *any* arrival is confirmed, even though all 3 are
    // already in the tray's slots.
    expect(matchEvents).toEqual([]);
    // The first confirmArrival is the one that runs the match scan; once a
    // match clears, subsequent confirms find nothing to do.
    tray.confirmArrival(i1);
    expect(matchEvents).toEqual(['apple']);
    expect(tray.count()).toBe(0);
    tray.confirmArrival(i2);
    tray.confirmArrival(i3);
    expect(matchEvents).toEqual(['apple']);
  });
});
