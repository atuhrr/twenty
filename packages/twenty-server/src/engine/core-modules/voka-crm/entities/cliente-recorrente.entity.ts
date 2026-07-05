// FORK: Voka CRM — Fase 2
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clienteRecorrente', schema: 'core' })
export class ClienteRecorrenteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  nome: string;

  @Column({ nullable: true, type: 'text' })
  email: string | null;

  @Column({ nullable: true, type: 'text' })
  telefone: string | null;

  @Column({ nullable: true, type: 'text' })
  empresa: string | null;

  @Column({ default: 'MENSAL' })
  periodicidade: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  valorRecorrente: number;

  @Column({ nullable: true, type: 'date' })
  proximoContato: string | null;

  @Column({ nullable: true, type: 'uuid' })
  responsavelId: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'::text[]" })
  tags: string[];

  @Column({ nullable: true, type: 'text' })
  observacoes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
