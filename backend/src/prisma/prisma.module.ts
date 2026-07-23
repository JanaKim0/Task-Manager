import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — модуль импортируется один раз в AppModule,
// а PrismaService становится доступен во всех остальных модулях.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
