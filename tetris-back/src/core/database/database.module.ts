import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PrismaModule } from 'src/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

