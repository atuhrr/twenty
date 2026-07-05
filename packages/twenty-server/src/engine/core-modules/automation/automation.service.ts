// FORK: Voka CRM — Fase 13
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AutomationExecutionEntity } from './automation-execution.entity';
import { AutomationRuleEntity } from './automation-rule.entity';
import {
  AutomationExecutionDTO,
  AutomationRuleDTO,
} from './dtos/automation.dto';
import {
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from './dtos/automation-rule.input';

@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationRuleEntity)
    private readonly ruleRepo: Repository<AutomationRuleEntity>,
    @InjectRepository(AutomationExecutionEntity)
    private readonly execRepo: Repository<AutomationExecutionEntity>,
  ) {}

  private toDTO(r: AutomationRuleEntity): AutomationRuleDTO {
    return {
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      triggerType: r.triggerType,
      triggerConfig: r.triggerConfig,
      conditions: r.conditions,
      actions: r.actions,
      enabled: r.enabled,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private execToDTO(e: AutomationExecutionEntity): AutomationExecutionDTO {
    return {
      id: e.id,
      ruleId: e.ruleId,
      workspaceId: e.workspaceId,
      recordId: e.recordId,
      status: e.status,
      error: e.error,
      executedAt: e.executedAt.toISOString(),
    };
  }

  async list(workspaceId: string): Promise<AutomationRuleDTO[]> {
    const rules = await this.ruleRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });

    return rules.map((r) => this.toDTO(r));
  }

  async create(
    workspaceId: string,
    input: CreateAutomationRuleInput,
  ): Promise<AutomationRuleDTO> {
    const rule = this.ruleRepo.create({
      workspaceId,
      name: input.name,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig ?? {},
      conditions: (input.conditions ?? []) as AutomationRuleEntity['conditions'],
      actions: (input.actions ?? []) as AutomationRuleEntity['actions'],
      enabled: true,
    });
    const saved = await this.ruleRepo.save(rule);

    return this.toDTO(saved);
  }

  async update(
    workspaceId: string,
    input: UpdateAutomationRuleInput,
  ): Promise<AutomationRuleDTO> {
    const rule = await this.ruleRepo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });

    if (input.name !== undefined) rule.name = input.name;
    if (input.triggerConfig !== undefined)
      rule.triggerConfig = input.triggerConfig as AutomationRuleEntity['triggerConfig'];
    if (input.conditions !== undefined)
      rule.conditions = input.conditions as AutomationRuleEntity['conditions'];
    if (input.actions !== undefined)
      rule.actions = input.actions as AutomationRuleEntity['actions'];
    if (input.enabled !== undefined) rule.enabled = input.enabled;

    const saved = await this.ruleRepo.save(rule);

    return this.toDTO(saved);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.ruleRepo.delete({ id, workspaceId });

    return (result.affected ?? 0) > 0;
  }

  async findActiveByTrigger(
    workspaceId: string,
    triggerType: string,
  ): Promise<AutomationRuleEntity[]> {
    return this.ruleRepo.find({
      where: { workspaceId, triggerType, enabled: true },
    });
  }

  async recordExecution(
    ruleId: string,
    workspaceId: string,
    recordId: string,
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    error?: string,
  ): Promise<void> {
    const exec = this.execRepo.create({
      ruleId,
      workspaceId,
      recordId,
      status,
      error: error ?? null,
    });

    await this.execRepo.save(exec);
  }

  async listExecutions(
    workspaceId: string,
    ruleId: string,
  ): Promise<AutomationExecutionDTO[]> {
    const execs = await this.execRepo.find({
      where: { ruleId, workspaceId },
      order: { executedAt: 'DESC' },
      take: 100,
    });

    return execs.map((e) => this.execToDTO(e));
  }
}
