// FORK: Voka CRM — Fase 2: inputs do domínio CRM
import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMotivoPerdaInput {
  @Field() nome: string;
}

@InputType()
export class CreateProdutoInput {
  @Field() nome: string;
  @Field(() => String, { nullable: true }) descricao?: string;
  @Field(() => Float, { nullable: true }) preco?: number;
  @Field(() => String, { nullable: true }) unidade?: string;
  @Field(() => String, { nullable: true }) sku?: string;
  @Field(() => String, { nullable: true }) categoria?: string;
}

@InputType()
export class UpdateProdutoInput {
  @Field() id: string;
  @Field(() => String, { nullable: true }) nome?: string;
  @Field(() => String, { nullable: true }) descricao?: string;
  @Field(() => Float, { nullable: true }) preco?: number;
  @Field(() => String, { nullable: true }) unidade?: string;
  @Field(() => Boolean, { nullable: true }) ativo?: boolean;
  @Field(() => String, { nullable: true }) categoria?: string;
}

@InputType()
export class AddLeadProdutoInput {
  @Field() leadId: string;
  @Field() produtoId: string;
  @Field(() => Float, { nullable: true }) quantidade?: number;
  @Field(() => Float, { nullable: true }) preco?: number;
  @Field(() => Float, { nullable: true }) desconto?: number;
}

@InputType()
export class UpdateLeadProdutoInput {
  @Field() id: string;
  @Field(() => Float, { nullable: true }) quantidade?: number;
  @Field(() => Float, { nullable: true }) preco?: number;
  @Field(() => Float, { nullable: true }) desconto?: number;
}

@InputType()
export class CreateClienteRecorrenteInput {
  @Field() nome: string;
  @Field(() => String, { nullable: true }) email?: string;
  @Field(() => String, { nullable: true }) telefone?: string;
  @Field(() => String, { nullable: true }) empresa?: string;
  @Field(() => String, { nullable: true }) periodicidade?: string;
  @Field(() => Float, { nullable: true }) valorRecorrente?: number;
  @Field(() => String, { nullable: true }) proximoContato?: string;
  @Field(() => String, { nullable: true }) responsavelId?: string;
  @Field(() => [String], { nullable: true }) tags?: string[];
  @Field(() => String, { nullable: true }) observacoes?: string;
}

@InputType()
export class UpdateClienteRecorrenteInput {
  @Field() id: string;
  @Field(() => String, { nullable: true }) nome?: string;
  @Field(() => String, { nullable: true }) email?: string;
  @Field(() => String, { nullable: true }) telefone?: string;
  @Field(() => String, { nullable: true }) empresa?: string;
  @Field(() => String, { nullable: true }) periodicidade?: string;
  @Field(() => Float, { nullable: true }) valorRecorrente?: number;
  @Field(() => String, { nullable: true }) proximoContato?: string;
  @Field(() => String, { nullable: true }) responsavelId?: string;
  @Field(() => [String], { nullable: true }) tags?: string[];
  @Field(() => String, { nullable: true }) observacoes?: string;
}
