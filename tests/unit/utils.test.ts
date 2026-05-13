import { describe, it, expect, beforeEach } from 'vitest';
import { random, randomInRange, randomIntInRange, setSeed, pickWeighted } from '../../src/utils/rng';
import { sampleN, shuffleInPlace } from '../../src/utils/sampleN';
import { clamp, lerp, uuid } from '../../src/utils/math';

describe('rng (seeded)', () => {
  beforeEach(() => {
    setSeed(42);
  });

  it('produces identical sequences for identical seeds', () => {
    setSeed(123);
    const a = Array.from({ length: 5 }, () => random());
    setSeed(123);
    const b = Array.from({ length: 5 }, () => random());
    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    setSeed(1);
    const a = Array.from({ length: 5 }, () => random());
    setSeed(2);
    const b = Array.from({ length: 5 }, () => random());
    expect(a).not.toEqual(b);
  });

  it('randomInRange respects [min, max)', () => {
    for (let i = 0; i < 200; i++) {
      const v = randomInRange(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });

  it('randomIntInRange respects inclusive bounds', () => {
    for (let i = 0; i < 200; i++) {
      const v = randomIntInRange(5, 8);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it('pickWeighted respects weights', () => {
    setSeed('weights-test');
    const counts = { a: 0, b: 0 };
    const weights = [
      { value: 'a' as const, weight: 1 },
      { value: 'b' as const, weight: 9 },
    ];
    for (let i = 0; i < 1000; i++) {
      counts[pickWeighted(weights)]++;
    }
    expect(counts.b).toBeGreaterThan(counts.a * 4);
  });
});

describe('sampleN', () => {
  beforeEach(() => setSeed(7));

  it('returns the requested count of unique items', () => {
    const out = sampleN([1, 2, 3, 4, 5, 6, 7, 8], 4);
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
  });

  it('returns at most the full array when n exceeds length', () => {
    const out = sampleN([1, 2, 3], 10);
    expect(out).toHaveLength(3);
    expect(new Set(out)).toEqual(new Set([1, 2, 3]));
  });

  it('returns empty for n <= 0', () => {
    expect(sampleN([1, 2, 3], 0)).toEqual([]);
    expect(sampleN([1, 2, 3], -1)).toEqual([]);
  });

  it('does not mutate input', () => {
    const input = [1, 2, 3, 4];
    sampleN(input, 3);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe('shuffleInPlace', () => {
  it('preserves the multiset', () => {
    setSeed('shuffle');
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const before = [...arr];
    shuffleInPlace(arr);
    expect([...arr].sort()).toEqual([...before].sort());
  });
});

describe('math utils', () => {
  it('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lerp', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('uuid produces unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uuid()));
    expect(ids.size).toBe(50);
  });
});
