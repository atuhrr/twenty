// FORK: Zellate — F4: endpoint PÚBLICO (sem auth) que serve os dados do
// orçamento por token — a página pública da proposta consome este JSON.
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';

import { type Response } from 'express';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

import { OrcamentoService } from './orcamento.service';

// Path distinto do SPA (/orcamento/...) para não colidir: o servidor casaria o
// controller e devolveria JSON em vez da página React da proposta.
@Controller('orcamento-dados')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class OrcamentoController {
  constructor(private readonly service: OrcamentoService) {}

  @Get(':workspaceId/:leadId/:token')
  async getDados(
    @Param('workspaceId') workspaceId: string,
    @Param('leadId') leadId: string,
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (token !== this.service.token(workspaceId, leadId)) {
      res.status(404).json({ erro: 'Orçamento não encontrado' });

      return;
    }

    const dados = await this.service.montarDados(workspaceId, leadId);

    if (!dados) {
      res.status(404).json({ erro: 'Orçamento não encontrado' });

      return;
    }

    res.json(dados);
  }
}
