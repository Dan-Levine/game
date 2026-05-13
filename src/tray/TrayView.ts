import type { Tray } from './Tray';

// Maps the DOM tray slots <-> the world space the commit animation needs.
// Phase 1 ignores world-projection accuracy; the arc targets a fixed world
// point per slot using the slot's horizontal screen position projected to
// the camera frustum at a known depth. Good enough to ship.

export class TrayView {
  private readonly container: HTMLElement;
  private readonly tray: Tray;
  private slotElems: HTMLElement[] = [];
  private unsubscribe?: () => void;

  constructor(tray: Tray, container: HTMLElement) {
    this.tray = tray;
    this.container = container;
    this.renderSkeleton();
    this.unsubscribe = tray.onChange(() => this.refresh());
  }

  dispose(): void {
    this.unsubscribe?.();
    this.container.innerHTML = '';
  }

  private renderSkeleton(): void {
    this.container.innerHTML = '';
    this.slotElems = [];
    for (let i = 0; i < this.tray.capacity; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.slotIndex = String(i);
      slot.setAttribute('data-testid', `tray-slot-${i}`);
      this.container.appendChild(slot);
      this.slotElems.push(slot);
    }
    this.refresh();
  }

  refresh(): void {
    if (this.slotElems.length !== this.tray.capacity) {
      this.renderSkeleton();
      return;
    }
    const filled = this.tray.count();
    for (let i = 0; i < this.tray.capacity; i++) {
      const el = this.slotElems[i]!;
      const item = this.tray.slots[i];
      // icon
      if (item) {
        if (!el.querySelector('img')) {
          const img = document.createElement('img');
          img.src = item.type.iconUrl;
          img.alt = item.type.displayName;
          img.draggable = false;
          el.appendChild(img);
        } else {
          (el.querySelector('img') as HTMLImageElement).src = item.type.iconUrl;
        }
        el.dataset.itemId = item.id;
        el.dataset.typeId = item.type.id;
      } else {
        el.innerHTML = '';
        delete el.dataset.itemId;
        delete el.dataset.typeId;
      }
      el.classList.remove('warn-soft', 'warn-strong');
      if (!item && filled >= 6) el.classList.add('warn-strong');
      else if (!item && filled >= 5) el.classList.add('warn-soft');
    }
  }

  // Returns a world position for a slot, projecting the slot DOM center back
  // through the camera. Pulled lazily so view layout has stabilized.
  getSlotWorldPosition(
    index: number,
    project: (clientX: number, clientY: number, depthY: number) => { x: number; y: number; z: number },
  ): { x: number; y: number; z: number } {
    const el = this.slotElems[index];
    if (!el) return { x: 0, y: 0, z: 0 };
    const rect = el.getBoundingClientRect();
    return project(rect.left + rect.width / 2, rect.top + rect.height / 2, 0);
  }

  playPop(index: number): void {
    const el = this.slotElems[index];
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
}
