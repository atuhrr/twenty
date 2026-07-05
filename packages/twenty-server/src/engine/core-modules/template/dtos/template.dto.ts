// FORK: Voka CRM — B2.1
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TemplateDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  workspaceId: string;

  @Field(() => String)
  nome: string;

  @Field(() => String)
  tipo: string;

  @Field(() => String, { nullable: true })
  canal: string | null;

  @Field(() => String, { nullable: true })
  assunto: string | null;

  @Field(() => String)
  corpo: string;

  @Field(() => [String])
  variaveis: string[];

  @Field(() => Boolean)
  ativo: boolean;

  @Field(() => String)
  criadoEm: string;

  @Field(() => String)
  atualizadoEm: string;
}
