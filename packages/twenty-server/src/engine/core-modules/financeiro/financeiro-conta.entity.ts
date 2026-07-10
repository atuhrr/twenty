// FORK: Zellate — F1 Financeiro: conta de recebimento do workspace (Asaas).
// Campos de subconta (walletId, onboardingUrl, dadosCadastrais…) nascem
// anuláveis: são usados pela F5 (Zellate Pay) sem migração dolorosa.
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export enum FinanceiroContaTipo {
  CONTA_PROPRIA = 'CONTA_PROPRIA',
  SUBCONTA_ZELLATE = 'SUBCONTA_ZELLATE',
}

export enum FinanceiroContaStatus {
  CONECTADA = 'CONECTADA',
  ERRO = 'ERRO',
  // Estados abaixo são da F5 (KYC de subconta white-label)
  PENDENTE_DOCUMENTOS = 'PENDENTE_DOCUMENTOS',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
}

@Entity({ name: 'financeiroConta', schema: 'core' })
@Index('IDX_FINANCEIRO_CONTA_WORKSPACE', ['workspaceId'])
export class FinanceiroContaEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text', default: 'ASAAS' })
  provider: string;

  @Column({ nullable: false, type: 'text', default: 'CONTA_PROPRIA' })
  tipo: FinanceiroContaTipo;

  @Column({ nullable: false, type: 'text' })
  apiKeyEncrypted: string;

  @Column({ nullable: false, type: 'text', default: 'SANDBOX' })
  ambiente: 'SANDBOX' | 'PRODUCAO';

  // Segredo gerado por nós e cadastrado no webhook do Asaas (authToken)
  @Column({ nullable: false, type: 'text' })
  webhookToken: string;

  @Column({ nullable: false, type: 'text', default: 'CONECTADA' })
  statusConta: FinanceiroContaStatus;

  @Column({ nullable: true, type: 'text' })
  nomeConta: string | null;

  // ── Reservados para a F5 (Zellate Pay) ──
  @Column({ nullable: true, type: 'text' })
  walletId: string | null;

  @Column({ nullable: true, type: 'text' })
  asaasAccountId: string | null;

  @Column({ nullable: true, type: 'text' })
  onboardingUrl: string | null;

  @Column({ nullable: true, type: 'jsonb' })
  dadosCadastrais: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
