// FORK: Voka CRM — Fase 20.2: DTOs do relatório consolidado
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SerieLeadsDTO {
  @Field()
  data: string;

  @Field(() => Int)
  quantidade: number;

  @Field(() => Float)
  valor: number;
}

@ObjectType()
export class EtapaResumoDTO {
  @Field()
  nome: string;

  @Field(() => Int)
  quantidade: number;

  @Field(() => Float)
  valor: number;

  @Field(() => Float)
  percentual: number;
}

@ObjectType()
export class UsuarioResumoDTO {
  @Field()
  nome: string;

  @Field(() => Int)
  quantidade: number;

  @Field(() => Float)
  valor: number;

  @Field(() => Float)
  percentual: number;
}

@ObjectType()
export class TipoContatoDTO {
  @Field()
  tipo: string;

  @Field(() => Int)
  quantidade: number;

  @Field(() => Float)
  percentual: number;
}

@ObjectType()
export class StatusTarefaDTO {
  @Field()
  status: string;

  @Field(() => Int)
  quantidade: number;

  @Field(() => Float)
  percentual: number;
}

@ObjectType()
export class ContatosResumoDTO {
  @Field(() => Int)
  total: number;

  @Field(() => [TipoContatoDTO])
  porTipo: TipoContatoDTO[];
}

@ObjectType()
export class TarefasResumoDTO {
  @Field(() => Int)
  total: number;

  @Field(() => [StatusTarefaDTO])
  porStatus: StatusTarefaDTO[];
}

@ObjectType()
export class RelatorioConsolidadoDTO {
  @Field(() => [SerieLeadsDTO])
  serieLeads: SerieLeadsDTO[];

  @Field(() => [EtapaResumoDTO])
  porEtapa: EtapaResumoDTO[];

  @Field(() => [UsuarioResumoDTO])
  porUsuario: UsuarioResumoDTO[];

  @Field(() => Int)
  totalLeads: number;

  @Field(() => Float)
  valorTotal: number;

  @Field(() => ContatosResumoDTO)
  contatos: ContatosResumoDTO;

  @Field(() => [UsuarioResumoDTO])
  porUsuarioContato: UsuarioResumoDTO[];

  @Field(() => TarefasResumoDTO)
  tarefas: TarefasResumoDTO;
}
