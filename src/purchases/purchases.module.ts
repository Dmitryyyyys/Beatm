import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from '../entities/purchase.entity';
import { Track } from '../entities/track.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, Track])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}


