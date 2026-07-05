// FORK: Voka CRM — Fase 2: DTOs do domínio CRM
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MotivoPerdaDTO {
  @Field(() => ID) id: string;
  @Field() workspaceId: string;
  @Field() nome: string;
  @Field() ativo: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class ProdutoDTO {
  @Field(() => ID) id: string;
  @Field() workspaceId: string;
  @Field() nome: string;
  @Field(() => String, { nullable: true }) descricao: string | null;
  @Field(() => Float) preco: number;
  @Field() unidade: string;
  @Field(() => String, { nullable: true }) sku: string | null;
  @Field() ativo: boolean;
  @Field(() => String, { nullable: true }) categoria: string | null;
  @Field(() => [String]) imagens: string[];
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class ClienteRecorrenteDTO {
  @Field(() => ID) id: string;
  @Field() workspaceId: string;
  @Field() nome: string;
  @Field(() => String, { nullable: true }) email: string | null;
  @Field(() => String, { nullable: true }) telefone: string | null;
  @Field(() => String, { nullable: true }) empresa: string | null;
  @Field() periodicidade: string;
  @Field(() => Float) valorRecorrente: number;
  @Field(() => String, { nullable: true }) proximoContato: string | null;
  @Field(() => String, { nullable: true }) responsavelId: string | null;
  @Field(() => [String]) tags: string[];
  @Field(() => String, { nullable: true }) observacoes: string | null;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class VokaNotificationDTO {
  @Field(() => ID) id: string;
  @Field() workspaceId: string;
  @Field() userId: string;
  @Field() tipo: string;
  @Field() titulo: string;
  @Field(() => String, { nullable: true }) corpo: string | null;
  @Field(() => String, { nullable: true }) link: string | null;
  @Field() lida: boolean;
  @Field() createdAt: Date;
}
