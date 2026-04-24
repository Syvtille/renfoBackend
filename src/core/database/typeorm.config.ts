import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5433', 10),
    username: process.env.DB_USERNAME ?? 'clashchat_user',
    password: process.env.DB_PASSWORD ?? 'password123',
    database: process.env.DB_DATABASE ?? 'clashchat',
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    logging: process.env.DB_LOGGING === 'true' ? ['warn', 'error'] : false,
    autoLoadEntities: true,
  };
}
