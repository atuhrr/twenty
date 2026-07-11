// FORK: Voka CRM — Fase 14.1
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WhatsappInstanceEntity } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import { WhatsappMessageEntity } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappRealtimeModule } from 'src/engine/core-modules/whatsapp/realtime/whatsapp-realtime.module';
import { SalesbotEntity } from 'src/engine/core-modules/salesbot/salesbot.entity';
import { SalesbotSessionEntity } from 'src/engine/core-modules/salesbot/salesbot-session.entity';
import { SalesbotService } from 'src/engine/core-modules/salesbot/salesbot.service';
import { SalesbotExecutorService } from 'src/engine/core-modules/salesbot/salesbot-executor.service';
import { SalesbotResolver } from 'src/engine/core-modules/salesbot/salesbot.resolver';
import { BotGraphValidationService } from 'src/engine/core-modules/salesbot/salesbot-graph-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesbotEntity,
      SalesbotSessionEntity,
      WhatsappInstanceEntity,
      WhatsappMessageEntity,
    ]),
    SecretEncryptionModule,
    WhatsappRealtimeModule,
  ],
  providers: [
    SalesbotService,
    SalesbotExecutorService,
    SalesbotResolver,
    BotGraphValidationService,
  ],
  exports: [SalesbotExecutorService, BotGraphValidationService],
})
export class SalesbotModule {}
