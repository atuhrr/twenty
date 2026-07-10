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

@ObjectType()
export class FinanceiroConfigDTO {
  @Field(() => Number, { nullable: true })
  jurosPadraoPercent: number | null;

  @Field(() => Number, { nullable: true })
  multaPadraoPercent: number | null;

  @Field(() => Boolean)
  reguaAtiva: boolean;

  @Field(() => [Int])
  reguaDiasAntes: number[];

  @Field(() => [Int])
  reguaDiasDepois: number[];

  @Field(() => String, { nullable: true })
  templateLembrete: string | null;
}

@ObjectType()
export class AssinaturaDTO {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  leadId: string | null;

  @Field(() => String)
  clienteNome: string;

  @Field(() => String)
  descricao: string;

  @Field(() => Int)
  valorCentavos: number;

  @Field(() => String)
  ciclo: string;

  @Field(() => String)
  proximoVencimento: string;

  @Field(() => String)
  meios: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class ReceitaMesDTO {
  @Field(() => String)
  mes: string;

  @Field(() => Int)
  centavos: number;
}

@ObjectType()
export class ReceitaClienteDTO {
  @Field(() => String)
  nome: string;

  @Field(() => Int)
  centavos: number;
}

@ObjectType()
export class ReceitaStatsDTO {
  @Field(() => [ReceitaMesDTO])
  recebidoPorMes: ReceitaMesDTO[];

  @Field(() => Number)
  inadimplenciaPercent: number;

  @Field(() => Int)
  ticketMedioCentavos: number;

  @Field(() => Int)
  previsaoMesCentavos: number;

  @Field(() => [ReceitaClienteDTO])
  topClientes: ReceitaClienteDTO[];
}

@InputType()
export class AtualizarFinanceiroConfigInput {
  @Field(() => Number, { nullable: true })
  jurosPadraoPercent?: number;

  @Field(() => Number, { nullable: true })
  multaPadraoPercent?: number;

  @Field(() => Boolean, { nullable: true })
  reguaAtiva?: boolean;

  @Field(() => [Int], { nullable: true })
  reguaDiasAntes?: number[];

  @Field(() => [Int], { nullable: true })
  reguaDiasDepois?: number[];

  @Field(() => String, { nullable: true })
  templateLembrete?: string;
}

@InputType()
export class CriarAssinaturaInput {
  @Field(() => String, { nullable: true })
  leadId?: string;

  @Field(() => String)
  clienteNome: string;

  @Field(() => String, { nullable: true })
  clienteCpfCnpj?: string;

  @Field(() => String, { nullable: true })
  clienteTelefone?: string;

  @Field(() => String)
  descricao: string;

  @Field(() => Int)
  valorCentavos: number;

  // YYYY-MM-DD (primeira cobrança)
  @Field(() => String)
  proximoVencimento: string;

  @Field(() => String)
  meios: string;
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

  // F2: encargos e régua (opcionais; default vem da configuração)
  @Field(() => Number, { nullable: true })
  jurosPercent?: number;

  @Field(() => Number, { nullable: true })
  multaPercent?: number;

  @Field(() => Int, { nullable: true })
  descontoCentavos?: number;

  @Field(() => Boolean, { nullable: true })
  lembretesAtivos?: boolean;
}
