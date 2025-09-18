import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 👈 Esto lo hace accesible en todos los módulos sin tener que importar
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}