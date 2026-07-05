// FORK: Voka CRM — Fase 9: SSE endpoint for real-time WhatsApp messages
import { Controller, Sse, UseGuards, UsePipes } from '@nestjs/common';
import { Observable } from 'rxjs';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';

@Controller('whatsapp/sse')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class WhatsappSseController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Sse('events')
  streamEvents(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Observable<{ data: string }> {
    return this.whatsappService.subscribeToWorkspaceMessages(workspace.id);
  }
}
