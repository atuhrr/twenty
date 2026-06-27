// FORK: Voka CRM — Fase 10
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TeamChatMessageEntity } from 'src/engine/core-modules/team-chat/team-chat-message.entity';
import { TeamChatResolver } from 'src/engine/core-modules/team-chat/team-chat.resolver';
import { TeamChatService } from 'src/engine/core-modules/team-chat/team-chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamChatMessageEntity])],
  providers: [TeamChatService, TeamChatResolver],
  exports: [TeamChatService],
})
export class TeamChatModule {}
