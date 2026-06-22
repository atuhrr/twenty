import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export enum WhatsappMessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum WhatsappMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  TEMPLATE = 'TEMPLATE',
}

export enum WhatsappMessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

@Entity({ name: 'whatsappMessage', schema: 'core' })
@Unique('IDX_WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE', ['externalMessageId'])
@Index('IDX_WHATSAPP_MESSAGE_WORKSPACE_CONTACT', ['workspaceId', 'contactId'])
export class WhatsappMessageEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // contactId references the workspace-scoped Person object (multi-tenant)
  @Column({ nullable: false, type: 'uuid' })
  contactId: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: WhatsappMessageDirection,
  })
  direction: WhatsappMessageDirection;

  @Column({
    nullable: false,
    type: 'enum',
    enum: WhatsappMessageType,
    default: WhatsappMessageType.TEXT,
  })
  type: WhatsappMessageType;

  @Column({ nullable: true, type: 'text' })
  content: string | null;

  @Column({ nullable: true, type: 'text' })
  mediaUrl: string | null;

  @Column({ nullable: false, type: 'text' })
  externalMessageId: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: WhatsappMessageStatus,
    default: WhatsappMessageStatus.SENT,
  })
  status: WhatsappMessageStatus;

  @Column({ nullable: false, type: 'timestamptz' })
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
