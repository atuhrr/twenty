// FORK: Voka CRM — Fase 18/19: motivos de perda REST API
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { type Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { LossReasonsService } from './loss-reasons.service';

@Controller('metadata/loss-reasons')
@UseGuards(WorkspaceAuthGuard)
export class LossReasonsController {
  constructor(private readonly lossReasonsService: LossReasonsService) {}

  @Get()
  findAll(@AuthWorkspace() workspace: Workspace) {
    return this.lossReasonsService.findAll(workspace.id);
  }

  @Post()
  create(
    @AuthWorkspace() workspace: Workspace,
    @Body() dto: { label: string; position?: number },
  ) {
    return this.lossReasonsService.create(workspace.id, dto);
  }

  @Put(':id')
  update(
    @AuthWorkspace() workspace: Workspace,
    @Param('id') id: string,
    @Body() dto: Partial<{ label: string; position: number }>,
  ) {
    return this.lossReasonsService.update(workspace.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@AuthWorkspace() workspace: Workspace, @Param('id') id: string) {
    return this.lossReasonsService.remove(workspace.id, id);
  }
}
