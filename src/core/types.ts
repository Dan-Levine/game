import type { Mesh, PhysicsAggregate } from '@babylonjs/core';

export type DifficultyTier = 'Normal' | 'Hard' | 'UltraHard';

export type ContainerShape = 'Flat' | 'Stepped' | 'Tilted' | 'MultiCompartment';

export type DropPattern = 'CenterColumn' | 'SpreadWide' | 'MultiPoint';

export type ColliderShape = 'BOX' | 'CAPSULE' | 'CONVEX_HULL' | 'SPHERE';

export interface ItemType {
  id: string;
  displayName: string;
  meshUrl: string;
  iconUrl: string;
  baseMass: number;
  colliderShape: ColliderShape;
  pack: string;
}

export interface ItemPack {
  id: string;
  displayName: string;
  types: ItemType[];
  levelRange: [number, number];
}

export interface Item {
  id: string;
  type: ItemType;
  size: number;
  mesh: Mesh;
  body: PhysicsAggregate;
  isSelectable: boolean;
  isInTray: boolean;
  sandglassBearer?: boolean;
}

export interface Goal {
  itemType: ItemType;
  required: number;
  current: number;
  isComplete: boolean;
}

export interface LevelParameters {
  levelNumber: number;
  difficultyTier: DifficultyTier;
  itemPack: ItemPack;
  itemDistribution: Map<ItemType, number>;
  sizeMixSkew: number;
  containerWidth: number;
  containerDepth: number;
  containerHeight: number;
  containerShape: ContainerShape;
  dropHeight: number;
  dropPattern: DropPattern;
  dropDurationSeconds: number;
  goals: Goal[];
  timerSeconds: number;
  traySlotCount: number;
}

export type BoosterType =
  | 'rocket'
  | 'extraTime'
  | 'extraSlot'
  | 'vacuum'
  | 'spring'
  | 'fan';

export interface GameStateData {
  currentLevel: number;
  lives: number;
  livesLastRefillTime: number;
  coins: number;
  boosterInventory: Record<BoosterType, number>;
  currentItemPack: string;
  settings: {
    audioEnabled: boolean;
    hapticsEnabled: boolean;
    musicEnabled: boolean;
  };
}

export type GamePhase =
  | 'MainMenu'
  | 'LevelLoading'
  | 'LevelIntro'
  | 'InLevel'
  | 'Paused'
  | 'LevelFailOffer'
  | 'LevelWin'
  | 'LevelFail';
