import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

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
import { normalizeWaId } from 'src/engine/core-modules/whatsapp/utils/normalize-wa-id.util';
import { getWhatsappContactId } from 'src/engine/core-modules/whatsapp/utils/whatsapp-contact-id.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export type WhatsappMessageReceivedEvent = {
  workspaceId: string;
  contactId: string;
  phone: string;
  text: string;
};


export type WhatsappWebhookPayload = {
  workspaceId: string;
  // Raw Meta webhook body (entry[].changes[].value)
  value: MetaWebhookValue;
};

type MetaWebhookValue = {
  messaging_product: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
};

type MetaContact = {
  wa_id: string;
  profile?: { name?: string };
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
    // FORK: Zellate — criação automática de lead não classificado
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
  ) {}

  @Process(WhatsappWebhookJob.name)
  async handle(data: WhatsappWebhookPayload): Promise<void> {
    const { workspaceId, value } = data;

    if (value.messages?.length) {
      // Nome de perfil do remetente (a Cloud API só expõe o nome, não a foto)
      const profileNameByWaId = new Map(
        (value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]),
      );

      for (const msg of value.messages) {
        const profileName = profileNameByWaId.get(msg.from) ?? null;

        await this.processInboundMessage(workspaceId, msg, profileName).catch((err) => {
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
    profileName: string | null,
  ): Promise<void> {
    // FORK: Zellate — wa_id já vem internacional; nunca prefixar código de país
    const normalizedPhone = normalizeWaId(msg.from);

    // contactId deterministico por (workspace + telefone) — util compartilhado
    const contactId = getWhatsappContactId(workspaceId, normalizedPhone);

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
    const isNewContact = await this.upsertContactWindow(
      workspaceId,
      contactId,
      timestamp,
      normalizedPhone,
      profileName,
    );

    // FORK: Zellate — Kommo-style "Leads de entrada": primeira mensagem de um
    // número desconhecido cria Contato + Lead em "Leads não classificados".
    if (isNewContact) {
      await this.createUnclassifiedLead(
        workspaceId,
        normalizedPhone,
        profileName,
      ).catch((err) => {
        this.logger.error(
          `Falha ao criar lead não classificado para ${normalizedPhone}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }

    // FORK: Voka CRM — Fase C: notificação de nova mensagem no header
    await this.notificationsService
      .create(workspaceId, {
        title: `Nova mensagem de ${profileName ?? normalizedPhone}`,
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

  /** @returns true quando a conversa é nova (primeiro contato do número) */
  private async upsertContactWindow(
    workspaceId: string,
    contactId: string,
    lastInboundAt: Date,
    phoneNumber?: string,
    contactName?: string | null,
  ): Promise<boolean> {
    const existing = await this.contactWindowRepo.findOne({
      where: { workspaceId, contactId },
    });

    if (existing) {
      await this.contactWindowRepo.update(
        { workspaceId, contactId },
        {
          lastInboundAt,
          ...(phoneNumber ? { phoneNumber } : {}),
          ...(contactName ? { contactName } : {}),
        },
      );

      return false;
    }

    await this.contactWindowRepo.save(
      this.contactWindowRepo.create({
        workspaceId,
        contactId,
        lastInboundAt,
        phoneNumber: phoneNumber ?? null,
        contactName: contactName ?? null,
      }),
    );

    return true;
  }

  // FORK: Zellate — cria Contato + Lead não classificado no schema do
  // workspace (comportamento "Leads de entrada" do Kommo). O lead fica em
  // "Leads não classificados" até ser aceito (entra no funil) ou recusado.
  private async createUnclassifiedLead(
    workspaceId: string,
    phone: string,
    profileName: string | null,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);
    const displayName = profileName?.trim() || `WhatsApp +${phone}`;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepo =
          await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            workspaceId,
            'person',
            { shouldBypassPermissionChecks: true },
          );

        const [firstName, ...rest] = displayName.split(' ');
        const person = await personRepo.save({
          name: { firstName, lastName: rest.join(' ') },
          phones: {
            primaryPhoneNumber: phone,
            primaryPhoneCallingCode: '',
            primaryPhoneCountryCode: '',
          },
          createdBy: { source: 'SYSTEM', name: 'WhatsApp' },
          updatedBy: { source: 'SYSTEM', name: 'WhatsApp' },
        } as never);

        const opportunityRepo =
          await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            workspaceId,
            'opportunity',
            { shouldBypassPermissionChecks: true },
          );

        await opportunityRepo.save({
          name: displayName,
          stage: 'LEADS_RECEBIDOS',
          isUnclassified: true,
          pointOfContactId: (person as { id: string }).id,
          position: 0,
          createdBy: { source: 'SYSTEM', name: 'WhatsApp' },
          updatedBy: { source: 'SYSTEM', name: 'WhatsApp' },
        } as never);
      },
      authContext,
    );

    this.logger.log(
      `Lead não classificado criado para ${displayName} (${phone})`,
    );
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
