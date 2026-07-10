// FORK: Zellate — F2 Financeiro: assinatura (cobrança recorrente Asaas)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export enum AssinaturaStatus {
  ATIVA = 'ATIVA',
  PAUSADA = 'PAUSADA',
  CANCELADA = 'CANCELADA',
}

@Entity({ name: 'assinatura', schema: 'core' })
@Index('IDX_ASSINATURA_WORKSPACE_STATUS', ['workspaceId', 'status'])
export class AssinaturaEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'uuid' })
  leadId: string | null;

  @Column({ nullable: false, type: 'text' })
  clienteNome: string;

  @Column({ nullable: true, type: 'text' })
  clienteCpfCnpj: string | null;

  @Column({ nullable: true, type: 'text' })
  clienteTelefone: string | null;

  @Column({ nullable: false, type: 'text' })
  descricao: string;

  @Column({ nullable: false, type: 'integer' })
  valorCentavos: number;

  @Column({ nullable: false, type: 'text', default: 'MENSAL' })
  ciclo: string;

  @Column({ nullable: false, type: 'date' })
  proximoVencimento: string;

  @Column({ nullable: false, type: 'text', default: 'TODOS' })
  meios: string;

  @Column({ nullable: false, type: 'text', default: 'ATIVA' })
  status: AssinaturaStatus;

  @Column({ nullable: false, type: 'text', default: 'ASAAS' })
  provider: string;

  @Column({ nullable: true, type: 'text' })
  providerAssinaturaId: string | null;

  @Column({ nullable: true, type: 'text' })
  providerClienteId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
