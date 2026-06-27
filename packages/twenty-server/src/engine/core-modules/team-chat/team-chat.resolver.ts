// FORK: Voka CRM — Fase 10: team chat GraphQL API
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { TeamChatMessageDTO } from 'src/engine/core-modules/team-chat/dtos/team-chat-message.dto';
import { SendTeamChatMessageInput } from 'src/engine/core-modules/team-chat/dtos/send-team-chat-message.input';
import { TeamChatService } from 'src/engine/core-modules/team-chat/team-chat.service';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class TeamChatResolver {
  constructor(private readonly teamChatService: TeamChatService) {}

  @Query(() => [TeamChatMessageDTO])
  async teamChatMessages(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('relatedRecordId', { nullable: true }) relatedRecordId?: string,
  ): Promise<TeamChatMessageDTO[]> {
    return this.teamChatService.getMessages(
      workspace.id,
      relatedRecordId ?? null,
    );
  }

  @Mutation(() => TeamChatMessageDTO)
  async sendTeamChatMessage(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
    @Args('input') input: SendTeamChatMessageInput,
  ): Promise<TeamChatMessageDTO> {
    return this.teamChatService.sendMessage({
      workspaceId: workspace.id,
      senderId: user.id,
      senderName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      relatedRecordId: input.relatedRecordId ?? null,
      relatedRecordType: input.relatedRecordType ?? null,
      content: input.content,
    });
  }
}
