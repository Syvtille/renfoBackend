import { Global, Module, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export abstract class RedisLike {
  abstract available: boolean;
  abstract getBit(key: string, offset: number): Promise<number>;
  abstract setBit(key: string, offset: number, value: 0 | 1): Promise<number>;
  abstract set(key: string, value: string, opts?: { nx?: boolean; px?: number }): Promise<'OK' | null>;
  abstract get(key: string): Promise<string | null>;
  abstract del(key: string): Promise<number>;
  abstract eval(script: string, keys: string[], args: string[]): Promise<unknown>;
  abstract incr(key: string): Promise<number>;
  abstract expire(key: string, seconds: number): Promise<number>;
  abstract quit(): Promise<void>;
}

class InMemoryRedis extends RedisLike {
  private readonly logger = new Logger('InMemoryRedis');
  available = false;
  private bits = new Map<string, Uint8Array>();
  private kv = new Map<string, { value: string; expiresAt?: number }>();
  private counters = new Map<string, number>();

  constructor() {
    super();
    this.logger.warn('Redis unavailable — using in-memory fallback (single-process only, state lost on restart)');
  }

  private notExpired(key: string): boolean {
    const e = this.kv.get(key);
    if (!e) return false;
    if (e.expiresAt && Date.now() > e.expiresAt) {
      this.kv.delete(key);
      return false;
    }
    return true;
  }

  async getBit(key: string, offset: number): Promise<number> {
    const arr = this.bits.get(key);
    if (!arr) return 0;
    const byte = Math.floor(offset / 8);
    const bit = 7 - (offset % 8);
    if (byte >= arr.length) return 0;
    return (arr[byte] >> bit) & 1;
  }

  async setBit(key: string, offset: number, value: 0 | 1): Promise<number> {
    const byte = Math.floor(offset / 8);
    const bit = 7 - (offset % 8);
    let arr = this.bits.get(key);
    if (!arr || byte >= arr.length) {
      const nu = new Uint8Array(Math.max(byte + 1, arr?.length ?? 0));
      if (arr) nu.set(arr);
      arr = nu;
      this.bits.set(key, arr);
    }
    const prev = (arr[byte] >> bit) & 1;
    if (value) arr[byte] |= (1 << bit);
    else arr[byte] &= ~(1 << bit);
    return prev;
  }

  async set(key: string, value: string, opts?: { nx?: boolean; px?: number }): Promise<'OK' | null> {
    if (opts?.nx && this.notExpired(key)) return null;
    this.kv.set(key, { value, expiresAt: opts?.px ? Date.now() + opts.px : undefined });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.notExpired(key) ? (this.kv.get(key)?.value ?? null) : null;
  }

  async del(key: string): Promise<number> {
    return this.kv.delete(key) ? 1 : 0;
  }

  async eval(_script: string, keys: string[], args: string[]): Promise<unknown> {
    const key = keys[0];
    const expected = args[0];
    const current = await this.get(key);
    if (current === expected) {
      await this.del(key);
      return 1;
    }
    return 0;
  }

  async incr(key: string): Promise<number> {
    const v = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, v);
    return v;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  async quit(): Promise<void> {}
}

class RealRedis extends RedisLike {
  available = true;
  constructor(private readonly client: RedisClientType) {
    super();
  }

  async getBit(key: string, offset: number): Promise<number> {
    return await this.client.getBit(key, offset);
  }
  async setBit(key: string, offset: number, value: 0 | 1): Promise<number> {
    return await this.client.setBit(key, offset, value);
  }
  async set(key: string, value: string, opts?: { nx?: boolean; px?: number }): Promise<'OK' | null> {
    const options: Record<string, unknown> = {};
    if (opts?.nx) options.NX = true;
    if (opts?.px) options.PX = opts.px;
    const res = await this.client.set(key, value, options as never);
    return (res as unknown) as 'OK' | null;
  }
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }
  async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return await this.client.eval(script, { keys, arguments: args });
  }
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }
  async expire(key: string, seconds: number): Promise<number> {
    const r = await this.client.expire(key, seconds);
    return r ? 1 : 0;
  }
  async quit(): Promise<void> {
    await this.client.quit();
  }
}

async function createRedis(): Promise<RedisLike> {
  const logger = new Logger('RedisFactory');
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  try {
    const client: RedisClientType = createClient({
      url,
      socket: { connectTimeout: 1500, reconnectStrategy: false },
    });
    client.on('error', (err) => {
      logger.warn(`Redis client error: ${err?.message ?? err}`);
    });
    await client.connect();
    logger.log(`Connected to Redis at ${url}`);
    return new RealRedis(client);
  } catch (e: any) {
    logger.warn(`Failed to connect to Redis (${url}): ${e?.message ?? e}`);
    return new InMemoryRedis();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: createRedis,
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  async onModuleDestroy() {}
}
