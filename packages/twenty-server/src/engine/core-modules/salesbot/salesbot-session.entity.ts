// FORK: Voka CRM — Fase 14
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Entity({ name: 'salesbotSession', schema: 'core' })
export class SalesbotSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  botId: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text' })
  contactPhone: string;

  @Column({ type: 'uuid', nullable: true })
  opportunityId: string | null;

  @Column({ type: 'text' })
  currentNodeId: string;

  @Column({ type: 'jsonb', default: '{}' })
  collectedData: Record<string, string>;

  @Column({ type: 'jsonb', default: '[]' })
  conversationHistory: ChatMessage[];

  @Column({ type: 'text', default: 'ACTIVE' })
  status: 'ACTIVE' | 'COMPLETED' | 'HANDED_OFF';

  @Column({ type: 'int', default: 0 })
  aiTurns: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
