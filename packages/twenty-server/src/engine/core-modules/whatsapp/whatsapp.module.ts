import { NotificationsModule } from 'src/engine/core-modules/notifications/notifications.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { MessageQueueModule } from 'src/engine/core-modules/message-queue/message-queue.module';
import { SalesbotModule } from 'src/engine/core-modules/salesbot/salesbot.module';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WhatsappOpportunityStageJob } from 'src/engine/core-modules/whatsapp/jobs/whatsapp-opportunity-stage.job';
import { WhatsappOpportunityStageListener } from 'src/engine/core-modules/whatsapp/listeners/whatsapp-opportunity-stage.listener';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappInstanceEntity } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import { WhatsappMessageEntity } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappQuickReplyEntity } from 'src/engine/core-modules/whatsapp/whatsapp-quick-reply.entity';
import { WhatsappSseController } from 'src/engine/core-modules/whatsapp/whatsapp-sse.controller';
import { WhatsappTemplateEntity } from 'src/engine/core-modules/whatsapp/whatsapp-template.entity';
import { WhatsappWebhookJob } from 'src/engine/core-modules/whatsapp/whatsapp-webhook.job';
import { WhatsappController } from 'src/engine/core-modules/whatsapp/whatsapp.controller';
import { WhatsappResolver } from 'src/engine/core-modules/whatsapp/whatsapp.resolver';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

@Module({
  imports: [
    // FORK: Voka CRM — Fase C: notificações de mensagens recebidas
    NotificationsModule,
    TypeOrmModule.forFeature([
      WhatsappInstanceEntity,
      WhatsappMessageEntity,
      WhatsappContactWindowEntity,
      WhatsappTemplateEntity,
      WhatsappQuickReplyEntity,
    ]),
    MessageQueueModule,
    SecretEncryptionModule,
    SalesbotModule,
    TokenModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [WhatsappController, WhatsappSseController],
  providers: [
    WhatsappService,
    WhatsappResolver,
    WhatsappWebhookJob,
    WhatsappOpportunityStageJob,
    WhatsappOpportunityStageListener,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
