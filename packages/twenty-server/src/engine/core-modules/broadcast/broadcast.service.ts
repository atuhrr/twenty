// FORK: Voka CRM — Fase 12: broadcast campaign service
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

import {
  BroadcastCampaignEntity,
  BroadcastCampaignStatus,
} from './broadcast-campaign.entity';
import {
  BroadcastRecipientEntity,
  BroadcastRecipientStatus,
} from './broadcast-recipient.entity';
import {
  BroadcastCampaignDTO,
  BroadcastRecipientDTO,
  CreateBroadcastCampaignInput,
} from './dtos/broadcast-campaign.dto';

const WHATSAPP_API_VERSION = 'v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
const SEND_DELAY_MS = 1000; // 1 msg/s to avoid rate limits

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(BroadcastCampaignEntity)
    private readonly campaignRepo: Repository<BroadcastCampaignEntity>,
    @InjectRepository(BroadcastRecipientEntity)
    private readonly recipientRepo: Repository<BroadcastRecipientEntity>,
  ) {}

  private toDTO(c: BroadcastCampaignEntity): BroadcastCampaignDTO {
    return {
      id: c.id,
      workspaceId: c.workspaceId,
      name: c.name,
      channel: c.channel,
      status: c.status,
      templateName: c.templateName,
      languageCode: c.languageCode,
      scheduledAt: c.scheduledAt?.toISOString() ?? null,
      startedAt: c.startedAt?.toISOString() ?? null,
      completedAt: c.completedAt?.toISOString() ?? null,
      totalCount: c.totalCount,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount,
      readCount: c.readCount,
      failedCount: c.failedCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  private recipientToDTO(r: BroadcastRecipientEntity): BroadcastRecipientDTO {
    return {
      id: r.id,
      campaignId: r.campaignId,
      contactId: r.contactId,
      phoneNumber: r.phoneNumber,
      status: r.status,
      sentAt: r.sentAt?.toISOString() ?? null,
      deliveredAt: r.deliveredAt?.toISOString() ?? null,
      readAt: r.readAt?.toISOString() ?? null,
      errorMessage: r.errorMessage,
    };
  }

  async listCampaigns(workspaceId: string): Promise<BroadcastCampaignDTO[]> {
    const campaigns = await this.campaignRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });

    return campaigns.map((c) => this.toDTO(c));
  }

  async getCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<BroadcastCampaignDTO | null> {
    const c = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
    });

    return c ? this.toDTO(c) : null;
  }

  async getCampaignRecipients(
    workspaceId: string,
    campaignId: string,
  ): Promise<BroadcastRecipientDTO[]> {
    const rows = await this.recipientRepo.find({
      where: { campaignId, workspaceId },
      order: { status: 'ASC' },
      take: 500,
    });

    return rows.map((r) => this.recipientToDTO(r));
  }

  async createCampaign(
    workspaceId: string,
    input: CreateBroadcastCampaignInput,
  ): Promise<BroadcastCampaignDTO> {
    const campaign = this.campaignRepo.create({
      workspaceId,
      name: input.name,
      templateName: input.templateName ?? null,
      languageCode: input.languageCode ?? 'pt_BR',
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      status: BroadcastCampaignStatus.DRAFT,
      totalCount: input.recipients.length,
    });

    const saved = await this.campaignRepo.save(campaign);

    const recipientEntities = input.recipients.map((r) =>
      this.recipientRepo.create({
        campaignId: saved.id,
        workspaceId,
        phoneNumber: r.phoneNumber,
        contactId: r.contactId ?? null,
        status: BroadcastRecipientStatus.PENDING,
      }),
    );

    await this.recipientRepo.save(recipientEntities);

    return this.toDTO(saved);
  }

  async cancelCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<boolean> {
    const c = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
    });

    if (!c) return false;
    if (
      c.status === BroadcastCampaignStatus.COMPLETED ||
      c.status === BroadcastCampaignStatus.CANCELLED
    )
      return false;

    await this.campaignRepo.update(campaignId, {
      status: BroadcastCampaignStatus.CANCELLED,
    });

    return true;
  }

  async launchCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<BroadcastCampaignDTO> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
    });

    if (!campaign) throw new Error('Campanha não encontrada');
    if (campaign.status !== BroadcastCampaignStatus.DRAFT)
      throw new Error('Apenas campanhas com status DRAFT podem ser enviadas');
    if (!campaign.templateName)
      throw new Error('Template obrigatório para disparo');

    await this.campaignRepo.update(campaignId, {
      status: BroadcastCampaignStatus.RUNNING,
      startedAt: new Date(),
    });

    // Run async — no await so resolver returns fast
    void this.processRecipients(campaign);

    const updated = await this.campaignRepo.findOneOrFail({
      where: { id: campaignId },
    });

    return this.toDTO(updated);
  }

  private async processRecipients(
    campaign: BroadcastCampaignEntity,
  ): Promise<void> {
    const recipients = await this.recipientRepo.find({
      where: {
        campaignId: campaign.id,
        status: BroadcastRecipientStatus.PENDING,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await this.sendTemplate(
          recipient.phoneNumber,
          campaign.templateName!,
          campaign.languageCode,
        );
        await this.recipientRepo.update(recipient.id, {
          status: BroadcastRecipientStatus.SENT,
          sentAt: new Date(),
        });
        sent++;
      } catch (err) {
        this.logger.error(
          `Broadcast send failed for ${recipient.phoneNumber}: ${String(err)}`,
        );
        await this.recipientRepo.update(recipient.id, {
          status: BroadcastRecipientStatus.FAILED,
          errorMessage: String(err),
        });
        failed++;
      }

      // Rate-limit: 1 msg/s
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }

    await this.campaignRepo.update(campaign.id, {
      status: BroadcastCampaignStatus.COMPLETED,
      completedAt: new Date(),
      sentCount: sent,
      failedCount: failed,
    });
  }

  private async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
  ): Promise<void> {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      },
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        timeout: 10_000,
      },
    );
  }
}
