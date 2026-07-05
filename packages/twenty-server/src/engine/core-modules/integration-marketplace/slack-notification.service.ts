// FORK: Voka CRM — Fase 16: Slack notifications
import { Injectable, Logger } from '@nestjs/common';

import axios from 'axios';

import { IntegrationMarketplaceService } from './integration-marketplace.service';

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);

  constructor(
    private readonly integrationService: IntegrationMarketplaceService,
  ) {}

  async notifyOpportunityCreated(
    workspaceId: string,
    opportunity: { id: string; name?: string; stage?: string },
  ): Promise<void> {
    const installed = await this.integrationService.findInstalled(
      workspaceId,
      'slack',
    );
    if (!installed?.enabled || !installed.config.webhookUrl) return;

    const text = [
      `🆕 *Novo Lead criado!*`,
      `*Nome:* ${opportunity.name ?? '(sem nome)'}`,
      `*Etapa:* ${opportunity.stage ?? 'Novo'}`,
      `*ID:* ${opportunity.id}`,
    ].join('\n');

    await this.post(installed.config.webhookUrl, { text }).catch((err) =>
      this.logger.warn(`Slack notify failed: ${err.message}`),
    );
  }

  async notifyOpportunityStageChanged(
    workspaceId: string,
    opportunity: { id: string; name?: string; stage?: string },
    previousStage: string,
  ): Promise<void> {
    const installed = await this.integrationService.findInstalled(
      workspaceId,
      'slack',
    );
    if (!installed?.enabled || !installed.config.webhookUrl) return;

    const text = [
      `🔄 *Lead atualizado!*`,
      `*Nome:* ${opportunity.name ?? '(sem nome)'}`,
      `*Etapa:* ${previousStage} → ${opportunity.stage ?? '?'}`,
    ].join('\n');

    await this.post(installed.config.webhookUrl, { text }).catch((err) =>
      this.logger.warn(`Slack stage notify failed: ${err.message}`),
    );
  }

  private async post(url: string, body: object): Promise<void> {
    await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  }
}
