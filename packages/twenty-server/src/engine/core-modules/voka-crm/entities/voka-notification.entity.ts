// FORK: Voka CRM — Fase 1: central de notificações
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'vokaNotification', schema: 'core' })
export class VokaNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  userId: string;

  @Column()
  tipo: string;

  @Column()
  titulo: string;

  @Column({ nullable: true, type: 'text' })
  corpo: string | null;

  @Column({ nullable: true, type: 'text' })
  link: string | null;

  @Column({ default: false })
  lida: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
