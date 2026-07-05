// FORK: Voka CRM — Fase 18: equipes
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'team', schema: 'core' })
@Index('IDX_team_workspaceId', ['workspaceId'])
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid' })
  workspaceId: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: false, type: 'jsonb', default: [] })
  memberIds: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
