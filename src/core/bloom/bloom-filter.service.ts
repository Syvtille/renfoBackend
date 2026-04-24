import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BloomFilterPort } from './bloom-filter.port';
import { REDIS_CLIENT, RedisLike } from '../cache/redis.module';
import { bloomPositions } from './bloom-hash';

/**
 * Bloom filter backed by Redis bitmaps (SETBIT / GETBIT).
 *
 * Tuning (per namespace):
 *   n = expected insertions
 *   p = target false positive rate
 *   m = -n * ln(p) / (ln 2)^2   (bits)
 *   k = (m/n) * ln 2            (hash count)
 *
 * Defaults: n=100k, p=1%, m≈958k bits (120KB), k=7.
 */
@Injectable()
export class BloomFilterService implements BloomFilterPort, OnModuleInit {
  private readonly logger = new Logger(BloomFilterService.name);
  private readonly bits = 1 << 20; // ~1M bits (131KB per namespace)
  private readonly hashes = 7;
  private readonly keyPrefix = 'bloom:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisLike) {}

  async onModuleInit() {
    this.logger.log(
      `Bloom filter ready — bits=${this.bits}, k=${this.hashes}, redis=${this.redis.available ? 'on' : 'in-memory fallback'}`,
    );
  }

  private key(ns: string): string {
    return `${this.keyPrefix}${ns}`;
  }

  async mightExist(namespace: string, value: string): Promise<boolean> {
    const positions = bloomPositions(value, this.bits, this.hashes);
    const key = this.key(namespace);
    for (const pos of positions) {
      const bit = await this.redis.getBit(key, pos);
      if (!bit) return false; // definitely NOT in set
    }
    return true; // probably in set
  }

  async add(namespace: string, value: string): Promise<void> {
    const positions = bloomPositions(value, this.bits, this.hashes);
    const key = this.key(namespace);
    await Promise.all(positions.map((pos) => this.redis.setBit(key, pos, 1)));
  }

  async stats(_namespace: string) {
    return {
      bits: this.bits,
      hashes: this.hashes,
      falsePositiveRate: 0.01,
      available: this.redis.available,
    };
  }
}
