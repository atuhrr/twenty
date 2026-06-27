// FORK: Voka CRM — Fase 10: OmniChannel module wires IG/Messenger/Telegram adapters
import { Module } from '@nestjs/common';

import { InstagramChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/instagram.adapter';
import { MessengerChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/messenger.adapter';
import { TelegramChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/telegram.adapter';
import { OmniChannelController } from 'src/engine/core-modules/omni-channel/omni-channel.controller';
import { OmniChannelService } from 'src/engine/core-modules/omni-channel/omni-channel.service';
import { WhatsappModule } from 'src/engine/core-modules/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [OmniChannelController],
  providers: [
    OmniChannelService,
    InstagramChannelAdapter,
    MessengerChannelAdapter,
    TelegramChannelAdapter,
  ],
})
export class OmniChannelModule {}
