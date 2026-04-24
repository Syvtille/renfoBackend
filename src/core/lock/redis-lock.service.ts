import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { LockHandle, LockPort } from './lock.port';
import { REDIS_CLIENT, RedisLike } from '../cache/redis.module';

const RELEASE_LUA = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

/**
 * Distributed lock via Redis (SET NX PX + token-matched DEL).
 *
 * Properties:
 * - Mutual exclusion across multiple app instances.
 * - Deadlock-free: every lock has a TTL, so a crashed holder doesn't block forever.
 * - Safe release: DEL is gated by a Lua script that checks the token — a holder whose
 *   TTL expired won't accidentally release a lock acquired by someone else.
 *
 * When Redis is unavailable, the RedisModule falls back to an in-memory store, which
 * still provides in-process mutual exclusion but NOT cross-process guarantees.
 */
@Injectable()
export class RedisLockService extends LockPort {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly defaultTtlMs = 10_000;
  private readonly defaultWaitMs = 3_000;
  private readonly pollMs = 50;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisLike) {
    super();
  }

  async acquire(
    key: string,
    opts?: { ttlMs?: number; waitMs?: number },
  ): Promise<LockHandle | null> {
    const ttlMs = opts?.ttlMs ?? this.defaultTtlMs;
    const waitMs = opts?.waitMs ?? this.defaultWaitMs;
    const fullKey = `lock:${key}`;
    const token = randomBytes(16).toString('hex');
    const deadline = Date.now() + waitMs;

    while (true) {
      const res = await this.redis.set(fullKey, token, { nx: true, px: ttlMs });
      if (res === 'OK') {
        return {
          release: async () => {
            try {
              await this.redis.eval(RELEASE_LUA, [fullKey], [token]);
            } catch (e: any) {
              this.logger.warn(`Lock release failed for ${key}: ${e?.message ?? e}`);
            }
          },
        };
      }
      if (Date.now() >= deadline) return null;
      await new Promise((r) => setTimeout(r, this.pollMs));
    }
  }
}
