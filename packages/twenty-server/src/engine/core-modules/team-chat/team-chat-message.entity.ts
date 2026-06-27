// FORK: Voka CRM — Fase 10: internal team chat message (colleagues, within a lead)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'teamChatMessage', schema: 'core' })
@Index('IDX_TEAM_CHAT_MESSAGE_WORKSPACE_RECORD', ['workspaceId', 'relatedRecordId'])
export class TeamChatMessageEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** UUID of the workspace user (core.user) who sent the message */
  @Column({ nullable: false, type: 'uuid' })
  senderId: string;

  /** Display name cached at send time (avoids JOIN on every read) */
  @Column({ nullable: false, type: 'text' })
  senderName: string;

  /** UUID of the related workspace record (opportunity / contact / etc.) */
  @Column({ nullable: true, type: 'uuid' })
  relatedRecordId: string | null;

  /** Object type for the related record, e.g. 'opportunity' */
  @Column({ nullable: true, type: 'text' })
  relatedRecordType: string | null;

  @Column({ nullable: false, type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
