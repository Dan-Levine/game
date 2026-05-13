export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function uuid(): string {
  // crypto.randomUUID is available in modern browsers and Node 16+
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: time + random
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}
