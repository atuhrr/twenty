// FORK: Voka CRM — Fase 11: quick reply templates accessed via "/" in the composer
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'whatsappQuickReply', schema: 'core' })
@Index('IDX_WHATSAPP_QUICK_REPLY_WORKSPACE', ['workspaceId'])
export class WhatsappQuickReplyEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Short "/" shortcut, e.g. "oi", "preco", "prazo" */
  @Column({ nullable: false, type: 'text' })
  shortcut: string;

  /** Human-readable title shown in the picker list */
  @Column({ nullable: false, type: 'text' })
  title: string;

  /** The message body — may use {{nome}} {{valor}} variables */
  @Column({ nullable: false, type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
