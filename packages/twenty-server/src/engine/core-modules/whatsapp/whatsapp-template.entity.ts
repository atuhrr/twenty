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

@Entity({ name: 'whatsappTemplate', schema: 'core' })
@Unique('IDX_WHATSAPP_TEMPLATE_WORKSPACE_NAME_LANG_UNIQUE', [
  'workspaceId',
  'name',
  'languageCode',
])
@Index('IDX_WHATSAPP_TEMPLATE_WORKSPACE_ID', ['workspaceId'])
export class WhatsappTemplateEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: false, type: 'text' })
  languageCode: string;

  @Column({ nullable: false, type: 'text' })
  category: string;

  // JSON schema describing the body parameters expected by the template
  @Column({ nullable: true, type: 'jsonb' })
  bodyParamsSchema: object | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
