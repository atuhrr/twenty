// FORK: Voka CRM — Fase 12
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

import { BroadcastService } from './broadcast.service';
import {
  BroadcastCampaignDTO,
  BroadcastRecipientDTO,
  CreateBroadcastCampaignInput,
} from './dtos/broadcast-campaign.dto';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class BroadcastResolver {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Query(() => [BroadcastCampaignDTO])
  async broadcastCampaigns(
    @AuthUser() user: UserEntity,
  ): Promise<BroadcastCampaignDTO[]> {
    return this.broadcastService.listCampaigns(user.defaultWorkspaceId);
  }

  @Query(() => BroadcastCampaignDTO, { nullable: true })
  async broadcastCampaign(
    @AuthUser() user: UserEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastCampaignDTO | null> {
    return this.broadcastService.getCampaign(
      user.defaultWorkspaceId,
      campaignId,
    );
  }

  @Query(() => [BroadcastRecipientDTO])
  async broadcastCampaignRecipients(
    @AuthUser() user: UserEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastRecipientDTO[]> {
    return this.broadcastService.getCampaignRecipients(
      user.defaultWorkspaceId,
      campaignId,
    );
  }

  @Mutation(() => BroadcastCampaignDTO)
  async createBroadcastCampaign(
    @AuthUser() user: UserEntity,
    @Args('input') input: CreateBroadcastCampaignInput,
  ): Promise<BroadcastCampaignDTO> {
    return this.broadcastService.createCampaign(
      user.defaultWorkspaceId,
      input,
    );
  }

  @Mutation(() => BroadcastCampaignDTO)
  async launchBroadcastCampaign(
    @AuthUser() user: UserEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<BroadcastCampaignDTO> {
    return this.broadcastService.launchCampaign(
      user.defaultWorkspaceId,
      campaignId,
    );
  }

  @Mutation(() => Boolean)
  async cancelBroadcastCampaign(
    @AuthUser() user: UserEntity,
    @Args('campaignId') campaignId: string,
  ): Promise<boolean> {
    return this.broadcastService.cancelCampaign(
      user.defaultWorkspaceId,
      campaignId,
    );
  }
}
