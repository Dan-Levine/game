import { random } from './rng';

// Fisher-Yates partial shuffle; returns `n` unique elements from `arr`.
export function sampleN<T>(arr: readonly T[], n: number): T[] {
  if (n <= 0 || arr.length === 0) return [];
  const k = Math.min(n, arr.length);
  const copy = arr.slice();
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(random() * (copy.length - i));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.slice(0, k);
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
