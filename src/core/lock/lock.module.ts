import { Global, Module } from '@nestjs/common';
import { LOCK, LockPort } from './lock.port';
import { RedisLockService } from './redis-lock.service';

@Global()
@Module({
  providers: [
    RedisLockService,
    { provide: LOCK, useExisting: RedisLockService },
    { provide: LockPort, useExisting: RedisLockService },
  ],
  exports: [LOCK, LockPort],
})
export class LockModule {}
