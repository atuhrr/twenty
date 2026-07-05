// FORK: Voka CRM — Fase 20.2: DTOs da análise ganho-perda
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LeadValorDTO {
  @Field(() => Int)
  leads: number;

  @Field(() => Float)
  valor: number;
}

@ObjectType()
export class EtapaStatsDTO {
  @Field()
  etapaNome: string;

  @Field(() => LeadValorDTO)
  dentroDaEtapa: LeadValorDTO;

  @Field(() => LeadValorDTO)
  entrouNaEtapa: LeadValorDTO;

  @Field(() => LeadValorDTO)
  perdidoNaEtapa: LeadValorDTO;

  @Field(() => Float)
  taxaConversao: number;
}

@ObjectType()
export class VendaProspectivaDTO {
  @Field()
  etapaNome: string;

  @Field(() => Float)
  valorPonderado: number;
}

@ObjectType()
export class GanhoPerdaStatsDTO {
  @Field(() => [EtapaStatsDTO])
  porEtapa: EtapaStatsDTO[];

  @Field(() => LeadValorDTO)
  totalGanho: LeadValorDTO;

  @Field(() => LeadValorDTO)
  totalPerdido: LeadValorDTO;

  @Field(() => Float)
  cicloVidaMedioEmDias: number;

  @Field(() => [VendaProspectivaDTO])
  vendasProspectivas: VendaProspectivaDTO[];
}
