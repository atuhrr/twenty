import { Injectable, Logger } from '@nestjs/common';

import { type ObjectRecordUpdateEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  WhatsappOpportunityStageJob,
  type WhatsappOpportunityStageJobData,
} from 'src/engine/core-modules/whatsapp/jobs/whatsapp-opportunity-stage.job';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

const MEETING_STAGE = 'MEETING';

@Injectable()
export class WhatsappOpportunityStageListener {
  private readonly logger = new Logger(WhatsappOpportunityStageListener.name);

  constructor(
    @InjectMessageQueue(MessageQueue.whatsappQueue)
    private readonly whatsappQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleOpportunityUpdate(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>
    >,
  ): Promise<void> {
    for (const event of payload.events) {
      const { after, before, updatedFields } = event.properties;

      if (!updatedFields.includes('stage')) continue;
      if (after.stage !== MEETING_STAGE) continue;
      // Guard against re-saves that don't change the stage
      if (before.stage === MEETING_STAGE) continue;

      const contactId = after.pointOfContactId;

      if (!contactId) {
        this.logger.debug(
          `Opportunity ${event.recordId} moved to MEETING but has no pointOfContactId — skipping`,
        );
        continue;
      }

      await this.whatsappQueueService.add<WhatsappOpportunityStageJobData>(
        WhatsappOpportunityStageJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: event.recordId,
          contactId,
        },
      );
    }
  }
}
