// FORK: Voka CRM — Fase 20.2: DTOs de CRUD de relatórios ROI
import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RoiRelatorioDTO {
  @Field()
  id: string;

  @Field()
  workspaceId: string;

  @Field()
  nome: string;

  @Field(() => Float)
  investimento: number;

  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  leadsGanhos: number;

  @Field(() => Int)
  leadsPerdidos: number;

  @Field(() => Float)
  receita: number;

  @Field(() => Float, { nullable: true })
  roi: number | null;

  @Field()
  criadoEm: string;
}

@InputType()
export class CreateRoiRelatorioInput {
  @Field()
  nome: string;

  @Field(() => Float)
  investimento: number;

  @Field({ nullable: true })
  funilId?: string;

  @Field({ nullable: true })
  etapa?: string;

  @Field({ nullable: true })
  periodo?: string;
}

@InputType()
export class UpdateRoiRelatorioInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  nome?: string;

  @Field(() => Float, { nullable: true })
  investimento?: number;
}
