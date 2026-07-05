// FORK: Voka CRM — Fase 20.2: módulo de analytics
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappMessageEntity } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';

import { RoiRelatorioEntity } from './entities/roi-relatorio.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsappMessageEntity,
      WhatsappContactWindowEntity,
      RoiRelatorioEntity,
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
