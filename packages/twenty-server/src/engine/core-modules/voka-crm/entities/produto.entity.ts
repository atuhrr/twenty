// FORK: Voka CRM — Fase 2
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'produto', schema: 'core' })
export class ProdutoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  nome: string;

  @Column({ nullable: true, type: 'text' })
  descricao: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  preco: number;

  @Column({ default: 'un' })
  unidade: string;

  @Column({ nullable: true, type: 'text' })
  sku: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true, type: 'text' })
  categoria: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'::text[]" })
  imagens: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
