import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import {
  WhatsappContactWindowEntity,
} from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { SalesbotExecutorService } from 'src/engine/core-modules/salesbot/salesbot-executor.service';
import { NotificationsService } from 'src/engine/core-modules/notifications/notifications.service';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { normalizeBrPhone } from 'src/engine/core-modules/whatsapp/utils/normalize-br-phone.util';

export type WhatsappMessageReceivedEvent = {
  workspaceId: string;
  contactId: string;
  phone: string;
  text: string;
};

// Deterministic UUID namespace for deriving contactId from phone+workspace
const WHATSAPP_CONTACT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export type WhatsappWebhookPayload = {
  workspaceId: string;
  // Raw Meta webhook body (entry[].changes[].value)
  value: MetaWebhookValue;
};

type MetaWebhookValue = {
  messaging_product: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
};

type MetaMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; filename: string };
};

type MetaStatus = {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
};

@Processor(MessageQueue.whatsappQueue)
@Injectable()
export class WhatsappWebhookJob {
  private readonly logger = new Logger(WhatsappWebhookJob.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    // FORK: Voka CRM — Fase C: notifica novas mensagens recebidas
    private readonly notificationsService: NotificationsService,
    private readonly salesbotExecutorService: SalesbotExecutorService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
  ) {}

  @Process(WhatsappWebhookJob.name)
  async handle(data: WhatsappWebhookPayload): Promise<void> {
    const { workspaceId, value } = data;

    if (value.messages?.length) {
      for (const msg of value.messages) {
        await this.processInboundMessage(workspaceId, msg).catch((err) => {
          this.logger.error(
            `Failed to process message ${msg.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      }
    }

    if (value.statuses?.length) {
      for (const status of value.statuses) {
        await this.processStatusUpdate(status).catch((err) => {
          this.logger.error(
            `Failed to update status for ${status.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      }
    }
  }

  private async processInboundMessage(
    workspaceId: string,
    msg: MetaMessage,
  ): Promise<void> {
    const normalizedPhone = normalizeBrPhone(msg.from);

    // Derive a deterministic contactId from (workspaceId + normalizedPhone).
    // In EPIC 5 this will be replaced with a real workspace Person lookup.
    const contactId = uuidv5(
      `${workspaceId}:${normalizedPhone}`,
      WHATSAPP_CONTACT_NAMESPACE,
    );

    const type = this.resolveMessageType(msg.type);
    const content = msg.text?.body ?? null;
    const mediaUrl = null; // media download is deferred to EPIC 5

    const timestamp = new Date(Number(msg.timestamp) * 1000);

    const saved = await this.whatsappService.dedupeAndSaveMessage({
      workspaceId,
      contactId,
      direction: WhatsappMessageDirection.INBOUND,
      type,
      content,
      mediaUrl,
      externalMessageId: msg.id,
      status: WhatsappMessageStatus.DELIVERED,
      timestamp,
    });

    if (!saved) {
      this.logger.debug(`Duplicate inbound message ${msg.id} — skipped`);

      return;
    }

    // FORK: Voka CRM — Fase 9: store phone for thread display
    await this.upsertContactWindow(workspaceId, contactId, timestamp, normalizedPhone);

    // FORK: Voka CRM — Fase C: notificação de nova mensagem no header
    await this.notificationsService
      .create(workspaceId, {
        title: `Nova mensagem de ${normalizedPhone}`,
        body: content ?? '(mídia recebida)',
        type: 'WHATSAPP',
        link: '/inbox',
      })
      .catch((err) =>
        this.logger.warn(`Falha ao criar notificação: ${String(err)}`),
      );

    // FORK: Voka CRM — Fase 14: trigger Salesbot if message is text
    if (msg.type === 'text' && content) {
      this.salesbotExecutorService
        .handleInboundMessage(workspaceId, normalizedPhone, content)
        .catch((err) => {
          this.logger.warn(
            `Salesbot error for ${normalizedPhone}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });

      // FORK: Voka CRM — Fase 13: fire MESSAGE_RECEIVED automation rules
      this.eventEmitter.emit('whatsapp.message.received', {
        workspaceId,
        contactId,
        phone: normalizedPhone,
        text: content,
      } satisfies WhatsappMessageReceivedEvent);
    }
  }

  private async processStatusUpdate(status: MetaStatus): Promise<void> {
    const statusMap: Record<string, WhatsappMessageStatus> = {
      sent: WhatsappMessageStatus.SENT,
      delivered: WhatsappMessageStatus.DELIVERED,
      read: WhatsappMessageStatus.READ,
      failed: WhatsappMessageStatus.FAILED,
    };

    const mappedStatus = statusMap[status.status];

    if (!mappedStatus) {
      return;
    }

    await this.whatsappService.updateMessageStatus(status.id, mappedStatus);
  }

  private async upsertContactWindow(
    workspaceId: string,
    contactId: string,
    lastInboundAt: Date,
    phoneNumber?: string,
  ): Promise<void> {
    const existing = await this.contactWindowRepo.findOne({
      where: { workspaceId, contactId },
    });

    if (existing) {
      await this.contactWindowRepo.update(
        { workspaceId, contactId },
        { lastInboundAt, ...(phoneNumber ? { phoneNumber } : {}) },
      );
    } else {
      await this.contactWindowRepo.save(
        this.contactWindowRepo.create({
          workspaceId,
          contactId,
          lastInboundAt,
          phoneNumber: phoneNumber ?? null,
        }),
      );
    }
  }

  private resolveMessageType(rawType: string): WhatsappMessageType {
    switch (rawType) {
      case 'image':
        return WhatsappMessageType.IMAGE;
      case 'audio':
        return WhatsappMessageType.AUDIO;
      case 'document':
        return WhatsappMessageType.DOCUMENT;
      case 'template':
        return WhatsappMessageType.TEMPLATE;
      default:
        return WhatsappMessageType.TEXT;
    }
  }
}
