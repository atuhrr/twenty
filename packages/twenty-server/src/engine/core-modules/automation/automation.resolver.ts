// FORK: Voka CRM — Fase 13
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { AutomationService } from './automation.service';
import {
  AutomationExecutionDTO,
  AutomationRuleDTO,
} from './dtos/automation.dto';
import {
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from './dtos/automation-rule.input';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class AutomationResolver {
  constructor(private readonly automationService: AutomationService) {}

  @Query(() => [AutomationRuleDTO])
  async automationRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<AutomationRuleDTO[]> {
    return this.automationService.list(workspace.id);
  }

  @Query(() => [AutomationExecutionDTO])
  async automationExecutions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('ruleId', { type: () => String }) ruleId: string,
  ): Promise<AutomationExecutionDTO[]> {
    return this.automationService.listExecutions(workspace.id, ruleId);
  }

  @Mutation(() => AutomationRuleDTO)
  async createAutomationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input', { type: () => CreateAutomationRuleInput })
    input: CreateAutomationRuleInput,
  ): Promise<AutomationRuleDTO> {
    return this.automationService.create(workspace.id, input);
  }

  @Mutation(() => AutomationRuleDTO)
  async updateAutomationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input', { type: () => UpdateAutomationRuleInput })
    input: UpdateAutomationRuleInput,
  ): Promise<AutomationRuleDTO> {
    return this.automationService.update(workspace.id, input);
  }

  @Mutation(() => Boolean)
  async deleteAutomationRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id', { type: () => String }) id: string,
  ): Promise<boolean> {
    return this.automationService.delete(workspace.id, id);
  }
}
