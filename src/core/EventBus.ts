import type { ItemType, Goal } from './types';

export interface MatchClearedPayload {
  type: ItemType;
  count: number;
}

export interface GoalUpdatedPayload {
  goal: Goal;
}

export interface GameEventMap {
  level_load_started: { levelNumber: number };
  level_ready: { itemCount: number };
  match_cleared: MatchClearedPayload;
  goal_updated: GoalUpdatedPayload;
  goal_complete: GoalUpdatedPayload;
  tray_full: { canMatch: boolean };
  level_win: void;
  level_fail: { cause: 'tray_full' | 'timer'; };
}

type EventName = keyof GameEventMap;
type Listener<K extends EventName> = (payload: GameEventMap[K]) => void;

export class EventBus {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<K extends EventName>(event: K, cb: Listener<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as Listener<EventName>);
    return () => set!.delete(cb as Listener<EventName>);
  }

  emit<K extends EventName>(event: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        (cb as Listener<K>)(payload);
      } catch (err) {
        console.error(`[EventBus] listener for "${event}" threw`, err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
