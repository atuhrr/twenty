// FORK: Voka CRM — Fase C: notificações REST API
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NotificationsService } from './notifications.service';

@Controller('metadata/notifications')
@UseGuards(WorkspaceAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findRecent(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.service.findRecent(workspace.id);
  }

  @Get('unread-count')
  async unreadCount(@AuthWorkspace() workspace: WorkspaceEntity) {
    return { count: await this.service.unreadCount(workspace.id) };
  }

  @Post()
  create(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: { title: string; body?: string; type?: string; link?: string },
  ) {
    return this.service.create(workspace.id, dto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
  ) {
    await this.service.markRead(workspace.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@AuthWorkspace() workspace: WorkspaceEntity) {
    await this.service.markAllRead(workspace.id);
  }
}
