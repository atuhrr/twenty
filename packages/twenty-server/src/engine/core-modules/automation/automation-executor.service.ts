// FORK: Voka CRM — Fase 13: execute automation actions
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { normalizeBrPhone } from 'src/engine/core-modules/whatsapp/utils/normalize-br-phone.util';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type AutomationAction } from './automation-rule.entity';

export type AutomationContext = {
  workspaceId: string;
  recordId: string;
  record: Record<string, unknown>;
};

@Injectable()
export class AutomationExecutorService {
  private readonly logger = new Logger(AutomationExecutorService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly whatsappService: WhatsappService,
  ) {}

  async executeAction(
    action: AutomationAction,
    ctx: AutomationContext,
  ): Promise<void> {
    switch (action.type) {
      case 'CREATE_TASK':
        await this.createTask(action.config, ctx);
        break;
      case 'SEND_TEMPLATE':
        await this.sendTemplate(action.config, ctx);
        break;
      case 'MOVE_STAGE':
        await this.moveStage(action.config, ctx);
        break;
      case 'WEBHOOK':
        await this.callWebhook(action.config, ctx);
        break;
      case 'ASSIGN_USER':
        await this.assignUser(action.config, ctx);
        break;
      default:
        this.logger.warn(`Unknown action type: ${(action as AutomationAction).type}`);
    }
  }

  private async createTask(
    config: Record<string, unknown>,
    ctx: AutomationContext,
  ): Promise<void> {
    const title = String(config['title'] ?? 'Tarefa automática');
    const dueInMinutes = Number(config['dueInMinutes'] ?? 60);
    const dueAt = new Date(Date.now() + dueInMinutes * 60_000);

    const authContext = buildSystemAuthContext(ctx.workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const taskRepo =
        await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
          ctx.workspaceId,
          'task',
          { shouldBypassPermissionChecks: true },
        );

      await taskRepo.save({
        title,
        status: 'TODO',
        dueAt,
        createdBy: { source: 'SYSTEM', name: 'Automação Voka' },
        updatedBy: { source: 'SYSTEM', name: 'Automação Voka' },
      } as never);
    }, authContext);

    this.logger.log(
      `[Automation] CREATE_TASK "${title}" created for record ${ctx.recordId}`,
    );
  }

  private async sendTemplate(
    config: Record<string, unknown>,
    ctx: AutomationContext,
  ): Promise<void> {
    const templateName = String(config['templateName'] ?? '');
    const languageCode = String(config['languageCode'] ?? 'pt_BR');

    if (!templateName) {
      this.logger.warn('[Automation] SEND_TEMPLATE missing templateName — skipped');
      return;
    }

    const contactId = String(
      ctx.record['pointOfContactId'] ?? ctx.record['contactId'] ?? '',
    );

    if (!contactId) {
      this.logger.warn(
        `[Automation] SEND_TEMPLATE: no contactId on record ${ctx.recordId} — skipped`,
      );
      return;
    }

    const phone = await this.resolveContactPhone(ctx.workspaceId, contactId);

    if (!phone) {
      this.logger.warn(
        `[Automation] SEND_TEMPLATE: no phone for contact ${contactId} — skipped`,
      );
      return;
    }

    await this.whatsappService.sendTemplateMessage(
      ctx.workspaceId,
      phone,
      templateName,
      languageCode,
      [],
    );

    this.logger.log(
      `[Automation] SEND_TEMPLATE "${templateName}" sent to ${phone} (record ${ctx.recordId})`,
    );
  }

  private async moveStage(
    config: Record<string, unknown>,
    ctx: AutomationContext,
  ): Promise<void> {
    const toStage = String(config['toStage'] ?? '');

    if (!toStage) return;

    const authContext = buildSystemAuthContext(ctx.workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repo = await this.globalWorkspaceOrmManager.getRepository(
        ctx.workspaceId,
        'opportunity',
        { shouldBypassPermissionChecks: true },
      );

      await repo.update({ id: ctx.recordId } as never, {
        stage: toStage,
      } as never);
    }, authContext);

    this.logger.log(
      `[Automation] MOVE_STAGE → ${toStage} for record ${ctx.recordId}`,
    );
  }

  private async assignUser(
    config: Record<string, unknown>,
    ctx: AutomationContext,
  ): Promise<void> {
    const userId = String(config['userId'] ?? '');

    if (!userId) return;

    const authContext = buildSystemAuthContext(ctx.workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repo = await this.globalWorkspaceOrmManager.getRepository(
        ctx.workspaceId,
        'opportunity',
        { shouldBypassPermissionChecks: true },
      );

      await repo.update({ id: ctx.recordId } as never, {
        assigneeId: userId,
      } as never);
    }, authContext);

    this.logger.log(
      `[Automation] ASSIGN_USER ${userId} to record ${ctx.recordId}`,
    );
  }

  private async callWebhook(
    config: Record<string, unknown>,
    ctx: AutomationContext,
  ): Promise<void> {
    const url = String(config['url'] ?? '');
    const method = String(config['method'] ?? 'POST').toUpperCase();

    if (!url) return;

    await axios.request({
      url,
      method,
      data: { workspaceId: ctx.workspaceId, recordId: ctx.recordId, record: ctx.record },
      timeout: 10_000,
    });

    this.logger.log(`[Automation] WEBHOOK ${method} ${url} for record ${ctx.recordId}`);
  }

  private async resolveContactPhone(
    workspaceId: string,
    contactId: string,
  ): Promise<string | null> {
    const authContext = buildSystemAuthContext(workspaceId);
    let phone: string | null = null;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepo =
        await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
          workspaceId,
          'person',
          { shouldBypassPermissionChecks: true },
        );

      const person = await personRepo.findOne({
        where: { id: contactId },
      } as never);

      if (!person) return;

      const phones = person.phones as {
        primaryPhoneCallingCode?: string;
        primaryPhoneNumber?: string;
      } | null;
      const callingCode = phones?.primaryPhoneCallingCode ?? '';
      const number = phones?.primaryPhoneNumber ?? '';

      if (number) {
        phone = normalizeBrPhone(callingCode.replace('+', '') + number);
      }
    }, authContext);

    return phone;
  }
}
