// FORK: Voka CRM — Fase 15
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type WebFormFieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea';

export type WebFormField = {
  id: string;
  type: WebFormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
};

@Entity({ name: 'webForm', schema: 'core' })
export class WebFormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'jsonb', default: '[]' })
  fields: WebFormField[];

  @Column({ type: 'text', nullable: true })
  funnelId: string | null;

  @Column({ type: 'text', unique: true })
  publicToken: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
