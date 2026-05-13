import { Scene, Color3, StandardMaterial } from '@babylonjs/core';
import type { Item } from '../core/types';
import { pickTopmostSelectable } from './Picker';

export interface PointerInputCallbacks {
  onCommit: (item: Item) => void;
}

// Phase 1: minimal selection feedback via emissive tint. HighlightLayer +
// silhouette arrive in Phase 2.
const HIGHLIGHT_COLOR = new Color3(1.0, 0.85, 0.2);

export class PointerInput {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly callbacks: PointerInputCallbacks;
  private currentSelection: Item | null = null;
  private originalEmissive: Color3 | null = null;
  private pointerActive = false;
  private boundDown = this.onPointerDown.bind(this);
  private boundMove = this.onPointerMove.bind(this);
  private boundUp = this.onPointerUp.bind(this);
  private boundCancel = this.onPointerCancel.bind(this);

  constructor(canvas: HTMLCanvasElement, scene: Scene, callbacks: PointerInputCallbacks) {
    this.canvas = canvas;
    this.scene = scene;
    this.callbacks = callbacks;
  }

  attach(): void {
    this.canvas.addEventListener('pointerdown', this.boundDown);
    this.canvas.addEventListener('pointermove', this.boundMove);
    this.canvas.addEventListener('pointerup', this.boundUp);
    this.canvas.addEventListener('pointercancel', this.boundCancel);
    this.canvas.addEventListener('pointerleave', this.boundCancel);
  }

  detach(): void {
    this.canvas.removeEventListener('pointerdown', this.boundDown);
    this.canvas.removeEventListener('pointermove', this.boundMove);
    this.canvas.removeEventListener('pointerup', this.boundUp);
    this.canvas.removeEventListener('pointercancel', this.boundCancel);
    this.canvas.removeEventListener('pointerleave', this.boundCancel);
  }

  private toCanvasCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.pointerActive = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers reject capture on certain pointer types; ignore.
    }
    const { x, y } = this.toCanvasCoords(e);
    const item = pickTopmostSelectable(this.scene, x, y);
    if (item) this.beginSelection(item);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.pointerActive) return;
    const { x, y } = this.toCanvasCoords(e);
    const item = pickTopmostSelectable(this.scene, x, y);
    if (item !== this.currentSelection) {
      if (item) this.changeSelection(item);
      else this.clearSelection();
    }
  }

  private onPointerUp(_e: PointerEvent): void {
    this.pointerActive = false;
    const selected = this.currentSelection;
    this.clearSelection();
    if (selected) this.callbacks.onCommit(selected);
  }

  private onPointerCancel(_e: PointerEvent): void {
    this.pointerActive = false;
    this.clearSelection();
  }

  private beginSelection(item: Item): void {
    this.currentSelection = item;
    this.applyHighlight(item);
  }

  private changeSelection(item: Item): void {
    this.clearSelection();
    this.beginSelection(item);
  }

  private clearSelection(): void {
    if (!this.currentSelection) return;
    this.removeHighlight(this.currentSelection);
    this.currentSelection = null;
  }

  private applyHighlight(item: Item): void {
    const mat = item.mesh.material;
    if (mat instanceof StandardMaterial) {
      this.originalEmissive = mat.emissiveColor.clone();
      mat.emissiveColor = HIGHLIGHT_COLOR;
    } else if (mat) {
      this.originalEmissive = null;
    }
  }

  private removeHighlight(item: Item): void {
    const mat = item.mesh.material;
    if (mat instanceof StandardMaterial && this.originalEmissive) {
      mat.emissiveColor = this.originalEmissive;
    }
    this.originalEmissive = null;
  }
}
