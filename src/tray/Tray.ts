import type { Item, ItemType } from '../core/types';
import type { EventBus } from '../core/EventBus';

export interface TrayOptions {
  capacity: number;
  bus: EventBus;
  onMatchAnimated?: (slotIndex: number, item: Item) => void;
}

export class Tray {
  capacity: number;
  slots: (Item | null)[];
  private readonly bus: EventBus;
  private readonly onMatchAnimated?: (slotIndex: number, item: Item) => void;
  private changeListeners = new Set<() => void>();

  constructor(opts: TrayOptions) {
    this.capacity = opts.capacity;
    this.slots = new Array(opts.capacity).fill(null);
    this.bus = opts.bus;
    this.onMatchAnimated = opts.onMatchAnimated;
  }

  onChange(cb: () => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }

  private notifyChange(): void {
    for (const cb of this.changeListeners) cb();
  }

  isFull(): boolean {
    return this.slots.every((s) => s !== null);
  }

  count(): number {
    return this.slots.reduce((acc, s) => acc + (s ? 1 : 0), 0);
  }

  firstEmptySlotIndex(): number {
    return this.slots.findIndex((s) => s === null);
  }

  lastFilledSlotIndex(): number {
    for (let i = this.slots.length - 1; i >= 0; i--) {
      if (this.slots[i]) return i;
    }
    return -1;
  }

  hasMatchableTriple(): boolean {
    const counts = new Map<ItemType, number>();
    for (const s of this.slots) {
      if (!s) continue;
      counts.set(s.type, (counts.get(s.type) ?? 0) + 1);
    }
    for (const c of counts.values()) {
      if (c >= 3) return true;
    }
    return false;
  }

  expandToCapacity(newCapacity: number): void {
    if (newCapacity <= this.capacity) return;
    while (this.slots.length < newCapacity) this.slots.push(null);
    this.capacity = newCapacity;
    this.notifyChange();
  }

  placeAt(index: number, item: Item): void {
    if (index < 0 || index >= this.slots.length) {
      throw new Error(`Tray.placeAt: index ${index} out of bounds`);
    }
    if (this.slots[index] !== null) {
      throw new Error(`Tray.placeAt: slot ${index} already occupied`);
    }
    this.slots[index] = item;
    item.isInTray = true;
    this.notifyChange();
    this.checkForMatches();
    if (this.isFull()) {
      this.bus.emit('tray_full', { canMatch: this.hasMatchableTriple() });
    }
  }

  checkForMatches(): void {
    const indicesByType = new Map<ItemType, number[]>();
    this.slots.forEach((item, i) => {
      if (!item) return;
      const arr = indicesByType.get(item.type) ?? [];
      arr.push(i);
      indicesByType.set(item.type, arr);
    });
    for (const [type, indices] of indicesByType) {
      if (indices.length >= 3) {
        const toClear = indices.slice(0, 3);
        this.clearAndSlide(toClear, type);
        // Recurse in case multiple types are matchable.
        this.checkForMatches();
        return;
      }
    }
  }

  private clearAndSlide(indices: number[], type: ItemType): void {
    for (const i of indices) {
      const item = this.slots[i];
      if (item && this.onMatchAnimated) this.onMatchAnimated(i, item);
      this.slots[i] = null;
    }
    this.slideLeft();
    this.bus.emit('match_cleared', { type, count: indices.length });
    this.notifyChange();
  }

  private slideLeft(): void {
    const nonNull = this.slots.filter((s): s is Item => s !== null);
    this.slots = [
      ...nonNull,
      ...new Array(this.capacity - nonNull.length).fill(null),
    ];
  }

  // Phase 5: Spring booster
  removeLastFilled(): Item | null {
    const idx = this.lastFilledSlotIndex();
    if (idx < 0) return null;
    const item = this.slots[idx]!;
    this.slots[idx] = null;
    this.slideLeft();
    item.isInTray = false;
    this.notifyChange();
    return item;
  }
}
