import {
  Engine,
  Scene,
  Vector3,
  PhysicsMotionType,
  Camera,
} from '@babylonjs/core';
import { createSceneContext, type SceneContext } from '../scene/SceneSetup';
import { enablePhysics } from '../physics/HavokBootstrap';
import { buildContainer, type Container } from '../physics/Container';
import { dropAndSettle } from '../items/DropSequencer';
import { getKitchenStarterTypes } from '../items/AssetRegistry';
import type { GamePhase, Item, ItemType, LevelParameters } from './types';
import { EventBus } from './EventBus';
import { Tray } from '../tray/Tray';
import { TrayView } from '../tray/TrayView';
import { PointerInput } from '../input/PointerInput';
import { SelectabilityScheduler } from '../input/SelectabilityScheduler';
import { animateArcTo } from '../vfx/ArcAnimator';
import { setSeed } from '../utils/rng';

export class GameManager {
  readonly canvas: HTMLCanvasElement;
  readonly bus = new EventBus();
  engine!: Engine;
  scene!: Scene;
  container: Container | null = null;
  items: Item[] = [];
  tray!: Tray;
  trayView!: TrayView;
  pointerInput!: PointerInput;
  selectability!: SelectabilityScheduler;
  phase: GamePhase = 'MainMenu';
  currentLevel: LevelParameters | null = null;

  private booted = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async boot(): Promise<void> {
    if (this.booted) return;
    this.booted = true;

    const ctx: SceneContext = createSceneContext(this.canvas);
    this.engine = ctx.engine;
    this.scene = ctx.scene;

    await enablePhysics(this.scene);

    this.tray = new Tray({
      capacity: 7,
      bus: this.bus,
      onMatchAnimated: (slotIndex) => {
        this.trayView.playPop(slotIndex);
      },
    });
    const trayEl = document.getElementById('tray');
    if (!trayEl) throw new Error('No #tray DOM element');
    this.trayView = new TrayView(this.tray, trayEl);

    this.pointerInput = new PointerInput(this.canvas, this.scene, {
      onCommit: (item) => void this.commitItem(item),
    });
    this.pointerInput.attach();

    this.selectability = new SelectabilityScheduler(
      this.scene,
      this.scene.activeCamera as Camera,
    );
    this.selectability.start();

    // For Phase 1 we boot straight into a hardcoded kitchen level.
    await this.loadHardcodedLevel();
  }

  async loadHardcodedLevel(): Promise<void> {
    this.phase = 'LevelLoading';
    this.bus.emit('level_load_started', { levelNumber: 1 });

    // Tear down previous level if any.
    this.disposeItems();
    if (this.container) {
      this.container.dispose();
      this.container = null;
    }

    // Seed for repeatable drop pattern unless URL overrode.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('seed')) setSeed('phase1-default');
    }

    const types = getKitchenStarterTypes();
    if (types.length < 3) throw new Error('Expected at least 3 starter types');
    const apple = types.find((t) => t.id === 'kitchen_apple')!;
    const mug = types.find((t) => t.id === 'kitchen_mug')!;
    const donut = types.find((t) => t.id === 'kitchen_donut')!;

    const distribution = new Map<ItemType, number>([
      [apple, 9],
      [mug, 9],
      [donut, 9],
    ]);

    const containerWidth = 7;
    const containerDepth = 7;
    const containerHeight = 5;

    this.container = buildContainer(this.scene, {
      width: containerWidth,
      depth: containerDepth,
      height: containerHeight,
    });

    const dropResult = await dropAndSettle({
      scene: this.scene,
      distribution,
      containerWidth,
      containerDepth,
      dropHeight: 6,
      dropDurationSeconds: 1.8,
    });
    this.items = dropResult.items;
    this.selectability.setItems(this.items);

    this.currentLevel = {
      levelNumber: 1,
      difficultyTier: 'Normal',
      itemPack: {
        id: 'kitchen',
        displayName: 'Kitchen',
        types,
        levelRange: [1, 20],
      },
      itemDistribution: distribution,
      sizeMixSkew: 0.5,
      containerWidth,
      containerDepth,
      containerHeight,
      containerShape: 'Flat',
      dropHeight: 6,
      dropPattern: 'CenterColumn',
      dropDurationSeconds: 1.8,
      goals: [],
      timerSeconds: 90,
      traySlotCount: 7,
    };

    this.phase = 'InLevel';
    this.bus.emit('level_ready', { itemCount: this.items.length });
  }

  async commitItem(item: Item): Promise<void> {
    if (item.isInTray) return;

    // Reserve the destination slot synchronously so a second rapid commit
    // cannot grab the same index across the arc animation.
    const slotIndex = this.tray.reserveSlot(item);
    if (slotIndex < 0) return;

    item.body.body.setMotionType(PhysicsMotionType.STATIC);
    item.isSelectable = false;

    // Selectability list is recomputed against `isInTray`, which is now true.
    this.selectability.setItems(this.items.filter((i) => !i.isInTray));

    const targetWorld = this.projectSlotToWorld(slotIndex);
    try {
      await animateArcTo(item.mesh, targetWorld, 300);
    } finally {
      item.mesh.setEnabled(false);
      try {
        item.body.dispose();
      } catch {
        // Body may already have been disposed by a level teardown.
      }
      this.tray.confirmArrival(slotIndex);
    }
  }

  private projectSlotToWorld(slotIndex: number): Vector3 {
    // Aim for a position in front of and slightly above the camera, scaled by
    // slot index across the tray width.
    const slotsPerRow = this.tray.capacity;
    const t = slotIndex / Math.max(1, slotsPerRow - 1); // 0..1
    const halfWidth = 3.2;
    const x = -halfWidth + t * (2 * halfWidth);
    const y = -2.0;
    const z = -3.5;
    return new Vector3(x, y, z);
  }

  private disposeItems(): void {
    for (const item of this.items) {
      try {
        item.body.dispose();
      } catch {
        // Already disposed.
      }
      item.mesh.dispose();
    }
    this.items = [];
  }

  dispose(): void {
    this.pointerInput?.detach();
    this.selectability?.stop();
    this.trayView?.dispose();
    this.disposeItems();
    this.container?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
