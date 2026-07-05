// FORK: Voka CRM — Fase 13
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'automationExecution', schema: 'core' })
@Index('IDX_automationExecution_ruleId', ['ruleId'])
export class AutomationExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  ruleId: string;

  @Column({ type: 'uuid', nullable: false })
  workspaceId: string;

  @Column({ type: 'text', nullable: false })
  recordId: string;

  @Column({ type: 'text', nullable: false, default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  executedAt: Date;
}
