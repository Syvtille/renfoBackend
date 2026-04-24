export const BLOOM_FILTER = Symbol('BLOOM_FILTER');

export abstract class BloomFilterPort {
  abstract mightExist(namespace: string, value: string): Promise<boolean>;
  abstract add(namespace: string, value: string): Promise<void>;
  abstract stats(namespace: string): Promise<{ bits: number; hashes: number; falsePositiveRate: number; available: boolean }>;
}
