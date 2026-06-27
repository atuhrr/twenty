// FORK: Voka CRM — Fase 10: Instagram DM adapter stub
// Full implementation requires Instagram Graph API credentials per workspace.
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

import {
  ChannelType,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import {
  IChannelAdapter,
  NormalizedInboundMessage,
} from 'src/engine/core-modules/omni-channel/interfaces/channel-adapter.interface';

type IgWebhookEntry = {
  messaging?: Array<{
    sender?: { id?: string };
    timestamp?: number;
    message?: { mid?: string; text?: string };
  }>;
};

@Injectable()
export class InstagramChannelAdapter implements IChannelAdapter {
  readonly channelType = ChannelType.INSTAGRAM;
  private readonly logger = new Logger(InstagramChannelAdapter.name);

  normalizeInbound(webhookBody: unknown): NormalizedInboundMessage | null {
    try {
      const body = webhookBody as { entry?: IgWebhookEntry[] };
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
        channelType: ChannelType.INSTAGRAM,
      };
    } catch (err) {
      this.logger.warn(
        `Instagram normalization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async send(_to: string, _text: string, _workspaceId: string): Promise<string> {
    throw new NotImplementedException(
      'Instagram send not yet implemented — configure Instagram Graph API credentials.',
    );
  }
}
