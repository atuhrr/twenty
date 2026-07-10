// FORK: Zellate — F1 Financeiro: trilha de auditoria da fatura
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'faturaEvento', schema: 'core' })
@Index('IDX_FATURA_EVENTO_FATURA', ['faturaId'])
export class FaturaEventoEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  faturaId: string;

  // CRIADA | ENVIADA_WHATSAPP | PAGA | VENCIDA | CANCELADA | WEBHOOK_IGNORADO…
  @Column({ nullable: false, type: 'text' })
  tipo: string;

  @Column({ nullable: true, type: 'jsonb' })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
