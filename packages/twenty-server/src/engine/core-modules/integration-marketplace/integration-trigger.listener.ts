// FORK: Voka CRM — Fase 16: Integration trigger listener
import { Injectable, Logger } from '@nestjs/common';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { type ObjectRecordUpdateEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

import { IntegrationMarketplaceService } from './integration-marketplace.service';
import { SlackNotificationService } from './slack-notification.service';

@Injectable()
export class IntegrationTriggerListener {
  private readonly logger = new Logger(IntegrationTriggerListener.name);

  constructor(
    private readonly integrationService: IntegrationMarketplaceService,
    private readonly slackService: SlackNotificationService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async onOpportunityCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<OpportunityWorkspaceEntity>
    >,
  ): Promise<void> {
    for (const event of payload.events) {
      const opp = event.properties.after as {
        id: string;
        name?: string;
        stage?: string;
      };
      // Slack
      this.slackService
        .notifyOpportunityCreated(payload.workspaceId, opp)
        .catch((e) => this.logger.warn(e.message));

      // Generic webhooks (Zapier, n8n, Google Sheets)
      await this.fireGenericWebhooks(payload.workspaceId, 'opportunity.created', {
        id: opp.id,
        name: opp.name,
        stage: opp.stage,
      });
    }
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async onOpportunityUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>
    >,
  ): Promise<void> {
    for (const event of payload.events) {
      const after = event.properties.after as {
        id: string;
        name?: string;
        stage?: string;
      };
      const before = event.properties.before as { stage?: string };

      if (before.stage !== after.stage) {
        this.slackService
          .notifyOpportunityStageChanged(
            payload.workspaceId,
            after,
            before.stage ?? '',
          )
          .catch((e) => this.logger.warn(e.message));

        await this.fireGenericWebhooks(
          payload.workspaceId,
          'opportunity.stage_changed',
          { id: after.id, name: after.name, stage: after.stage, previousStage: before.stage },
        );
      }
    }
  }

  private async fireGenericWebhooks(
    workspaceId: string,
    event: string,
    data: object,
  ): Promise<void> {
    const integrations = await this.integrationService.listInstalled(workspaceId);
    const targets = integrations.filter(
      (i) => i.enabled && i.integrationKey !== 'slack',
    );

    const axios = (await import('axios')).default;

    for (const inst of targets) {
      const url =
        (inst.config as Record<string, string>).webhookUrl ??
        (inst.config as Record<string, string>).catchHookUrl;
      if (!url) continue;
      axios
        .post(url, { event, workspaceId, data, timestamp: new Date().toISOString() }, {
          timeout: 5000,
        })
        .catch((e) =>
          this.logger.warn(`${inst.integrationKey} webhook failed: ${e.message}`),
        );
    }
  }
}
