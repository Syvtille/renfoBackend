import { fnv1a, djb2, murmur3, bloomPositions } from './bloom-hash';

describe('bloom-hash', () => {
  it('fnv1a is deterministic', () => {
    expect(fnv1a('hello')).toBe(fnv1a('hello'));
    expect(fnv1a('hello')).not.toBe(fnv1a('world'));
  });

  it('djb2 is deterministic', () => {
    expect(djb2('hello')).toBe(djb2('hello'));
    expect(djb2('hello')).not.toBe(djb2('world'));
  });

  it('murmur3 is deterministic and differs by seed', () => {
    expect(murmur3('hello', 0)).toBe(murmur3('hello', 0));
    expect(murmur3('hello', 0)).not.toBe(murmur3('hello', 1));
  });

  it('bloomPositions returns k distinct positions within [0, bits)', () => {
    const bits = 1024;
    const k = 7;
    const positions = bloomPositions('alice@test.com', bits, k);
    expect(positions).toHaveLength(k);
    for (const p of positions) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(bits);
    }
  });

  it('bloomPositions is case-insensitive and trimmed', () => {
    const bits = 1024;
    const k = 7;
    expect(bloomPositions('  Alice@Test.COM ', bits, k))
      .toEqual(bloomPositions('alice@test.com', bits, k));
  });
});
