// FORK: Voka CRM — Fase 16
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index('IDX_installedIntegration_workspaceId', ['workspaceId'])
@Entity({ name: 'installedIntegration', schema: 'core' })
export class InstalledIntegrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  integrationKey: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, string>;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
