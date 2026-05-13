import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

// Phase 1 integration test: verifies the EventBus wiring used to glue Tray ->
// GoalTracker -> GameManager. The Tray->bus->listener chain is the simplest
// multi-module flow we have. Deeper integration tests land in Phase 4.

describe('EventBus integration', () => {
  it('delivers match_cleared payloads to all listeners', () => {
    const bus = new EventBus();
    const seenA: number[] = [];
    const seenB: number[] = [];
    bus.on('match_cleared', (p) => seenA.push(p.count));
    bus.on('match_cleared', (p) => seenB.push(p.count));
    bus.emit('match_cleared', {
      type: {
        id: 't',
        displayName: 't',
        meshUrl: '',
        iconUrl: '',
        baseMass: 1,
        colliderShape: 'BOX',
        pack: 'kitchen',
      },
      count: 3,
    });
    expect(seenA).toEqual([3]);
    expect(seenB).toEqual([3]);
  });

  it('unsubscribe stops delivery', () => {
    const bus = new EventBus();
    const received: number[] = [];
    const off = bus.on('tray_full', (p) => received.push(p.canMatch ? 1 : 0));
    bus.emit('tray_full', { canMatch: false });
    off();
    bus.emit('tray_full', { canMatch: true });
    expect(received).toEqual([0]);
  });

  it('exceptions in one listener do not prevent the next', () => {
    const bus = new EventBus();
    const seen: string[] = [];
    bus.on('level_ready', () => {
      throw new Error('boom');
    });
    bus.on('level_ready', () => seen.push('ok'));
    // Should not throw.
    bus.emit('level_ready', { itemCount: 27 });
    expect(seen).toEqual(['ok']);
  });
});
