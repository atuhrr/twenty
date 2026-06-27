// FORK: Voka CRM — Fase 12
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BroadcastCampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity({ name: 'broadcastCampaign', schema: 'core' })
@Index('IDX_broadcastCampaign_workspaceId', ['workspaceId'])
export class BroadcastCampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: false, type: 'text', default: 'WHATSAPP' })
  channel: string;

  @Column({
    nullable: false,
    type: 'text',
    default: BroadcastCampaignStatus.DRAFT,
  })
  status: BroadcastCampaignStatus;

  @Column({ nullable: true, type: 'text' })
  templateName: string | null;

  @Column({ nullable: false, type: 'text', default: 'pt_BR' })
  languageCode: string;

  @Column({ nullable: true, type: 'jsonb' })
  segmentFilter: Record<string, unknown> | null;

  @Column({ nullable: true, type: 'timestamptz' })
  scheduledAt: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  startedAt: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  completedAt: Date | null;

  @Column({ nullable: false, type: 'int', default: 0 })
  totalCount: number;

  @Column({ nullable: false, type: 'int', default: 0 })
  sentCount: number;

  @Column({ nullable: false, type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ nullable: false, type: 'int', default: 0 })
  readCount: number;

  @Column({ nullable: false, type: 'int', default: 0 })
  failedCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
