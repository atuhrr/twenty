// FORK: Zellate — F1 Financeiro: API GraphQL das faturas
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  FaturaEntity,
  FaturaMeios,
} from 'src/engine/core-modules/financeiro/fatura.entity';
import {
  AssinaturaDTO,
  AtualizarFinanceiroConfigInput,
  ConectarFinanceiroInput,
  CriarAssinaturaInput,
  CriarFaturaInput,
  FaturaDTO,
  FaturaResumoDTO,
  FinanceiroConfigDTO,
  FinanceiroStatusDTO,
  ReceitaStatsDTO,
  ServicoMunicipalDTO,
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
  nfseStatus: f.nfseStatus,
  nfsePdfUrl: f.nfsePdfUrl,
  nfseErro: f.nfseErro,
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

  // ── F2: configuração de cobrança automática ──
  @Query(() => FinanceiroConfigDTO)
  async financeiroConfig(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<FinanceiroConfigDTO> {
    const conta = await this.financeiroService.status(workspace.id);
    const regua = conta?.reguaLembretes ?? {
      ativo: true,
      diasAntes: [1],
      diasDepois: [1, 3, 7],
    };

    return {
      jurosPadraoPercent:
        conta?.jurosPadraoPercent != null
          ? Number(conta.jurosPadraoPercent)
          : null,
      multaPadraoPercent:
        conta?.multaPadraoPercent != null
          ? Number(conta.multaPadraoPercent)
          : null,
      reguaAtiva: regua.ativo,
      reguaDiasAntes: regua.diasAntes ?? [],
      reguaDiasDepois: regua.diasDepois ?? [],
      templateLembrete: conta?.templateLembrete ?? null,
      nfseAtiva: conta?.nfseAtiva ?? false,
      nfseMomento: conta?.nfseMomento ?? 'MANUAL',
      nfseCodigoServico: conta?.nfseCodigoServico ?? null,
      nfseNomeServico: conta?.nfseNomeServico ?? null,
      nfseAliquotaIss:
        conta?.nfseAliquotaIss != null ? Number(conta.nfseAliquotaIss) : null,
      nfseDescricaoPadrao: conta?.nfseDescricaoPadrao ?? null,
    };
  }

  @Mutation(() => Boolean)
  async atualizarFinanceiroConfig(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: AtualizarFinanceiroConfigInput,
  ): Promise<boolean> {
    const atual = await this.financeiroService.status(workspace.id);
    const reguaAtual = atual?.reguaLembretes ?? {
      ativo: true,
      diasAntes: [1],
      diasDepois: [1, 3, 7],
    };

    await this.financeiroService.atualizarConfig(workspace.id, {
      jurosPadraoPercent: input.jurosPadraoPercent,
      multaPadraoPercent: input.multaPadraoPercent,
      templateLembrete: input.templateLembrete,
      reguaLembretes: {
        ativo: input.reguaAtiva ?? reguaAtual.ativo,
        diasAntes: input.reguaDiasAntes ?? reguaAtual.diasAntes,
        diasDepois: input.reguaDiasDepois ?? reguaAtual.diasDepois,
      },
      nfseAtiva: input.nfseAtiva,
      nfseMomento: input.nfseMomento,
      nfseCodigoServico: input.nfseCodigoServico,
      nfseNomeServico: input.nfseNomeServico,
      nfseAliquotaIss: input.nfseAliquotaIss,
      nfseDescricaoPadrao: input.nfseDescricaoPadrao,
    });

    return true;
  }

  // ── F2: assinaturas (recorrência) ──
  @Query(() => [AssinaturaDTO])
  async assinaturas(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<AssinaturaDTO[]> {
    return this.financeiroService.listarAssinaturas(workspace.id);
  }

  @Mutation(() => AssinaturaDTO)
  async criarAssinatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CriarAssinaturaInput,
  ): Promise<AssinaturaDTO> {
    return this.financeiroService.criarAssinatura(workspace.id, {
      ...input,
      meios: (input.meios as FaturaMeios) ?? FaturaMeios.TODOS,
    });
  }

  @Mutation(() => Boolean)
  async pausarAssinatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('assinaturaId') assinaturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.pausarAssinatura(workspace.id, assinaturaId);

    return true;
  }

  @Mutation(() => Boolean)
  async retomarAssinatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('assinaturaId') assinaturaId: string,
    @Args('proximoVencimento') proximoVencimento: string,
  ): Promise<boolean> {
    await this.financeiroService.retomarAssinatura(
      workspace.id,
      assinaturaId,
      proximoVencimento,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async cancelarAssinatura(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('assinaturaId') assinaturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.cancelarAssinatura(
      workspace.id,
      assinaturaId,
    );

    return true;
  }

  // ── F3: NFS-e ──
  @Query(() => [ServicoMunicipalDTO])
  async servicosMunicipais(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('busca') busca: string,
  ): Promise<ServicoMunicipalDTO[]> {
    return this.financeiroService.buscarServicosMunicipais(
      workspace.id,
      busca,
    );
  }

  @Mutation(() => Boolean)
  async emitirNfse(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('faturaId') faturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.emitirNfse(workspace.id, faturaId);

    return true;
  }

  @Mutation(() => Boolean)
  async atualizarStatusNfse(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('faturaId') faturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.atualizarStatusNfse(workspace.id, faturaId);

    return true;
  }

  @Mutation(() => Boolean)
  async enviarNfseWhatsapp(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('faturaId') faturaId: string,
  ): Promise<boolean> {
    await this.financeiroService.enviarNfseWhatsapp(workspace.id, faturaId);

    return true;
  }

  // ── F2: estatísticas de receita ──
  @Query(() => ReceitaStatsDTO)
  async receitaStats(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<ReceitaStatsDTO> {
    return this.financeiroService.receitaStats(workspace.id);
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
