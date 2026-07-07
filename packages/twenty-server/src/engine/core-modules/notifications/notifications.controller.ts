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
import { type Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { NotificationsService } from './notifications.service';

@Controller('metadata/notifications')
@UseGuards(WorkspaceAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findRecent(@AuthWorkspace() workspace: Workspace) {
    return this.service.findRecent(workspace.id);
  }

  @Get('unread-count')
  async unreadCount(@AuthWorkspace() workspace: Workspace) {
    return { count: await this.service.unreadCount(workspace.id) };
  }

  @Post()
  create(
    @AuthWorkspace() workspace: Workspace,
    @Body() dto: { title: string; body?: string; type?: string; link?: string },
  ) {
    return this.service.create(workspace.id, dto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @AuthWorkspace() workspace: Workspace,
    @Param('id') id: string,
  ) {
    await this.service.markRead(workspace.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@AuthWorkspace() workspace: Workspace) {
    await this.service.markAllRead(workspace.id);
  }
}
