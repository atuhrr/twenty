// FORK: Voka CRM — Fase C: notificações do workspace
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'notification', schema: 'core' })
@Index('IDX_notification_workspaceId_createdAt', ['workspaceId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ nullable: false, type: 'text' })
  title: string;

  @Column({ nullable: true, type: 'text' })
  body: string | null;

  @Column({ nullable: false, type: 'text', default: 'SYSTEM' })
  type: string;

  @Column({ nullable: true, type: 'text' })
  link: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
