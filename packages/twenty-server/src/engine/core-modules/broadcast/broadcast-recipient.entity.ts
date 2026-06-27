// FORK: Voka CRM — Fase 12
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum BroadcastRecipientStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

@Entity({ name: 'broadcastRecipient', schema: 'core' })
@Index('IDX_broadcastRecipient_campaignId', ['campaignId'])
@Index('IDX_broadcastRecipient_workspaceId', ['workspaceId'])
export class BroadcastRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  campaignId: string;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ nullable: true, type: 'uuid' })
  contactId: string | null;

  @Column({ nullable: false, type: 'text' })
  phoneNumber: string;

  @Column({
    nullable: false,
    type: 'text',
    default: BroadcastRecipientStatus.PENDING,
  })
  status: BroadcastRecipientStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  sentAt: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  deliveredAt: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  readAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string | null;
}
