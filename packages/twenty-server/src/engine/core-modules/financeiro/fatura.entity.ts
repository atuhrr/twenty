// FORK: Zellate — F1 Financeiro: a fatura (cobrança) do workspace
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export enum FaturaStatus {
  RASCUNHO = 'RASCUNHO',
  PENDENTE = 'PENDENTE',
  PAGA = 'PAGA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
  ESTORNADA = 'ESTORNADA',
}

export enum FaturaMeios {
  PIX = 'PIX',
  CARTAO = 'CARTAO',
  BOLETO = 'BOLETO',
  TODOS = 'TODOS',
}

@Entity({ name: 'fatura', schema: 'core' })
@Index('IDX_FATURA_WORKSPACE_STATUS', ['workspaceId', 'status'])
@Index('IDX_FATURA_WORKSPACE_VENCIMENTO', ['workspaceId', 'vencimento'])
export class FaturaEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Sequencial por workspace, exibido como ZLT-0001…
  @Column({ nullable: false, type: 'integer' })
  numeroSeq: number;

  // ── Vínculo com o CRM ──
  @Column({ nullable: true, type: 'uuid' })
  leadId: string | null;

  @Column({ nullable: true, type: 'uuid' })
  personId: string | null;

  // ── Dados do pagador (snapshot no momento da fatura) ──
  @Column({ nullable: false, type: 'text' })
  clienteNome: string;

  @Column({ nullable: true, type: 'text' })
  clienteCpfCnpj: string | null;

  @Column({ nullable: true, type: 'text' })
  clienteEmail: string | null;

  @Column({ nullable: true, type: 'text' })
  clienteTelefone: string | null;

  // ── A cobrança ──
  @Column({ nullable: false, type: 'text' })
  descricao: string;

  @Column({ nullable: false, type: 'integer' })
  valorCentavos: number;

  @Column({ nullable: false, type: 'date' })
  vencimento: string;

  @Column({ nullable: false, type: 'text', default: 'TODOS' })
  meios: FaturaMeios;

  @Column({ nullable: false, type: 'text', default: 'PENDENTE' })
  status: FaturaStatus;

  // ── Espelho do provedor ──
  @Column({ nullable: false, type: 'text', default: 'ASAAS' })
  provider: string;

  @Column({ nullable: true, type: 'text' })
  providerCobrancaId: string | null;

  @Column({ nullable: true, type: 'text' })
  providerClienteId: string | null;

  @Column({ nullable: true, type: 'text' })
  linkPagamento: string | null;

  @Column({ nullable: true, type: 'text' })
  pixPayload: string | null;

  @Column({ nullable: true, type: 'text' })
  pixQrCodeBase64: string | null;

  // ── F2: encargos e régua ──
  @Column({ nullable: true, type: 'numeric', precision: 5, scale: 2 })
  jurosPercent: number | null;

  @Column({ nullable: true, type: 'numeric', precision: 5, scale: 2 })
  multaPercent: number | null;

  @Column({ nullable: true, type: 'integer' })
  descontoCentavos: number | null;

  @Column({ nullable: false, type: 'boolean', default: true })
  lembretesAtivos: boolean;

  @Column({ nullable: true, type: 'uuid' })
  assinaturaId: string | null;

  // ── F3: NFS-e (null = sem nota) ──
  // AGENDADA | EMITIDA | ERRO | CANCELADA
  @Column({ nullable: true, type: 'text' })
  nfseStatus: string | null;

  @Column({ nullable: true, type: 'text' })
  nfseProviderId: string | null;

  @Column({ nullable: true, type: 'text' })
  nfsePdfUrl: string | null;

  @Column({ nullable: true, type: 'text' })
  nfseErro: string | null;

  // ── Pagamento ──
  @Column({ nullable: true, type: 'timestamptz' })
  pagaEm: Date | null;

  @Column({ nullable: true, type: 'integer' })
  valorPagoCentavos: number | null;

  // F4: valor líquido após taxas do provedor (netValue do webhook)
  @Column({ nullable: true, type: 'integer' })
  valorLiquidoCentavos: number | null;

  @Column({ nullable: true, type: 'text' })
  formaPagamento: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
