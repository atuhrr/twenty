// FORK: Zellate — DTOs do calendário
import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AgendaEventoDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  titulo: string;

  @Field(() => String)
  cor: string;

  @Field(() => Date)
  inicio: Date;

  @Field(() => Date)
  fim: Date;

  @Field(() => String, { nullable: true })
  leadId: string | null;
}

@InputType()
export class CriarAgendaEventoInput {
  @Field(() => String)
  titulo: string;

  @Field(() => String, { nullable: true })
  cor?: string;

  @Field(() => Date)
  inicio: Date;

  @Field(() => Date)
  fim: Date;

  @Field(() => String, { nullable: true })
  leadId?: string;
}

@InputType()
export class AtualizarAgendaEventoInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  titulo?: string;

  @Field(() => String, { nullable: true })
  cor?: string;

  @Field(() => Date, { nullable: true })
  inicio?: Date;

  @Field(() => Date, { nullable: true })
  fim?: Date;

  @Field(() => String, { nullable: true })
  leadId?: string;
}
