// FORK: Voka CRM — B2.1: templates de chat e e-mail
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TemplateTipo = 'whatsapp_hsm' | 'geral' | 'email';

@Entity({ name: 'template', schema: 'core' })
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text' })
  tipo: TemplateTipo;

  @Column({ type: 'text', nullable: true })
  canal: string | null;

  @Column({ type: 'text', nullable: true })
  assunto: string | null;

  @Column({ type: 'text', default: '' })
  corpo: string;

  @Column({ type: 'text', array: true, default: [] })
  variaveis: string[];

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
