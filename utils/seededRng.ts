// Simple seeded RNG (Linear Congruential Generator)
// Useful for Daily Challenges where the sequence of generated numbers needs to be consistent for a given seed (like the current date).

export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive)
  public next(): number {
    // LCG parameters common in glibc
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 31;
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
}

// Helper to get a daily integer seed (e.g., 20260309)
export const getDailySeed = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
