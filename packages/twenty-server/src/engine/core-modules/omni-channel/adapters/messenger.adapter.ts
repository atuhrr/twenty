// FORK: Voka CRM — Fase 10: Facebook Messenger adapter stub
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

import {
  ChannelType,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import {
  IChannelAdapter,
  NormalizedInboundMessage,
} from 'src/engine/core-modules/omni-channel/interfaces/channel-adapter.interface';

type MsgEntry = {
  messaging?: Array<{
    sender?: { id?: string };
    timestamp?: number;
    message?: { mid?: string; text?: string };
  }>;
};

@Injectable()
export class MessengerChannelAdapter implements IChannelAdapter {
  readonly channelType = ChannelType.MESSENGER;
  private readonly logger = new Logger(MessengerChannelAdapter.name);

  normalizeInbound(webhookBody: unknown): NormalizedInboundMessage | null {
    try {
      const body = webhookBody as { entry?: MsgEntry[] };
      const messaging = body.entry?.[0]?.messaging?.[0];

      if (!messaging?.message?.mid) return null;

      return {
        externalId: messaging.message.mid,
        from: messaging.sender?.id ?? 'unknown',
        content: messaging.message.text ?? null,
        type: WhatsappMessageType.TEXT,
        timestamp: messaging.timestamp
          ? new Date(messaging.timestamp * 1000)
          : new Date(),
        channelType: ChannelType.MESSENGER,
      };
    } catch (err) {
      this.logger.warn(
        `Messenger normalization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async send(_to: string, _text: string, _workspaceId: string): Promise<string> {
    throw new NotImplementedException(
      'Messenger send not yet implemented — configure Messenger Send API credentials.',
    );
  }
}
