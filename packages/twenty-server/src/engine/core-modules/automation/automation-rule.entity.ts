// FORK: Voka CRM — Fase 13
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AutomationCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'notContains' | 'exists';
  value: unknown;
};

export type AutomationAction = {
  type:
    | 'CREATE_TASK'
    | 'SEND_TEMPLATE'
    | 'MOVE_STAGE'
    | 'ASSIGN_USER'
    | 'WEBHOOK';
  config: Record<string, unknown>;
};

export type AutomationTriggerConfig = {
  fromStage?: string;
  toStage?: string;
};

@Entity({ name: 'automationRule', schema: 'core' })
@Index('IDX_automationRule_workspaceId_trigger', ['workspaceId', 'triggerType'])
export class AutomationRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  workspaceId: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  triggerType: string;

  @Column({ type: 'jsonb', nullable: false, default: '{}' })
  triggerConfig: AutomationTriggerConfig;

  @Column({ type: 'jsonb', nullable: false, default: '[]' })
  conditions: AutomationCondition[];

  @Column({ type: 'jsonb', nullable: false, default: '[]' })
  actions: AutomationAction[];

  @Column({ type: 'boolean', nullable: false, default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
