/** Seeded PRNG so the dummy dataset is identical on every run. */
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  poisson(lambda: number): number;
  shuffle<T>(items: T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted(items, weight) {
      const total = items.reduce((acc, item) => acc + weight(item), 0);
      let r = next() * total;
      for (const item of items) {
        r -= weight(item);
        if (r <= 0) return item;
      }
      return items[items.length - 1];
    },
    poisson(lambda) {
      if (lambda <= 0) return 0;
      const limit = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= next();
      } while (p > limit);
      return k - 1;
    },
    shuffle(items) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items;
    },
  };
}
