// FORK: Voka CRM — Fase 20.2: DTOs do painel de estatísticas
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FonteCountDTO {
  @Field()
  nome: string;

  @Field(() => Int)
  quantidade: number;
}

@ObjectType()
export class CanalCountDTO {
  @Field()
  canal: string;

  @Field(() => Int)
  quantidade: number;
}

@ObjectType()
export class DashboardStatsDTO {
  @Field(() => Int)
  mensagensRecebidas: number;

  @Field(() => Int)
  conversasEmAndamento: number;

  @Field(() => Int)
  conversasSemResposta: number;

  @Field(() => Float)
  tempoMedioResposta: number;

  @Field(() => Float)
  maiorTempoAguardando: number;

  @Field(() => Int)
  leadsGanhos: number;

  @Field(() => Float)
  valorLeadsGanhos: number;

  @Field(() => Int)
  leadsAtivos: number;

  @Field(() => Float)
  valorLeadsAtivos: number;

  @Field(() => Int)
  tarefas: number;

  @Field(() => [FonteCountDTO])
  fontesDeLead: FonteCountDTO[];

  @Field(() => [CanalCountDTO])
  porCanal: CanalCountDTO[];
}
