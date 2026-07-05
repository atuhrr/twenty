// FORK: Voka CRM — Fase 14.1: grafo como única fonte de verdade
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { type BotGraph, type BotTrigger } from './salesbot-graph.types';

@Entity({ name: 'salesbot', schema: 'core' })
export class SalesbotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  triggers: BotTrigger[];

  @Column({
    type: 'jsonb',
    default: { nodes: [], edges: [] },
  })
  graph: BotGraph;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
