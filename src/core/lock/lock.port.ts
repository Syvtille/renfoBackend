export const LOCK = Symbol('LOCK');

export interface LockHandle {
  release(): Promise<void>;
}

export abstract class LockPort {
  /**
   * Acquires an exclusive lock on the key. Waits up to `waitMs` before giving up.
   * Returns null on timeout, a LockHandle otherwise. The lock auto-expires after `ttlMs`
   * to prevent deadlocks on crashed clients.
   */
  abstract acquire(key: string, opts?: { ttlMs?: number; waitMs?: number }): Promise<LockHandle | null>;

  /**
   * Helper: runs `fn` under a lock. Throws if the lock cannot be acquired within `waitMs`.
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    opts?: { ttlMs?: number; waitMs?: number },
  ): Promise<T> {
    const handle = await this.acquire(key, opts);
    if (!handle) throw new Error(`Could not acquire lock: ${key}`);
    try {
      return await fn();
    } finally {
      await handle.release();
    }
  }
}
