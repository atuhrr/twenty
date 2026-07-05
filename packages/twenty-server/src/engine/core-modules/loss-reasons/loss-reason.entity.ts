// FORK: Voka CRM — Fase 18/19: motivos de perda
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'lossReason', schema: 'core' })
@Index('IDX_lossReason_workspaceId', ['workspaceId'])
export class LossReasonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ nullable: false, type: 'text' })
  label: string;

  @Column({ nullable: false, type: 'integer', default: 0 })
  position: number;

  @Column({ nullable: false, type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
