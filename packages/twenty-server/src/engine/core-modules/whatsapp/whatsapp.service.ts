import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import axios, { type AxiosInstance } from 'axios';
import { Repository } from 'typeorm';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { ConnectWhatsappInput } from 'src/engine/core-modules/whatsapp/dtos/connect-whatsapp.input';
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

const EVOLUTION_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evolutionClient: AxiosInstance;

  constructor(
    @InjectRepository(WhatsappInstanceEntity)
    private readonly instanceRepo: Repository<WhatsappInstanceEntity>,
    @InjectRepository(WhatsappMessageEntity)
    private readonly messageRepo: Repository<WhatsappMessageEntity>,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {
    this.evolutionClient = axios.create({
      baseURL: process.env.EVOLUTION_API_URL ?? 'http://localhost:8080',
      timeout: EVOLUTION_TIMEOUT_MS,
      headers: {
        apikey: process.env.EVOLUTION_API_KEY ?? '',
        'Content-Type': 'application/json',
      },
    });
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

    // Register with Evolution API (Cloud API mode)
    await this.callWithRetry(() =>
      this.evolutionClient.post('/instance/create', {
        instanceName: `ws_${workspaceId}`,
        integration: 'WHATSAPP-CLOUD',
        token: input.accessToken,
        businessId: input.wabaId,
        number: input.phoneNumberId,
      }),
    ).catch((err) => {
      this.logger.warn(
        `Evolution registerInstance failed for workspace ${workspaceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return saved;
  }

  async sendTextMessage(
    workspaceId: string,
    phoneNumber: string,
    text: string,
  ): Promise<string> {
    const instanceName = `ws_${workspaceId}`;

    const { data } = await this.callWithRetry(() =>
      this.evolutionClient.post(`/message/sendText/${instanceName}`, {
        number: phoneNumber,
        text: { body: text },
      }),
    );

    return (data as { key?: { id?: string } }).key?.id ?? '';
  }

  async sendTemplateMessage(
    workspaceId: string,
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    components: object[],
  ): Promise<string> {
    const instanceName = `ws_${workspaceId}`;

    const { data } = await this.callWithRetry(() =>
      this.evolutionClient.post(`/message/sendTemplate/${instanceName}`, {
        number: phoneNumber,
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    );

    return (data as { key?: { id?: string } }).key?.id ?? '';
  }

  async checkConnectionStatus(
    workspaceId: string,
  ): Promise<WhatsappConnectionStatus> {
    const instanceName = `ws_${workspaceId}`;

    try {
      const { data } = await this.evolutionClient.get(
        `/instance/connectionState/${instanceName}`,
      );

      const state = (data as { instance?: { state?: string } }).instance?.state;

      const status =
        state === 'open'
          ? WhatsappConnectionStatus.CONNECTED
          : WhatsappConnectionStatus.DISCONNECTED;

      await this.instanceRepo.update({ workspaceId }, { connectionStatus: status });

      return status;
    } catch {
      return WhatsappConnectionStatus.DISCONNECTED;
    }
  }

  async markAsRead(
    workspaceId: string,
    remoteJid: string,
    messageId: string,
  ): Promise<void> {
    const instanceName = `ws_${workspaceId}`;

    await this.callWithRetry(() =>
      this.evolutionClient.put(`/message/markAsRead/${instanceName}`, {
        remoteJid,
        messageId,
      }),
    ).catch((err) => {
      this.logger.warn(
        `markAsRead failed for ${messageId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
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
