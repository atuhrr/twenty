// FORK: Voka CRM — Fase 13: listen to workspace events and fire automation rules
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { type ObjectRecordUpdateEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type WhatsappMessageReceivedEvent } from 'src/engine/core-modules/whatsapp/whatsapp-webhook.job';

import { AutomationExecutorService } from './automation-executor.service';
import { AutomationService } from './automation.service';
import { type AutomationCondition } from './automation-rule.entity';

@Injectable()
export class AutomationTriggerListener {
  private readonly logger = new Logger(AutomationTriggerListener.name);

  constructor(
    private readonly automationService: AutomationService,
    private readonly executorService: AutomationExecutorService,
  ) {}

  // ── Trigger: LEAD_CREATED + LEAD_UNCLASSIFIED ────────────────────────────

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async onOpportunityCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<OpportunityWorkspaceEntity>
    >,
  ): Promise<void> {
    const [createdRules, unclassifiedRules] = await Promise.all([
      this.automationService.findActiveByTrigger(payload.workspaceId, 'LEAD_CREATED'),
      this.automationService.findActiveByTrigger(payload.workspaceId, 'LEAD_UNCLASSIFIED'),
    ]);

    for (const event of payload.events) {
      const record = event.properties.after as unknown as Record<string, unknown>;
      const recordId = event.recordId;

      for (const rule of createdRules) {
        if (!this.evaluateConditions(rule.conditions, record)) {
          await this.automationService.recordExecution(
            rule.id, payload.workspaceId, recordId, 'SKIPPED',
          );
          continue;
        }
        await this.executeRule(rule, { workspaceId: payload.workspaceId, recordId, record });
      }

      // LEAD_UNCLASSIFIED: fires when no stage is set on creation
      const stage = record['stage'];
      const isUnclassified = !stage || stage === '' || stage === 'UNCLASSIFIED';

      if (isUnclassified && unclassifiedRules.length > 0) {
        for (const rule of unclassifiedRules) {
          if (!this.evaluateConditions(rule.conditions, record)) {
            await this.automationService.recordExecution(
              rule.id, payload.workspaceId, recordId, 'SKIPPED',
            );
            continue;
          }
          await this.executeRule(rule, { workspaceId: payload.workspaceId, recordId, record });
        }
      }
    }
  }

  // ── Trigger: STAGE_CHANGED ────────────────────────────────────────────────

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async onOpportunityUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>
    >,
  ): Promise<void> {
    const stageChangedRules = await this.automationService.findActiveByTrigger(
      payload.workspaceId,
      'STAGE_CHANGED',
    );

    for (const event of payload.events) {
      const { after, before, updatedFields } = event.properties;

      // ── STAGE_CHANGED ──────────────────────────────────────────────────
      if (updatedFields.includes('stage') && stageChangedRules.length > 0) {
        const record = after as unknown as Record<string, unknown>;
        const recordId = event.recordId;

        for (const rule of stageChangedRules) {
          const { fromStage, toStage } = rule.triggerConfig;

          if (toStage && String(record['stage']) !== toStage) continue;
          if (fromStage && String((before as unknown as Record<string, unknown>)['stage']) !== fromStage) continue;

          if (!this.evaluateConditions(rule.conditions, record)) {
            await this.automationService.recordExecution(
              rule.id, payload.workspaceId, recordId, 'SKIPPED',
            );
            continue;
          }

          await this.executeRule(rule, {
            workspaceId: payload.workspaceId,
            recordId,
            record,
          });
        }
      }
    }
  }

  // ── Helper: evaluate conditions ───────────────────────────────────────────

  private evaluateConditions(
    conditions: AutomationCondition[],
    record: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((cond) => {
      const fieldValue = record[cond.field];

      switch (cond.operator) {
        case 'eq':
          return fieldValue === cond.value;
        case 'neq':
          return fieldValue !== cond.value;
        case 'contains':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().includes(String(cond.value).toLowerCase());
        case 'notContains':
          return !(
            typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().includes(String(cond.value).toLowerCase())
          );
        case 'exists':
          return fieldValue != null && fieldValue !== '';
        default:
          return true;
      }
    });
  }

  // ── Trigger: MESSAGE_RECEIVED ─────────────────────────────────────────────

  @OnEvent('whatsapp.message.received')
  async onWhatsappMessageReceived(
    event: WhatsappMessageReceivedEvent,
  ): Promise<void> {
    const rules = await this.automationService.findActiveByTrigger(
      event.workspaceId,
      'MESSAGE_RECEIVED',
    );

    if (rules.length === 0) return;

    const record: Record<string, unknown> = {
      contactId: event.contactId,
      phone: event.phone,
      text: event.text,
    };

    for (const rule of rules) {
      if (!this.evaluateConditions(rule.conditions, record)) {
        await this.automationService.recordExecution(
          rule.id, event.workspaceId, event.contactId, 'SKIPPED',
        );
        continue;
      }
      await this.executeRule(rule, {
        workspaceId: event.workspaceId,
        recordId: event.contactId,
        record,
      });
    }
  }

  // ── Helper: execute all actions of a rule ─────────────────────────────────

  private async executeRule(
    rule: { id: string; name: string; actions: AutomationCondition[] | AutomationRuleActions },
    ctx: { workspaceId: string; recordId: string; record: Record<string, unknown> },
  ): Promise<void> {
    const actions = rule.actions as Array<{ type: string; config: Record<string, unknown> }>;
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMsg: string | undefined;

    for (const action of actions) {
      try {
        await this.executorService.executeAction(
          action as never,
          ctx,
        );
      } catch (err) {
        this.logger.error(
          `[Automation] Rule "${rule.name}" action ${action.type} failed: ${String(err)}`,
        );
        status = 'FAILED';
        errorMsg = String(err);
      }
    }

    await this.automationService.recordExecution(
      rule.id,
      ctx.workspaceId,
      ctx.recordId,
      status,
      errorMsg,
    );
  }
}

// Workaround for private type reference
type AutomationRuleActions = Array<{ type: string; config: Record<string, unknown> }>;
