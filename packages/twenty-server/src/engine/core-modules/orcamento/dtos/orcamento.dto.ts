// FORK: Zellate — F4: retorno do envio de orçamento
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrcamentoEnvioDTO {
  @Field() link: string;
  @Field() enviado: boolean;
  @Field(() => String, { nullable: true }) aviso: string | null;
}
