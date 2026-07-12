// FORK: Zellate — F4: mutation autenticada para enviar o orçamento pelo WhatsApp
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { OrcamentoEnvioDTO } from './dtos/orcamento.dto';
import { OrcamentoService } from './orcamento.service';

@Resolver()
@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
export class OrcamentoResolver {
  constructor(private readonly service: OrcamentoService) {}

  @Mutation(() => OrcamentoEnvioDTO)
  async enviarOrcamento(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('leadId') leadId: string,
    @Args('baseUrl') baseUrl: string,
  ): Promise<OrcamentoEnvioDTO> {
    return this.service.enviarPorWhatsapp(ws.id, leadId, baseUrl);
  }
}
