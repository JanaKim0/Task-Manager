import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — imported once in AppModule, then PrismaService is available
// in every other module without importing it again.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
