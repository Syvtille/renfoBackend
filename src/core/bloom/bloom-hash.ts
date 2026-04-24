function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s.toLowerCase().trim());
}

// FNV-1a 32-bit
export function fnv1a(s: string): number {
  const bytes = toBytes(s);
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// djb2
export function djb2(s: string): number {
  const bytes = toBytes(s);
  let h = 5381;
  for (const b of bytes) {
    h = ((h << 5) + h + b) | 0;
  }
  return h >>> 0;
}

// MurmurHash3 x86 32-bit
export function murmur3(s: string, seed = 0): number {
  const bytes = toBytes(s);
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed >>> 0;
  let i = 0;
  const len = bytes.length;
  const blocks = len & ~3;
  while (i < blocks) {
    let k1 =
      bytes[i] |
      (bytes[i + 1] << 8) |
      (bytes[i + 2] << 16) |
      (bytes[i + 3] << 24);
    i += 4;
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }
  let k1 = 0;
  const tail = len & 3;
  if (tail === 3) k1 ^= bytes[i + 2] << 16;
  if (tail >= 2) k1 ^= bytes[i + 1] << 8;
  if (tail >= 1) {
    k1 ^= bytes[i];
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

/**
 * Double hashing: h_i(x) = (h1(x) + i * h2(x)) mod m
 * Reduces k full hash computations to 2, with similar false-positive behavior.
 */
export function bloomPositions(value: string, bits: number, hashCount: number): number[] {
  const h1 = murmur3(value, 0x9747b28c);
  const h2 = fnv1a(value);
  const h3 = djb2(value); // tie-breaker to avoid h2 == 0 collapse
  const base = h1;
  const step = (h2 === 0 ? h3 : h2) >>> 0;
  const positions: number[] = [];
  for (let i = 0; i < hashCount; i++) {
    positions.push(((base + i * step) >>> 0) % bits);
  }
  return positions;
}
