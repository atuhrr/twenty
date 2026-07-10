// FORK: Zellate — F1 Financeiro: API GraphQL das faturas
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  FaturaEntity,
  FaturaMeios,
} from 'src/engine/core-modules/financeiro/fatura.entity';
import {
  ConectarFinanceiroInput,
  CriarFaturaInput,
  FaturaDTO,
  FaturaResumoDTO,
  FinanceiroStatusDTO,
} from 'src/engine/core-modules/financeiro/dtos/financeiro.dto';
import {
  FinanceiroService,
  numeroDaFatura,
} from 'src/engine/core-modules/financeiro/financeiro.service';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

const paraDTO = (f: FaturaEntity): FaturaDTO => ({
  id: f.id,
  numero: numeroDaFatura(f.numeroSeq),
  leadId: f.leadId,
  clienteNome: f.clienteNome,
  clienteTelefone: f.clienteTelefone,
  descricao: f.descricao,
  valorCentavos: f.valorCentavos,
  vencimento: f.vencimento,
  meios: f.meios,
  status: f.status,
  linkPagamento: f.linkPagamento,
  pixPayload: f.pixPayload,
  pagaEm: f.pagaEm,
  formaPagamento: f.formaPagamento,
  createdAt: f.createdAt,
});

// Financeiro é acessível a qualquer membro do workspace
@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@Resolver()
@UsePipes(ResolverValidationPipe)
export class FinanceiroResolver {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Query(() => FinanceiroStatusDTO)
  async financeiroStatus(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FinanceiroStatusDTO> {
    const conta = await this.financeiroService.status(workspace.id);

    return {
      conectado: conta != null,
      nomeConta: conta?.nomeConta ?? null,
      ambiente: conta?.ambiente ?? null,
      statusConta: conta?.statusConta ?? null,
    };
  }

  @Mutation(() => FinanceiroStatusDTO)
  async conectarFinanceiro(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: ConectarFinanceiroInput,
  ): Promise<FinanceiroStatusDTO> {
    const conta = await this.financeiroService.conectar(
      workspace.id,
      input.apiKey.trim(),
      input.ambiente,
    );

    return {
      conectado: true,
      nomeConta: conta.nomeConta,
      ambiente: conta.ambiente,
      statusConta: conta.statusConta,
    };
  }

  @Query(() => [FaturaDTO])
  async faturas(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FaturaDTO[]> {
    const lista = await this.financeiroService.listarFaturas(workspace.id);

    return lista.map(paraDTO);
  }

  @Query(() => FaturaResumoDTO)
  async faturaResumo(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FaturaResumoDTO> {
    return this.financeiroService.resumo(workspace.id);
  }

  @Mutation(() => FaturaDTO)
  async criarFatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CriarFaturaInput,
  ): Promise<FaturaDTO> {
    const fatura = await this.financeiroService.criarFatura(workspace.id, {
      ...input,
      meios: (input.meios as FaturaMeios) ?? FaturaMeios.TODOS,
    });

    return paraDTO(fatura);
  }

  @Mutation(() => Boolean)
  async cancelarFatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('faturaId') faturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.cancelarFatura(workspace.id, faturaId);

    return true;
  }

  @Mutation(() => Boolean)
  async enviarFaturaWhatsapp(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('faturaId') faturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.enviarPorWhatsapp(workspace.id, faturaId);

    return true;
  }
}
