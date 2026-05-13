// Seeded RNG used everywhere. Reads ?seed=N from URL when present so e2e and
// debugging can replay identical sequences. Falls back to Date.now().

let state: number;

function hashSeed(input: string | number): number {
  const s = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function readSeedFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw === null) return null;
  const asNum = Number(raw);
  return Number.isFinite(asNum) ? hashSeed(asNum) : hashSeed(raw);
}

export function setSeed(seed: number | string): void {
  state = hashSeed(seed);
  // Avoid 0 cycle in mulberry32
  if (state === 0) state = 1;
}

function initIfNeeded(): void {
  if (state !== undefined) return;
  const urlSeed = readSeedFromUrl();
  if (urlSeed !== null) {
    state = urlSeed === 0 ? 1 : urlSeed;
  } else {
    state = hashSeed(Date.now());
    if (state === 0) state = 1;
  }
}

// mulberry32
export function random(): number {
  initIfNeeded();
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomInRange(min: number, max: number): number {
  return min + random() * (max - min);
}

export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

export function pickWeighted<T>(weights: Array<{ value: T; weight: number }>): T {
  const total = weights.reduce((acc, w) => acc + w.weight, 0);
  let r = random() * total;
  for (const entry of weights) {
    r -= entry.weight;
    if (r <= 0) return entry.value;
  }
  return weights[weights.length - 1]!.value;
}
