import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'whatsappContactWindow', schema: 'core' })
@Unique('IDX_WHATSAPP_CONTACT_WINDOW_WORKSPACE_CONTACT_UNIQUE', [
  'workspaceId',
  'contactId',
])
export class WhatsappContactWindowEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // contactId references the workspace-scoped Person object (multi-tenant)
  @Column({ nullable: false, type: 'uuid' })
  contactId: string;

  // Tracks the last inbound message time to determine if the 24h service window is open
  @Column({ nullable: false, type: 'timestamptz' })
  lastInboundAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
