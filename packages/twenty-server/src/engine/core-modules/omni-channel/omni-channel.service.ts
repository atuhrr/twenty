// FORK: Voka CRM — Fase 10: routes inbound webhooks from all channels into the unified message store
import { Injectable, Logger } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';

import { InstagramChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/instagram.adapter';
import { MessengerChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/messenger.adapter';
import { TelegramChannelAdapter } from 'src/engine/core-modules/omni-channel/adapters/telegram.adapter';
import { IChannelAdapter } from 'src/engine/core-modules/omni-channel/interfaces/channel-adapter.interface';
import {
  ChannelType,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

// Same namespace as WhatsappWebhookJob for deterministic contactId derivation
const CONTACT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

@Injectable()
export class OmniChannelService {
  private readonly logger = new Logger(OmniChannelService.name);
  private readonly adapters: Map<string, IChannelAdapter>;

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly instagramAdapter: InstagramChannelAdapter,
    private readonly messengerAdapter: MessengerChannelAdapter,
    private readonly telegramAdapter: TelegramChannelAdapter,
  ) {
    this.adapters = new Map<string, IChannelAdapter>([
      ['instagram', instagramAdapter],
      ['messenger', messengerAdapter],
      ['telegram', telegramAdapter],
    ]);
  }

  async processInboundWebhook(
    channel: string,
    workspaceId: string,
    webhookBody: unknown,
  ): Promise<void> {
    const adapter = this.adapters.get(channel.toLowerCase());

    if (!adapter) {
      this.logger.warn(`No adapter found for channel: ${channel}`);
      return;
    }

    const normalized = adapter.normalizeInbound(webhookBody);

    if (!normalized) {
      this.logger.debug(`Channel ${channel}: webhook produced no message (skipped)`);
      return;
    }

    const contactId = uuidv5(
      `${workspaceId}:${normalized.from}`,
      CONTACT_NAMESPACE,
    );

    const saved = await this.whatsappService.dedupeAndSaveMessage({
      workspaceId,
      contactId,
      direction: WhatsappMessageDirection.INBOUND,
      type: normalized.type,
      content: normalized.content,
      mediaUrl: null,
      externalMessageId: normalized.externalId,
      status: WhatsappMessageStatus.DELIVERED,
      timestamp: normalized.timestamp,
      channelType: normalized.channelType,
    });

    if (!saved) {
      this.logger.debug(`Duplicate ${channel} message ${normalized.externalId} — skipped`);
      return;
    }

    await this.whatsappService.upsertContactWindowForChannel(
      workspaceId,
      contactId,
      normalized.timestamp,
    );
    this.logger.log(`${channel} inbound from ${normalized.from} saved (contactId ${contactId})`);
  }

  getAdapterChannelType(channel: string): ChannelType | undefined {
    return this.adapters.get(channel.toLowerCase())?.channelType;
  }
}
