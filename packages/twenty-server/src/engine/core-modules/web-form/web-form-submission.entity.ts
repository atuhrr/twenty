// FORK: Voka CRM — Fase 15
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'webFormSubmission', schema: 'core' })
export class WebFormSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formId: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'jsonb', default: '{}' })
  data: Record<string, string>;

  @Column({ type: 'text', default: 'WEB_FORM' })
  source: string;

  @Column({ type: 'uuid', nullable: true })
  opportunityId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
