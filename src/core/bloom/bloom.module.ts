import { Global, Module } from '@nestjs/common';
import { BLOOM_FILTER, BloomFilterPort } from './bloom-filter.port';
import { BloomFilterService } from './bloom-filter.service';

@Global()
@Module({
  providers: [
    BloomFilterService,
    { provide: BLOOM_FILTER, useExisting: BloomFilterService },
    { provide: BloomFilterPort, useExisting: BloomFilterService },
  ],
  exports: [BLOOM_FILTER, BloomFilterPort],
})
export class BloomModule {}
