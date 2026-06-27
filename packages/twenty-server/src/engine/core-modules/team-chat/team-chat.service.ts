// FORK: Voka CRM — Fase 10
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { TeamChatMessageEntity } from 'src/engine/core-modules/team-chat/team-chat-message.entity';
import { TeamChatMessageDTO } from 'src/engine/core-modules/team-chat/dtos/team-chat-message.dto';

@Injectable()
export class TeamChatService {
  constructor(
    @InjectRepository(TeamChatMessageEntity)
    private readonly msgRepo: Repository<TeamChatMessageEntity>,
  ) {}

  async getMessages(
    workspaceId: string,
    relatedRecordId: string | null,
  ): Promise<TeamChatMessageDTO[]> {
    return this.msgRepo.find({
      where: { workspaceId, relatedRecordId: relatedRecordId ?? undefined },
      order: { createdAt: 'ASC' },
      take: 200,
    });
  }

  async sendMessage(params: {
    workspaceId: string;
    senderId: string;
    senderName: string;
    relatedRecordId: string | null;
    relatedRecordType: string | null;
    content: string;
  }): Promise<TeamChatMessageDTO> {
    const entity = this.msgRepo.create({
      workspaceId: params.workspaceId,
      senderId: params.senderId,
      senderName: params.senderName,
      relatedRecordId: params.relatedRecordId,
      relatedRecordType: params.relatedRecordType,
      content: params.content,
    });

    return this.msgRepo.save(entity);
  }
}
