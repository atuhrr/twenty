// FORK: Voka CRM — Fase 10: Telegram Bot API adapter stub
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

import {
  ChannelType,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import {
  IChannelAdapter,
  NormalizedInboundMessage,
} from 'src/engine/core-modules/omni-channel/interfaces/channel-adapter.interface';

type TgUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    from?: { id?: number };
    date?: number;
    text?: string;
  };
};

@Injectable()
export class TelegramChannelAdapter implements IChannelAdapter {
  readonly channelType = ChannelType.TELEGRAM;
  private readonly logger = new Logger(TelegramChannelAdapter.name);

  normalizeInbound(webhookBody: unknown): NormalizedInboundMessage | null {
    try {
      const update = webhookBody as TgUpdate;

      if (!update.message?.message_id) return null;

      return {
        externalId: `tg_${update.update_id ?? update.message.message_id}`,
        from: String(update.message.from?.id ?? 'unknown'),
        content: update.message.text ?? null,
        type: WhatsappMessageType.TEXT,
        timestamp: update.message.date
          ? new Date(update.message.date * 1000)
          : new Date(),
        channelType: ChannelType.TELEGRAM,
      };
    } catch (err) {
      this.logger.warn(
        `Telegram normalization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async send(_to: string, _text: string, _workspaceId: string): Promise<string> {
    throw new NotImplementedException(
      'Telegram send not yet implemented — configure Telegram Bot token.',
    );
  }
}
