// FORK: Voka CRM — Fase 18/19: motivos de perda
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LossReasonEntity } from './loss-reason.entity';
import { LossReasonsController } from './loss-reasons.controller';
import { LossReasonsService } from './loss-reasons.service';

@Module({
  imports: [TypeOrmModule.forFeature([LossReasonEntity], 'core')],
  controllers: [LossReasonsController],
  providers: [LossReasonsService],
  exports: [LossReasonsService],
})
export class LossReasonsModule {}
