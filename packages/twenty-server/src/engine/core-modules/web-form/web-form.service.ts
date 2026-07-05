// FORK: Voka CRM — Fase 15
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WebFormEntity } from 'src/engine/core-modules/web-form/web-form.entity';
import { WebFormSubmissionEntity } from 'src/engine/core-modules/web-form/web-form-submission.entity';
import {
  CreateWebFormInput,
  UpdateWebFormInput,
} from 'src/engine/core-modules/web-form/dtos/web-form.input';

@Injectable()
export class WebFormService {
  private readonly logger = new Logger(WebFormService.name);

  constructor(
    @InjectRepository(WebFormEntity)
    private readonly formRepo: Repository<WebFormEntity>,
    @InjectRepository(WebFormSubmissionEntity)
    private readonly submissionRepo: Repository<WebFormSubmissionEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  list(workspaceId: string): Promise<WebFormEntity[]> {
    return this.formRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(workspaceId: string, input: CreateWebFormInput): Promise<WebFormEntity> {
    const form = this.formRepo.create({
      workspaceId,
      name: input.name,
      fields: (input.fields ?? []) as WebFormEntity['fields'],
      funnelId: input.funnelId ?? null,
      publicToken: randomUUID(),
    });

    return this.formRepo.save(form);
  }

  async update(workspaceId: string, input: UpdateWebFormInput): Promise<WebFormEntity> {
    const form = await this.formRepo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });

    if (input.name !== undefined) form.name = input.name;
    if (input.fields !== undefined) form.fields = input.fields as WebFormEntity['fields'];
    if (input.funnelId !== undefined) form.funnelId = input.funnelId ?? null;
    if (input.enabled !== undefined) form.enabled = input.enabled;

    return this.formRepo.save(form);
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    await this.formRepo.delete({ id, workspaceId });

    return true;
  }

  findByToken(token: string): Promise<WebFormEntity | null> {
    return this.formRepo.findOne({ where: { publicToken: token, enabled: true } });
  }

  async handleSubmission(
    token: string,
    data: Record<string, string>,
    source: string,
  ): Promise<{ opportunityId: string | null }> {
    const form = await this.findByToken(token);

    if (!form) throw new NotFoundException('Formulário não encontrado');

    const opportunityId = await this.createLead(form.workspaceId, data, source);

    await this.submissionRepo.save(
      this.submissionRepo.create({
        formId: form.id,
        workspaceId: form.workspaceId,
        data,
        source,
        opportunityId,
      }),
    );

    return { opportunityId };
  }

  async handleChatWidgetSubmission(
    workspaceId: string,
    data: Record<string, string>,
  ): Promise<{ opportunityId: string | null }> {
    const opportunityId = await this.createLead(workspaceId, data, 'CHAT_WIDGET');

    return { opportunityId };
  }

  private async createLead(
    workspaceId: string,
    data: Record<string, string>,
    source: string,
  ): Promise<string | null> {
    try {
      const name =
        data['nome'] ??
        data['name'] ??
        data['Nome'] ??
        `Lead via ${source === 'CHAT_WIDGET' ? 'Widget' : 'Formulário'}`;

      const authContext = buildSystemAuthContext(workspaceId);

      let opportunityId: string | null = null;

      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
        const repo = await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );

        const record = await repo.save({
          name,
          stage: 'NEW',
          createdBy: { source: 'SYSTEM', name: 'Voka Web' },
          updatedBy: { source: 'SYSTEM', name: 'Voka Web' },
        } as never);

        opportunityId = (record as unknown as { id: string }).id;
      }, authContext);

      this.logger.log(
        `[WebForm] Lead criado: ${opportunityId} (source: ${source}, name: ${name})`,
      );

      return opportunityId;
    } catch (err) {
      this.logger.error(
        `[WebForm] Falha ao criar lead: ${err instanceof Error ? err.message : String(err)}`,
      );

      return null;
    }
  }
}
