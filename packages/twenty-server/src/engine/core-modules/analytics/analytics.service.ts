// FORK: Voka CRM — Fase 20.2: serviço de analytics com queries reais no banco
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WhatsappMessageEntity } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { RoiRelatorioEntity } from 'src/engine/core-modules/analytics/entities/roi-relatorio.entity';

import { PeriodFilter, getDateRange } from './dtos/period-filter.input';
import { DashboardStatsDTO } from './dtos/dashboard-stats.dto';
import { GanhoPerdaStatsDTO } from './dtos/ganho-perda-stats.dto';
import { RelatorioConsolidadoDTO } from './dtos/relatorio-consolidado.dto';
import {
  RoiRelatorioDTO,
  CreateRoiRelatorioInput,
  UpdateRoiRelatorioInput,
} from './dtos/roi-relatorio.dto';

type GranularidadeType = 'DIA' | 'SEMANA' | 'MES';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,

    @InjectRepository(WhatsappMessageEntity)
    private readonly msgRepo: Repository<WhatsappMessageEntity>,

    @InjectRepository(WhatsappContactWindowEntity)
    private readonly windowRepo: Repository<WhatsappContactWindowEntity>,

    @InjectRepository(RoiRelatorioEntity)
    private readonly roiRepo: Repository<RoiRelatorioEntity>,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private wsSchema(workspaceId: string): string {
    return getWorkspaceSchemaName(workspaceId);
  }

  private safeInt(val: unknown): number {
    const n = parseInt(String(val ?? '0'), 10);
    return isNaN(n) ? 0 : n;
  }

  private safeFloat(val: unknown): number {
    const n = parseFloat(String(val ?? '0'));
    return isNaN(n) ? 0 : n;
  }

  // ── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats(
    workspaceId: string,
    period: PeriodFilter,
  ): Promise<DashboardStatsDTO> {
    const { from, to } = getDateRange(period);
    const schema = this.wsSchema(workspaceId);

    const [
      mensagensRes,
      conversasRes,
      semRespostaRes,
      tempoMedioRes,
      maiorTempoRes,
      leadsGanhosRes,
      leadsAtivosRes,
      tarefasRes,
      porCanalRes,
    ] = await Promise.all([
      // Mensagens recebidas no período
      this.coreDataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count
         FROM core."whatsappMessage"
         WHERE "workspaceId" = $1
           AND direction = 'INBOUND'
           AND timestamp BETWEEN $2 AND $3`,
        [workspaceId, from, to],
      ),

      // Conversas em andamento (todos os contatos com janela aberta)
      this.coreDataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count
         FROM core."whatsappContactWindow"
         WHERE "workspaceId" = $1`,
        [workspaceId],
      ),

      // Conversas sem resposta (última mensagem INBOUND há > 1h sem resposta)
      this.coreDataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count
         FROM core."whatsappContactWindow"
         WHERE "workspaceId" = $1
           AND "lastInboundAt" < NOW() - INTERVAL '1 hour'
           AND "lastInboundAt" BETWEEN $2 AND $3`,
        [workspaceId, from, to],
      ),

      // Tempo médio de resposta (minutos): avg entre primeira INBOUND e próxima OUTBOUND por contato
      this.coreDataSource.query<{ avg_minutes: string | null }[]>(
        `WITH first_response AS (
           SELECT
             m_in."contactId",
             MIN(
               EXTRACT(EPOCH FROM (m_out.timestamp - m_in.timestamp)) / 60
             ) AS minutes
           FROM core."whatsappMessage" m_in
           JOIN core."whatsappMessage" m_out
             ON m_out."contactId" = m_in."contactId"
            AND m_out."workspaceId" = m_in."workspaceId"
            AND m_out.direction = 'OUTBOUND'
            AND m_out.timestamp > m_in.timestamp
           WHERE m_in."workspaceId" = $1
             AND m_in.direction = 'INBOUND'
             AND m_in.timestamp BETWEEN $2 AND $3
           GROUP BY m_in."contactId"
         )
         SELECT AVG(minutes) AS avg_minutes FROM first_response`,
        [workspaceId, from, to],
      ),

      // Maior tempo aguardando (MAX minutos sem resposta)
      this.coreDataSource.query<{ max_minutes: string | null }[]>(
        `SELECT
           EXTRACT(EPOCH FROM (NOW() - "lastInboundAt")) / 60 AS max_minutes
         FROM core."whatsappContactWindow"
         WHERE "workspaceId" = $1
         ORDER BY "lastInboundAt" ASC
         LIMIT 1`,
        [workspaceId],
      ),

      // Leads ganhos + valor no período (usando closeDate do workspace)
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT
           COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE stage = 'WON'
           AND "deletedAt" IS NULL
           AND "closeDate" BETWEEN $1 AND $2`,
        [from, to],
      ),

      // Leads ativos + valor
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT
           COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE stage NOT IN ('WON', 'LOST')
           AND "deletedAt" IS NULL`,
        [],
      ),

      // Tarefas no período
      this.coreDataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count
         FROM "${schema}"."task"
         WHERE "deletedAt" IS NULL
           AND "createdAt" BETWEEN $1 AND $2`,
        [from, to],
      ),

      // Por canal (mensagens inbound agrupadas por channelType)
      this.coreDataSource.query<{ canal: string; count: string }[]>(
        `SELECT "channelType" AS canal, COUNT(*) AS count
         FROM core."whatsappMessage"
         WHERE "workspaceId" = $1
           AND direction = 'INBOUND'
           AND timestamp BETWEEN $2 AND $3
         GROUP BY "channelType"`,
        [workspaceId, from, to],
      ),
    ]);

    return {
      mensagensRecebidas:    this.safeInt(mensagensRes[0]?.count),
      conversasEmAndamento:  this.safeInt(conversasRes[0]?.count),
      conversasSemResposta:  this.safeInt(semRespostaRes[0]?.count),
      tempoMedioResposta:    this.safeFloat(tempoMedioRes[0]?.avg_minutes),
      maiorTempoAguardando:  this.safeFloat(maiorTempoRes[0]?.max_minutes),
      leadsGanhos:           this.safeInt(leadsGanhosRes[0]?.count),
      valorLeadsGanhos:      this.safeFloat(leadsGanhosRes[0]?.valor),
      leadsAtivos:           this.safeInt(leadsAtivosRes[0]?.count),
      valorLeadsAtivos:      this.safeFloat(leadsAtivosRes[0]?.valor),
      tarefas:               this.safeInt(tarefasRes[0]?.count),
      fontesDeLead:          [],
      porCanal:              porCanalRes.map((r) => ({
        canal:     r.canal,
        quantidade: this.safeInt(r.count),
      })),
    };
  }

  // ── Análise Ganho-Perda ──────────────────────────────────────────────────────

  async getAnaliseGanhoPerda(
    workspaceId: string,
    period: PeriodFilter,
  ): Promise<GanhoPerdaStatsDTO> {
    const { from, to } = getDateRange(period);
    const schema = this.wsSchema(workspaceId);

    const [stagesRes, ganhosRes, perdidosRes, cicloRes] = await Promise.all([
      // Counts por etapa (todas exceto WON/LOST)
      this.coreDataSource.query<{
        stage: string;
        total: string;
        total_valor: string;
        entrou: string;
        entrou_valor: string;
      }[]>(
        `SELECT
           stage,
           COUNT(*) AS total,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS total_valor,
           COUNT(CASE WHEN "createdAt" BETWEEN $2 AND $3 THEN 1 END) AS entrou,
           COALESCE(
             SUM(CASE WHEN "createdAt" BETWEEN $2 AND $3
                 THEN "amountAmountMicros" ELSE 0 END)::numeric / 1000000,
             0
           ) AS entrou_valor
         FROM "${schema}"."opportunity"
         WHERE "deletedAt" IS NULL
         GROUP BY stage
         ORDER BY MIN("position") NULLS LAST, stage`,
        [workspaceId, from, to],
      ),

      // Total ganho no período
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE stage = 'WON' AND "deletedAt" IS NULL
           AND "closeDate" BETWEEN $1 AND $2`,
        [from, to],
      ),

      // Total perdido no período
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE stage = 'LOST' AND "deletedAt" IS NULL
           AND "updatedAt" BETWEEN $1 AND $2`,
        [from, to],
      ),

      // Ciclo de vida médio em dias (ganhos no período)
      this.coreDataSource.query<{ avg_days: string | null }[]>(
        `SELECT
           AVG(
             EXTRACT(EPOCH FROM ("closeDate" - "createdAt")) / 86400
           ) AS avg_days
         FROM "${schema}"."opportunity"
         WHERE stage = 'WON' AND "deletedAt" IS NULL
           AND "closeDate" IS NOT NULL
           AND "closeDate" BETWEEN $1 AND $2`,
        [from, to],
      ),
    ]);

    const totalEntrou = stagesRes.reduce(
      (acc, r) => acc + this.safeInt(r.entrou),
      0,
    );

    const porEtapa = stagesRes.map((r) => {
      const entrou = this.safeInt(r.entrou);
      const taxaConversao =
        totalEntrou > 0 ? Math.round((entrou / totalEntrou) * 100) : 0;

      return {
        etapaNome:      r.stage,
        dentroDaEtapa:  { leads: this.safeInt(r.total), valor: this.safeFloat(r.total_valor) },
        entrouNaEtapa:  { leads: entrou, valor: this.safeFloat(r.entrou_valor) },
        perdidoNaEtapa: { leads: 0, valor: 0 },
        taxaConversao,
      };
    });

    const vendasProspectivas = stagesRes
      .filter((r) => !['WON', 'LOST'].includes(r.stage))
      .map((r) => ({
        etapaNome:      r.stage,
        // Sem probabilidade por etapa no metadata, retorna valor bruto
        valorPonderado: this.safeFloat(r.total_valor),
      }));

    return {
      porEtapa,
      totalGanho: {
        leads: this.safeInt(ganhosRes[0]?.count),
        valor:  this.safeFloat(ganhosRes[0]?.valor),
      },
      totalPerdido: {
        leads: this.safeInt(perdidosRes[0]?.count),
        valor:  this.safeFloat(perdidosRes[0]?.valor),
      },
      cicloVidaMedioEmDias: this.safeFloat(cicloRes[0]?.avg_days),
      vendasProspectivas,
    };
  }

  // ── Relatório Consolidado ────────────────────────────────────────────────────

  async getRelatorioConsolidado(
    workspaceId: string,
    period: PeriodFilter,
    granularidade: GranularidadeType = 'DIA',
  ): Promise<RelatorioConsolidadoDTO> {
    const { from, to } = getDateRange(period);
    const schema = this.wsSchema(workspaceId);

    const truncFn =
      granularidade === 'MES'
        ? `DATE_TRUNC('month', "createdAt")`
        : granularidade === 'SEMANA'
          ? `DATE_TRUNC('week', "createdAt")`
          : `DATE_TRUNC('day', "createdAt")`;

    const [serieRes, etapasRes, tarefasRes, pessoasRes, empresasRes] =
      await Promise.all([
        // Série temporal de leads
        this.coreDataSource.query<{
          data: string;
          quantidade: string;
          valor: string;
        }[]>(
          `SELECT
             ${truncFn} AS data,
             COUNT(*) AS quantidade,
             COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
           FROM "${schema}"."opportunity"
           WHERE "deletedAt" IS NULL
             AND "createdAt" BETWEEN $1 AND $2
           GROUP BY ${truncFn}
           ORDER BY data ASC`,
          [from, to],
        ),

        // Por etapa
        this.coreDataSource.query<{
          stage: string;
          count: string;
          valor: string;
        }[]>(
          `SELECT
             stage,
             COUNT(*) AS count,
             COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
           FROM "${schema}"."opportunity"
           WHERE "deletedAt" IS NULL
           GROUP BY stage`,
          [],
        ),

        // Por status de tarefa
        this.coreDataSource.query<{ status: string; count: string }[]>(
          `SELECT COALESCE(status, 'TODO') AS status, COUNT(*) AS count
           FROM "${schema}"."task"
           WHERE "deletedAt" IS NULL
           GROUP BY status`,
          [],
        ),

        // Total de pessoas (contatos)
        this.coreDataSource.query<{ count: string }[]>(
          `SELECT COUNT(*) AS count
           FROM "${schema}"."person"
           WHERE "deletedAt" IS NULL`,
          [],
        ),

        // Total de empresas
        this.coreDataSource.query<{ count: string }[]>(
          `SELECT COUNT(*) AS count
           FROM "${schema}"."company"
           WHERE "deletedAt" IS NULL`,
          [],
        ),
      ]);

    const totalLeads = etapasRes.reduce(
      (acc, r) => acc + this.safeInt(r.count),
      0,
    );
    const valorTotal = etapasRes.reduce(
      (acc, r) => acc + this.safeFloat(r.valor),
      0,
    );

    const totalPessoas = this.safeInt(pessoasRes[0]?.count);
    const totalEmpresas = this.safeInt(empresasRes[0]?.count);
    const totalContatos = totalPessoas + totalEmpresas;

    const totalTarefas = tarefasRes.reduce(
      (acc, r) => acc + this.safeInt(r.count),
      0,
    );

    return {
      serieLeads: serieRes.map((r) => ({
        data:       new Date(r.data).toISOString().split('T')[0],
        quantidade: this.safeInt(r.quantidade),
        valor:      this.safeFloat(r.valor),
      })),

      porEtapa: etapasRes.map((r) => ({
        nome:       r.stage,
        quantidade: this.safeInt(r.count),
        valor:      this.safeFloat(r.valor),
        percentual:
          totalLeads > 0
            ? Math.round((this.safeInt(r.count) / totalLeads) * 100)
            : 0,
      })),

      porUsuario: [],

      totalLeads,
      valorTotal,

      contatos: {
        total: totalContatos,
        porTipo: [
          {
            tipo:       'Contatos',
            quantidade: totalPessoas,
            percentual:
              totalContatos > 0
                ? Math.round((totalPessoas / totalContatos) * 100)
                : 0,
          },
          {
            tipo:       'Empresas',
            quantidade: totalEmpresas,
            percentual:
              totalContatos > 0
                ? Math.round((totalEmpresas / totalContatos) * 100)
                : 0,
          },
        ],
      },

      porUsuarioContato: [],

      tarefas: {
        total: totalTarefas,
        porStatus: tarefasRes.map((r) => ({
          status:     r.status,
          quantidade: this.safeInt(r.count),
          percentual:
            totalTarefas > 0
              ? Math.round((this.safeInt(r.count) / totalTarefas) * 100)
              : 0,
        })),
      },
    };
  }

  // ── ROI Relatórios CRUD ──────────────────────────────────────────────────────

  async listRoiRelatorios(workspaceId: string): Promise<RoiRelatorioDTO[]> {
    const rows = await this.roiRepo.find({
      where: { workspaceId },
      order: { criadoEm: 'DESC' },
    });

    return Promise.all(
      rows.map((r) => this.enrichRoiRelatorio(r, workspaceId)),
    );
  }

  async createRoiRelatorio(
    workspaceId: string,
    userId: string,
    input: CreateRoiRelatorioInput,
  ): Promise<RoiRelatorioDTO> {
    const entity = this.roiRepo.create({
      workspaceId,
      nome: input.nome,
      investimento: input.investimento,
      filtros: {
        funilId:  input.funilId ?? null,
        etapa:    input.etapa ?? null,
        periodo:  input.periodo ?? null,
      },
      criadoPorId: userId,
    });
    const saved = await this.roiRepo.save(entity);
    return this.enrichRoiRelatorio(saved, workspaceId);
  }

  async updateRoiRelatorio(
    workspaceId: string,
    input: UpdateRoiRelatorioInput,
  ): Promise<RoiRelatorioDTO> {
    const entity = await this.roiRepo.findOneOrFail({
      where: { id: input.id, workspaceId },
    });
    if (input.nome !== undefined) entity.nome = input.nome;
    if (input.investimento !== undefined) entity.investimento = input.investimento;
    const saved = await this.roiRepo.save(entity);
    return this.enrichRoiRelatorio(saved, workspaceId);
  }

  async deleteRoiRelatorio(
    workspaceId: string,
    id: string,
  ): Promise<boolean> {
    const result = await this.roiRepo.delete({ id, workspaceId });
    return (result.affected ?? 0) > 0;
  }

  async exportRoiCsv(workspaceId: string): Promise<string> {
    const rows = await this.listRoiRelatorios(workspaceId);
    const header = 'Nome,Investimento,Total Leads,Leads Ganhos,Leads Perdidos,Receita,ROI%';
    const lines = rows.map((r) =>
      [
        `"${r.nome}"`,
        r.investimento.toFixed(2),
        r.totalLeads,
        r.leadsGanhos,
        r.leadsPerdidos,
        r.receita.toFixed(2),
        r.roi !== null ? r.roi.toFixed(2) : '',
      ].join(','),
    );
    return [header, ...lines].join('\n');
  }

  private async enrichRoiRelatorio(
    entity: RoiRelatorioEntity,
    workspaceId: string,
  ): Promise<RoiRelatorioDTO> {
    const schema = this.wsSchema(workspaceId);

    // Aplica filtro de etapa se configurado
    const etapaCond = entity.filtros['etapa']
      ? `AND stage = '${String(entity.filtros['etapa']).replace(/'/g, "''")}'`
      : '';

    const [leadsRes, ganhosRes, perdidosRes] = await Promise.all([
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE "deletedAt" IS NULL ${etapaCond}`,
        [],
      ),
      this.coreDataSource.query<{ count: string; valor: string }[]>(
        `SELECT COUNT(*) AS count,
           COALESCE(SUM("amountAmountMicros")::numeric / 1000000, 0) AS valor
         FROM "${schema}"."opportunity"
         WHERE stage = 'WON' AND "deletedAt" IS NULL ${etapaCond}`,
        [],
      ),
      this.coreDataSource.query<{ count: string }[]>(
        `SELECT COUNT(*) AS count
         FROM "${schema}"."opportunity"
         WHERE stage = 'LOST' AND "deletedAt" IS NULL ${etapaCond}`,
        [],
      ),
    ]);

    const receita = this.safeFloat(ganhosRes[0]?.valor);
    const investimento = Number(entity.investimento);
    const roi =
      investimento > 0
        ? ((receita - investimento) / investimento) * 100
        : null;

    return {
      id:            entity.id,
      workspaceId:   entity.workspaceId,
      nome:          entity.nome,
      investimento,
      totalLeads:    this.safeInt(leadsRes[0]?.count),
      leadsGanhos:   this.safeInt(ganhosRes[0]?.count),
      leadsPerdidos: this.safeInt(perdidosRes[0]?.count),
      receita,
      roi,
      criadoEm:      entity.criadoEm.toISOString(),
    };
  }
}
