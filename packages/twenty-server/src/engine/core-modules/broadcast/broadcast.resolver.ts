// FORK: Voka CRM — Fase 12
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { BroadcastService } from './broadcast.service';
import {
  BroadcastCampaignDTO,
  BroadcastRecipientDTO,
  CreateBroadcastCampaignInput,
} from './dtos/broadcast-campaign.dto';

// FORK: Zellate — usa @AuthWorkspace (workspace.id) e não user.defaultWorkspaceId:
// este último vem nulo nesta versão e quebrava o INSERT (workspaceId not-null).
@Resolver()
@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
export class BroadcastResolver {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Query(() => [BroadcastCampaignDTO])
  async broadcastCampaigns(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<BroadcastCampaignDTO[]> {
    return this.broadcastService.listCampaigns(workspace.id);
  }

  @Query(() => BroadcastCampaignDTO, { nullable: true })
  async broadcastCampaign(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastCampaignDTO | null> {
    return this.broadcastService.getCampaign(workspace.id, campaignId);
  }

  @Query(() => [BroadcastRecipientDTO])
  async broadcastCampaignRecipients(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastRecipientDTO[]> {
    return this.broadcastService.getCampaignRecipients(
      workspace.id,
      campaignId,
    );
  }

  @Mutation(() => BroadcastCampaignDTO)
  async createBroadcastCampaign(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateBroadcastCampaignInput,
  ): Promise<BroadcastCampaignDTO> {
    return this.broadcastService.createCampaign(workspace.id, input);
  }

  @Mutation(() => BroadcastCampaignDTO)
  async launchBroadcastCampaign(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastCampaignDTO> {
    return this.broadcastService.launchCampaign(workspace.id, campaignId);
  }

  @Mutation(() => Boolean)
  async cancelBroadcastCampaign(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<boolean> {
    return this.broadcastService.cancelCampaign(workspace.id, campaignId);
  }
}
