// FORK: Zellate — F3 Catálogo: item de negócio (produto vinculado a um lead,
// com quantidade, preço unitário e desconto). É a linha que conecta o Catálogo
// ao Funil — a soma dos itens vira o valor do negócio.
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'leadProduto', schema: 'core' })
@Index('IDX_leadProduto_leadId', ['workspaceId', 'leadId'])
export class LeadProdutoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  leadId: string;

  @Column()
  produtoId: string;

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 1 })
  quantidade: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  preco: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  desconto: number;

  @CreateDateColumn()
  createdAt: Date;
}
