import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AssignWhatsappThreadInput } from 'src/engine/core-modules/whatsapp/dtos/assign-whatsapp-thread.input';
import { ConnectWhatsappInput } from 'src/engine/core-modules/whatsapp/dtos/connect-whatsapp.input';
import {
  CreateWhatsappQuickReplyInput,
  WhatsappQuickReplyDTO,
} from 'src/engine/core-modules/whatsapp/dtos/whatsapp-quick-reply.dto';
import { SendWhatsappMessageInput } from 'src/engine/core-modules/whatsapp/dtos/send-whatsapp-message.input';
import { WhatsappConnectionStatusDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-connection-status.dto';
import { WhatsappContactWindowDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-contact-window.dto';
import { WhatsappMessageDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-message.dto';
import { WhatsappThreadSummaryDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-thread-summary.dto';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { WhatsappConnectionStatus } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';
import {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { normalizeBrPhone } from 'src/engine/core-modules/whatsapp/utils/normalize-br-phone.util';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class WhatsappResolver {
  constructor(private readonly whatsappService: WhatsappService) {}

  // FORK: Voka CRM — Fase 9: conversation thread list for the Inbox
  @Query(() => [WhatsappThreadSummaryDTO])
  async whatsappThreads(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappThreadSummaryDTO[]> {
    return this.whatsappService.getThreads(workspace.id);
  }

  @Query(() => [WhatsappMessageDTO])
  async whatsappMessages(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('contactId') contactId: string,
  ): Promise<WhatsappMessageDTO[]> {
    // Delegated to a dedicated method to keep resolver thin
    return this.whatsappService.getMessagesByContact(
      workspace.id,
      contactId,
    );
  }

  @Query(() => WhatsappMessageDTO, { nullable: true })
  async lastWhatsappMessage(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('contactId') contactId: string,
  ): Promise<WhatsappMessageDTO | null> {
    return this.whatsappService.getLastMessageByContact(workspace.id, contactId);
  }

  @Query(() => WhatsappContactWindowDTO)
  async whatsappContactWindow(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('contactId') contactId: string,
  ): Promise<WhatsappContactWindowDTO> {
    return this.whatsappService.getContactWindow(workspace.id, contactId);
  }

  @Query(() => WhatsappConnectionStatusDTO)
  async whatsappConnectionStatus(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappConnectionStatusDTO> {
    const status = await this.whatsappService.checkConnectionStatus(
      workspace.id,
    );
    const instance = await this.whatsappService.getInstance(workspace.id);

    return {
      status,
      displayPhoneNumber: instance?.displayPhoneNumber ?? null,
    };
  }

  // FORK: Voka CRM — Fase 11: quick replies CRUD
  @Query(() => [WhatsappQuickReplyDTO])
  async whatsappQuickReplies(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<WhatsappQuickReplyDTO[]> {
    return this.whatsappService.getQuickReplies(workspace.id);
  }

  @Mutation(() => WhatsappQuickReplyDTO)
  async createWhatsappQuickReply(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateWhatsappQuickReplyInput,
  ): Promise<WhatsappQuickReplyDTO> {
    return this.whatsappService.createQuickReply(workspace.id, input);
  }

  @Mutation(() => Boolean)
  async deleteWhatsappQuickReply(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.whatsappService.deleteQuickReply(workspace.id, id);
  }

  // FORK: Voka CRM — Fase 11: assign (or unassign) a thread to a user
  @Mutation(() => Boolean)
  async assignWhatsappThread(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: AssignWhatsappThreadInput,
  ): Promise<boolean> {
    await this.whatsappService.assignThread(
      workspace.id,
      input.contactId,
      input.assignedUserId ?? null,
      input.assignedUserName ?? null,
    );
    return true;
  }

  @Mutation(() => WhatsappConnectionStatusDTO)
  async connectWhatsapp(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: ConnectWhatsappInput,
  ): Promise<WhatsappConnectionStatusDTO> {
    const instance = await this.whatsappService.registerInstance(
      workspace.id,
      input,
    );

    return {
      status: instance.connectionStatus,
      displayPhoneNumber: instance.displayPhoneNumber ?? null,
    };
  }

  @Mutation(() => WhatsappMessageDTO)
  async sendWhatsappMessage(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: SendWhatsappMessageInput,
  ): Promise<WhatsappMessageDTO> {
    const normalizedPhone = normalizeBrPhone(input.phoneNumber);
    const externalId = await this.whatsappService.sendTextMessage(
      workspace.id,
      normalizedPhone,
      input.text,
    );

    const message = await this.whatsappService.dedupeAndSaveMessage({
      workspaceId: workspace.id,
      contactId: input.contactId,
      direction: WhatsappMessageDirection.OUTBOUND,
      type: WhatsappMessageType.TEXT,
      content: input.text,
      mediaUrl: null,
      externalMessageId: externalId || `local_${Date.now()}`,
      status: WhatsappMessageStatus.SENT,
      timestamp: new Date(),
    });

    // message is null only when externalId already existed — return a stub
    const now = new Date();

    return {
      id: message?.id ?? '',
      contactId: input.contactId,
      direction: WhatsappMessageDirection.OUTBOUND,
      type: WhatsappMessageType.TEXT,
      content: input.text,
      mediaUrl: null,
      externalMessageId: externalId,
      status: WhatsappMessageStatus.SENT,
      timestamp: now,
      createdAt: now,
    };
  }
}
