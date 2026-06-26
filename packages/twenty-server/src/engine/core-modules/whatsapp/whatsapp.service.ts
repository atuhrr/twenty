import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import axios, { type AxiosInstance } from 'axios';
import { Repository } from 'typeorm';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { ConnectWhatsappInput } from 'src/engine/core-modules/whatsapp/dtos/connect-whatsapp.input';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import {
  WhatsappConnectionStatus,
  WhatsappInstanceEntity,
} from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import {
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

  constructor(
    @InjectRepository(WhatsappInstanceEntity)
    private readonly instanceRepo: Repository<WhatsappInstanceEntity>,
    @InjectRepository(WhatsappMessageEntity)
    private readonly messageRepo: Repository<WhatsappMessageEntity>,
    @InjectRepository(WhatsappContactWindowEntity)
    private readonly contactWindowRepo: Repository<WhatsappContactWindowEntity>,
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

    let instance = await this.instanceRepo.findOne({ where: { workspaceId } });

    if (instance) {
      instance.wabaId = input.wabaId;
      instance.phoneNumberId = input.phoneNumberId;
      instance.accessTokenEncrypted = accessTokenEncrypted;
      instance.appSecretEncrypted = appSecretEncrypted;
      instance.displayPhoneNumber = input.displayPhoneNumber ?? null;
    } else {
      instance = this.instanceRepo.create({
        workspaceId,
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        accessTokenEncrypted,
        appSecretEncrypted,
        displayPhoneNumber: input.displayPhoneNumber ?? null,
        connectionStatus: WhatsappConnectionStatus.PENDING,
      });
    }

    const saved = await this.instanceRepo.save(instance);

    // Verify credentials against Meta Graph API
    const status = await this.verifyPhoneNumber(
      input.phoneNumberId,
      input.accessToken,
    );

    await this.instanceRepo.update({ workspaceId }, { connectionStatus: status });
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
  }): Promise<WhatsappMessageEntity | null> {
    const existing = await this.messageRepo.findOne({
      where: { externalMessageId: params.externalMessageId },
    });

    if (existing) {
      return null;
    }

    const entity = this.messageRepo.create(params);

    return this.messageRepo.save(entity);
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
    return this.instanceRepo.findOne({ where: { workspaceId } });
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
