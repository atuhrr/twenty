import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageQueueModule } from 'src/engine/core-modules/message-queue/message-queue.module';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WhatsappOpportunityStageJob } from 'src/engine/core-modules/whatsapp/jobs/whatsapp-opportunity-stage.job';
import { WhatsappOpportunityStageListener } from 'src/engine/core-modules/whatsapp/listeners/whatsapp-opportunity-stage.listener';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappInstanceEntity } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import { WhatsappMessageEntity } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappTemplateEntity } from 'src/engine/core-modules/whatsapp/whatsapp-template.entity';
import { WhatsappWebhookJob } from 'src/engine/core-modules/whatsapp/whatsapp-webhook.job';
import { WhatsappController } from 'src/engine/core-modules/whatsapp/whatsapp.controller';
import { WhatsappResolver } from 'src/engine/core-modules/whatsapp/whatsapp.resolver';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsappInstanceEntity,
      WhatsappMessageEntity,
      WhatsappContactWindowEntity,
      WhatsappTemplateEntity,
    ]),
    MessageQueueModule,
    SecretEncryptionModule,
  ],
  controllers: [WhatsappController],
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
