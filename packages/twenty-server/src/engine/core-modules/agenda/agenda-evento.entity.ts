// FORK: Zellate — evento de agenda (calendário do usuário, estilo Teams)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'agendaEvento', schema: 'core' })
@Index('IDX_AGENDA_EVENTO_WORKSPACE_INICIO', ['workspaceId', 'inicio'])
export class AgendaEventoEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  titulo: string;

  // Chave de cor semântica: danger | success | primary | warning
  @Column({ nullable: false, type: 'text', default: 'primary' })
  cor: string;

  @Column({ nullable: false, type: 'timestamptz' })
  inicio: Date;

  @Column({ nullable: false, type: 'timestamptz' })
  fim: Date;

  // Vínculo opcional com um lead (opportunity do schema do workspace)
  @Column({ nullable: true, type: 'uuid' })
  leadId: string | null;

  // Quem criou (userId) — base para agenda por usuário no multi-assento
  @Column({ nullable: true, type: 'uuid' })
  criadoPorUserId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
