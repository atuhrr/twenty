import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import axios, { type AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';

import { WhatsappThreadSummaryDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-thread-summary.dto';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { ConnectWhatsappInput } from 'src/engine/core-modules/whatsapp/dtos/connect-whatsapp.input';
import { CreateWhatsappQuickReplyInput } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-quick-reply.dto';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappQuickReplyEntity } from 'src/engine/core-modules/whatsapp/whatsapp-quick-reply.entity';
import {
  WhatsappConnectionStatus,
  WhatsappInstanceEntity,
} from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import {
  ChannelType,
  WhatsappMessageDirection,
  WhatsappMessageEntity,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';

const META_GRAPH_API_BASE = 'https://graph.facebook.com';
const META_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly messageEmitter = new EventEmitter();

  constructor(
    @InjectRepository(WhatsappInstanceEntity)
    private readonly instanceRepo: Repository<WhatsappInstanceEntity>,
    @InjectRepository(WhatsappMessageEntity)
    private readonly messageRepo: Repository<WhatsappMessageEntity>,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
    @InjectRepository(WhatsappQuickReplyEntity)
    private readonly quickReplyRepo: Repository<WhatsappQuickReplyEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  private getMetaClient(accessToken: string): AxiosInstance {
    const version = process.env.META_GRAPH_API_VERSION ?? 'v20.0';

    return axios.create({
      baseURL: `${META_GRAPH_API_BASE}/${version}`,
      timeout: META_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private async getInstanceCredentials(
    workspaceId: string,
  ): Promise<{ accessToken: string; phoneNumberId: string }> {
    const instance = await this.instanceRepo.findOne({ where: { workspaceId } });

    if (!instance) {
      throw new NotFoundException(
        `WhatsApp instance not found for workspace ${workspaceId}`,
      );
    }

    return {
      accessToken: this.secretEncryptionService.decrypt(
        instance.accessTokenEncrypted,
      ),
      phoneNumberId: instance.phoneNumberId,
    };
  }

  private async verifyPhoneNumber(
    phoneNumberId: string,
    accessToken: string,
  ): Promise<WhatsappConnectionStatus> {
    try {
      const client = this.getMetaClient(accessToken);

      await client.get(`/${phoneNumberId}`, {
        params: { fields: 'id,verified_name' },
      });

      return WhatsappConnectionStatus.CONNECTED;
    } catch {
      return WhatsappConnectionStatus.DISCONNECTED;
    }
  }

  async registerInstance(
    workspaceId: string,
    input: ConnectWhatsappInput,
  ): Promise<WhatsappInstanceEntity> {
    const accessTokenEncrypted = this.secretEncryptionService.encrypt(
      input.accessToken,
    );
    const appSecretEncrypted = this.secretEncryptionService.encrypt(
      input.appSecret,
    );

    // If caller passes an explicit instanceId, update that specific one; otherwise create new
    const existing = input.instanceId
      ? await this.instanceRepo.findOne({ where: { id: input.instanceId, workspaceId } })
      : null;

    let instance: WhatsappInstanceEntity;

    if (existing) {
      existing.wabaId = input.wabaId;
      existing.phoneNumberId = input.phoneNumberId;
      existing.accessTokenEncrypted = accessTokenEncrypted;
      existing.appSecretEncrypted = appSecretEncrypted;
      existing.displayPhoneNumber = input.displayPhoneNumber ?? null;
      if (input.label !== undefined) existing.label = input.label ?? null;
      instance = existing;
    } else {
      const existingCount = await this.instanceRepo.count({ where: { workspaceId } });

      instance = this.instanceRepo.create({
        workspaceId,
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        accessTokenEncrypted,
        appSecretEncrypted,
        displayPhoneNumber: input.displayPhoneNumber ?? null,
        label: input.label ?? null,
        isDefault: existingCount === 0, // first number is default
        connectionStatus: WhatsappConnectionStatus.PENDING,
      });
    }

    const saved = await this.instanceRepo.save(instance);

    // Verify credentials against Meta Graph API
    const status = await this.verifyPhoneNumber(
      input.phoneNumberId,
      input.accessToken,
    );

    await this.instanceRepo.update({ id: saved.id }, { connectionStatus: status });
    saved.connectionStatus = status;

    return saved;
  }

  async sendTextMessage(
    workspaceId: string,
    phoneNumber: string,
    text: string,
  ): Promise<string> {
    const { accessToken, phoneNumberId } =
      await this.getInstanceCredentials(workspaceId);
    const client = this.getMetaClient(accessToken);

    try {
      const { data } = await this.callWithRetry(() =>
        client.post(`/${phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: text },
        }),
      );

      return (
        (data as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? ''
      );
    } catch (err: unknown) {
      // Meta error 131047: re-engagement message (24h window expired)
      const metaCode = (err as { response?: { data?: { error?: { code?: number } } } })
        ?.response?.data?.error?.code;

      if (metaCode === 131047) {
        throw new BadRequestException(
          'WINDOW_EXPIRED: A janela de 24h está encerrada. Use um template para retomar a conversa.',
        );
      }
      throw err;
    }
  }

  async sendTemplateMessage(
    workspaceId: string,
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    components: object[],
  ): Promise<string> {
    const { accessToken, phoneNumberId } =
      await this.getInstanceCredentials(workspaceId);
    const client = this.getMetaClient(accessToken);

    const { data } = await this.callWithRetry(() =>
      client.post(`/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    );

    return (
      (data as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? ''
    );
  }

  async checkConnectionStatus(
    workspaceId: string,
  ): Promise<WhatsappConnectionStatus> {
    try {
      const { accessToken, phoneNumberId } =
        await this.getInstanceCredentials(workspaceId);
      const status = await this.verifyPhoneNumber(phoneNumberId, accessToken);

      await this.instanceRepo.update({ workspaceId }, { connectionStatus: status });

      return status;
    } catch {
      return WhatsappConnectionStatus.DISCONNECTED;
    }
  }

  // remoteJid kept for interface compatibility but unused with Meta API
  async markAsRead(
    workspaceId: string,
    _remoteJid: string,
    messageId: string,
  ): Promise<void> {
    try {
      const { accessToken, phoneNumberId } =
        await this.getInstanceCredentials(workspaceId);
      const client = this.getMetaClient(accessToken);

      await this.callWithRetry(() =>
        client.post(`/${phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `markAsRead failed for ${messageId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getDecryptedAppSecret(workspaceId: string): Promise<string> {
    const instance = await this.instanceRepo.findOne({ where: { workspaceId } });

    if (!instance) {
      throw new NotFoundException(
        `WhatsApp instance not found for workspace ${workspaceId}`,
      );
    }

    return this.secretEncryptionService.decrypt(instance.appSecretEncrypted);
  }

  async dedupeAndSaveMessage(params: {
    workspaceId: string;
    contactId: string;
    direction: WhatsappMessageDirection;
    type: WhatsappMessageType;
    content: string | null;
    mediaUrl: string | null;
    externalMessageId: string;
    status: WhatsappMessageStatus;
    timestamp: Date;
    channelType?: ChannelType;
  }): Promise<WhatsappMessageEntity | null> {
    const existing = await this.messageRepo.findOne({
      where: { externalMessageId: params.externalMessageId },
    });

    if (existing) {
      return null;
    }

    const entity = this.messageRepo.create({
      ...params,
      channelType: params.channelType ?? ChannelType.WHATSAPP,
    });

    const saved = await this.messageRepo.save(entity);

    // Notify SSE subscribers for this workspace
    this.messageEmitter.emit(`msg:${params.workspaceId}`, saved);

    return saved;
  }

  subscribeToWorkspaceMessages(workspaceId: string): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      const handler = (msg: WhatsappMessageEntity) => {
        subscriber.next({ data: JSON.stringify(msg) });
      };

      this.messageEmitter.on(`msg:${workspaceId}`, handler);

      return () => {
        this.messageEmitter.off(`msg:${workspaceId}`, handler);
      };
    });
  }

  async updateMessageStatus(
    externalMessageId: string,
    status: WhatsappMessageStatus,
  ): Promise<void> {
    await this.messageRepo.update({ externalMessageId }, { status });
  }

  async getMessagesByContact(
    workspaceId: string,
    contactId: string,
  ): Promise<WhatsappMessageEntity[]> {
    return this.messageRepo.find({
      where: { workspaceId, contactId },
      order: { timestamp: 'ASC' },
    });
  }

  async getInstance(
    workspaceId: string,
  ): Promise<WhatsappInstanceEntity | null> {
    return (
      (await this.instanceRepo.findOne({ where: { workspaceId, isDefault: true } })) ??
      (await this.instanceRepo.findOne({ where: { workspaceId } }))
    );
  }

  // FORK: Voka CRM — Fase 11: multi-number management
  async listInstances(workspaceId: string): Promise<WhatsappInstanceEntity[]> {
    return this.instanceRepo.find({
      where: { workspaceId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async setDefaultInstance(workspaceId: string, instanceId: string): Promise<boolean> {
    await this.instanceRepo.update({ workspaceId }, { isDefault: false });
    const result = await this.instanceRepo.update({ id: instanceId, workspaceId }, { isDefault: true });

    return (result.affected ?? 0) > 0;
  }

  async deleteInstance(workspaceId: string, instanceId: string): Promise<boolean> {
    const instances = await this.instanceRepo.find({ where: { workspaceId } });

    if (instances.length <= 1) {
      throw new BadRequestException('Não é possível remover o único número conectado.');
    }

    const target = instances.find((i) => i.id === instanceId);

    if (!target) return false;

    await this.instanceRepo.delete({ id: instanceId, workspaceId });

    if (target.isDefault) {
      const remaining = instances.filter((i) => i.id !== instanceId);
      const next = remaining[0];

      if (next) await this.instanceRepo.update({ id: next.id }, { isDefault: true });
    }

    return true;
  }

  async updateInstanceLabel(
    workspaceId: string,
    instanceId: string,
    label: string,
  ): Promise<boolean> {
    const result = await this.instanceRepo.update(
      { id: instanceId, workspaceId },
      { label },
    );

    return (result.affected ?? 0) > 0;
  }

  // FORK: Voka CRM — Fase 9: returns one thread (latest msg) per contactId for the Inbox
  async getThreads(workspaceId: string): Promise<WhatsappThreadSummaryDTO[]> {
    // Step 1: latest message per contactId (DISTINCT ON requires raw SQL in PG)
    const rows = await this.messageRepo.query(
      `SELECT DISTINCT ON (m."contactId")
          m."id",
          m."contactId",
          m."direction",
          m."type",
          m."content",
          m."mediaUrl",
          m."externalMessageId",
          m."status",
          m."timestamp",
          m."createdAt",
          m."channelType",
          cw."phoneNumber",
          cw."assignedUserId",
          cw."assignedUserName"
       FROM "core"."whatsappMessage" m
       LEFT JOIN "core"."whatsappContactWindow" cw
         ON cw."contactId" = m."contactId"
        AND cw."workspaceId" = $1
       WHERE m."workspaceId" = $1
       ORDER BY m."contactId", m."timestamp" DESC`,
      [workspaceId],
    ) as Array<Record<string, unknown>>;

    if (rows.length === 0) return [];

    // Step 2: unread count per contactId
    const contactIds = rows.map((r) => r.contactId as string);
    const unreadRows = await this.messageRepo.query(
      `SELECT "contactId", COUNT(*) AS unread
       FROM "core"."whatsappMessage"
       WHERE "workspaceId" = $1
         AND "direction" = 'INBOUND'
         AND "status" != 'READ'
         AND "contactId" = ANY($2::uuid[])
       GROUP BY "contactId"`,
      [workspaceId, contactIds],
    ) as Array<{ contactId: string; unread: string }>;

    const unreadMap = new Map(unreadRows.map((r) => [r.contactId, parseInt(r.unread, 10)]));

    return rows.map((row) => ({
      contactId: row.contactId as string,
      phoneNumber: (row.phoneNumber as string | null) ?? null,
      channelType: (row.channelType as ChannelType) ?? ChannelType.WHATSAPP,
      lastMessage: {
        id: row.id as string,
        contactId: row.contactId as string,
        direction: row.direction as WhatsappMessageDirection,
        type: row.type as WhatsappMessageType,
        content: (row.content as string | null) ?? null,
        mediaUrl: (row.mediaUrl as string | null) ?? null,
        externalMessageId: row.externalMessageId as string,
        status: row.status as WhatsappMessageStatus,
        timestamp: row.timestamp as Date,
        createdAt: row.createdAt as Date,
        channelType: (row.channelType as ChannelType) ?? ChannelType.WHATSAPP,
      },
      unreadCount: unreadMap.get(row.contactId as string) ?? 0,
      assignedUserId: (row.assignedUserId as string | null) ?? null,
      assignedUserName: (row.assignedUserName as string | null) ?? null,
    }));
  }

  async getLastMessageByContact(
    workspaceId: string,
    contactId: string,
  ): Promise<WhatsappMessageEntity | null> {
    return this.messageRepo.findOne({
      where: { workspaceId, contactId },
      order: { timestamp: 'DESC' },
    });
  }

  async getContactWindow(
    workspaceId: string,
    contactId: string,
  ): Promise<{ contactId: string; lastInboundAt: Date | null; isWindowOpen: boolean }> {
    const window = await this.contactWindowRepo.findOne({
      where: { workspaceId, contactId },
    });
    const lastInboundAt = window?.lastInboundAt ?? null;
    const isWindowOpen = lastInboundAt
      ? Date.now() - lastInboundAt.getTime() < 24 * 60 * 60 * 1_000
      : false;

    return { contactId, lastInboundAt, isWindowOpen };
  }

  async upsertContactWindowForChannel(
    workspaceId: string,
    contactId: string,
    lastInboundAt: Date,
  ): Promise<void> {
    const existing = await this.contactWindowRepo.findOne({
      where: { workspaceId, contactId },
    });

    if (existing) {
      await this.contactWindowRepo.update({ workspaceId, contactId }, { lastInboundAt });
    } else {
      await this.contactWindowRepo.save(
        this.contactWindowRepo.create({ workspaceId, contactId, lastInboundAt }),
      );
    }
  }

  // FORK: Voka CRM — Fase 11: quick reply CRUD
  async getQuickReplies(workspaceId: string): Promise<WhatsappQuickReplyEntity[]> {
    return this.quickReplyRepo.find({
      where: { workspaceId },
      order: { shortcut: 'ASC' },
    });
  }

  async createQuickReply(
    workspaceId: string,
    input: CreateWhatsappQuickReplyInput,
  ): Promise<WhatsappQuickReplyEntity> {
    const entity = this.quickReplyRepo.create({ ...input, workspaceId });

    return this.quickReplyRepo.save(entity);
  }

  async deleteQuickReply(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.quickReplyRepo.delete({ workspaceId, id });

    return (result.affected ?? 0) > 0;
  }

  // FORK: Voka CRM — Fase 11: assign a thread to a user (or unassign if null)
  async assignThread(
    workspaceId: string,
    contactId: string,
    assignedUserId: string | null,
    assignedUserName: string | null,
  ): Promise<void> {
    await this.contactWindowRepo.update(
      { workspaceId, contactId },
      { assignedUserId, assignedUserName },
    );
  }

  async listTemplates(workspaceId: string): Promise<{
    id: string;
    name: string;
    status: string;
    language: string;
    category: string | null;
    components: { type: string; text: string | null }[];
  }[]> {
    const instance = await this.instanceRepo.findOne({ where: { workspaceId } });

    if (!instance) return [];

    const accessToken = this.secretEncryptionService.decrypt(instance.accessTokenEncrypted);
    const client = this.getMetaClient(accessToken);

    try {
      const { data } = await client.get(`/${instance.wabaId}/message_templates`, {
        params: { fields: 'id,name,status,language,category,components', limit: 100 },
      });

      type MetaTemplate = {
        id: string;
        name: string;
        status: string;
        language: string;
        category?: string;
        components?: { type: string; text?: string }[];
      };

      const raw = data as { data?: MetaTemplate[] };

      return (raw.data ?? [])
        .filter((t) => t.status === 'APPROVED')
        .map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          language: t.language,
          category: t.category ?? null,
          components: (t.components ?? []).map((c) => ({
            type: c.type,
            text: c.text ?? null,
          })),
        }));
    } catch {
      return [];
    }
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        throw err;
      }
      const delayMs = 200 * Math.pow(2, attempt - 1);

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return this.callWithRetry(fn, attempt + 1);
    }
  }
}
