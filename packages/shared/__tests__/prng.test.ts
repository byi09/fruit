import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/board/prng';

describe('mulberry32 PRNG', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 10000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('handles seed of 0', () => {
    const rng = mulberry32(0);
    const val = rng();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it('handles negative seeds', () => {
    const rng1 = mulberry32(-42);
    const rng2 = mulberry32(-42);
    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('has reasonable distribution across 10 buckets', () => {
    const rng = mulberry32(999);
    const buckets = new Array(10).fill(0);
    const n = 100000;
    for (let i = 0; i < n; i++) {
      const bucket = Math.floor(rng() * 10);
      buckets[bucket]++;
    }
    // Each bucket should have roughly n/10 = 10000, allow 20% deviation
    for (const count of buckets) {
      expect(count).toBeGreaterThan(8000);
      expect(count).toBeLessThan(12000);
    }
  });
});
