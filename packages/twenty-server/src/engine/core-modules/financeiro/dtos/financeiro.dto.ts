// FORK: Zellate — F1 Financeiro: DTOs GraphQL
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FinanceiroStatusDTO {
  @Field(() => Boolean)
  conectado: boolean;

  @Field(() => String, { nullable: true })
  nomeConta: string | null;

  @Field(() => String, { nullable: true })
  ambiente: string | null;

  @Field(() => String, { nullable: true })
  statusConta: string | null;
}

@ObjectType()
export class FaturaDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  numero: string;

  @Field(() => String, { nullable: true })
  leadId: string | null;

  @Field(() => String)
  clienteNome: string;

  @Field(() => String, { nullable: true })
  clienteTelefone: string | null;

  @Field(() => String)
  descricao: string;

  @Field(() => Int)
  valorCentavos: number;

  @Field(() => String)
  vencimento: string;

  @Field(() => String)
  meios: string;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  linkPagamento: string | null;

  @Field(() => String, { nullable: true })
  pixPayload: string | null;

  @Field(() => Date, { nullable: true })
  pagaEm: Date | null;

  @Field(() => String, { nullable: true })
  formaPagamento: string | null;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class FaturaResumoDTO {
  @Field(() => Int)
  vencidasCentavos: number;

  @Field(() => Int)
  aVencer30dCentavos: number;

  @Field(() => Int, { nullable: true })
  tempoMedioDias: number | null;

  @Field(() => Int)
  recebidoMesCentavos: number;
}

@InputType()
export class ConectarFinanceiroInput {
  @Field(() => String)
  apiKey: string;

  @Field(() => String)
  ambiente: 'SANDBOX' | 'PRODUCAO';
}

@InputType()
export class CriarFaturaInput {
  @Field(() => String, { nullable: true })
  leadId?: string;

  @Field(() => String, { nullable: true })
  personId?: string;

  @Field(() => String)
  clienteNome: string;

  @Field(() => String, { nullable: true })
  clienteCpfCnpj?: string;

  @Field(() => String, { nullable: true })
  clienteEmail?: string;

  @Field(() => String, { nullable: true })
  clienteTelefone?: string;

  @Field(() => String)
  descricao: string;

  @Field(() => Int)
  valorCentavos: number;

  // YYYY-MM-DD
  @Field(() => String)
  vencimento: string;

  // PIX | CARTAO | BOLETO | TODOS
  @Field(() => String)
  meios: string;
}
