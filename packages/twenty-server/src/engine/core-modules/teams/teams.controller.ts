// FORK: Voka CRM — Fase 18: equipes REST API
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { TeamsService } from './teams.service';

@Controller('metadata/teams')
@UseGuards(WorkspaceAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@AuthWorkspace() workspace: Workspace) {
    return this.teamsService.findAll(workspace.id);
  }

  @Get(':id')
  async findOne(@AuthWorkspace() workspace: Workspace, @Param('id') id: string) {
    const team = await this.teamsService.findOne(workspace.id, id);

    if (!team) throw new NotFoundException('Equipe não encontrada');

    return team;
  }

  @Post()
  create(
    @AuthWorkspace() workspace: Workspace,
    @Body() dto: { name: string; description?: string; memberIds?: string[] },
  ) {
    return this.teamsService.create(workspace.id, dto);
  }

  @Put(':id')
  update(
    @AuthWorkspace() workspace: Workspace,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; memberIds: string[] }>,
  ) {
    return this.teamsService.update(workspace.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@AuthWorkspace() workspace: Workspace, @Param('id') id: string) {
    return this.teamsService.remove(workspace.id, id);
  }
}
