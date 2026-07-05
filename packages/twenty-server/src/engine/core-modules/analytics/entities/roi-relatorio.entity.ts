// FORK: Voka CRM — Fase 20.2: entidade de relatórios ROI (core schema)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'roiRelatorio', schema: 'core' })
@Index('IDX_ROI_RELATORIO_WORKSPACE', ['workspaceId'])
export class RoiRelatorioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  workspaceId: string;

  @Column({ type: 'text', nullable: false })
  nome: string;

  @Column({ type: 'jsonb', nullable: false, default: '{}' })
  filtros: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  investimento: number;

  @Column({ type: 'uuid', nullable: true })
  criadoPorId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  atualizadoEm: Date;
}
