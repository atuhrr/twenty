// FORK: Voka CRM — Fase 10: adapter interface for all messaging channels
import {
  ChannelType,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';

export type NormalizedInboundMessage = {
  externalId: string;
  from: string;
  content: string | null;
  type: WhatsappMessageType;
  timestamp: Date;
  channelType: ChannelType;
};

export interface IChannelAdapter {
  readonly channelType: ChannelType;
  /** Parse the raw webhook body into a normalized message, or return null to skip */
  normalizeInbound(webhookBody: unknown): NormalizedInboundMessage | null;
  /** Send a text message; returns the external message ID */
  send(to: string, text: string, workspaceId: string): Promise<string>;
}
