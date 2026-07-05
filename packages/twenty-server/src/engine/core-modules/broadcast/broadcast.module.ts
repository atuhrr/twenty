// FORK: Voka CRM — Fase 12
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappModule } from 'src/engine/core-modules/whatsapp/whatsapp.module';

import { BroadcastCampaignEntity } from './broadcast-campaign.entity';
import { BroadcastRecipientEntity } from './broadcast-recipient.entity';
import { BroadcastService } from './broadcast.service';
import { BroadcastResolver } from './broadcast.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([BroadcastCampaignEntity, BroadcastRecipientEntity]),
    WhatsappModule,
  ],
  providers: [BroadcastService, BroadcastResolver],
  exports: [BroadcastService],
})
export class BroadcastModule {}
