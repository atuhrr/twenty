// FORK: Voka CRM — B2.1
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateTemplateInput {
  @Field(() => String)
  nome: string;

  @Field(() => String)
  tipo: string;

  @Field(() => String, { nullable: true })
  canal?: string;

  @Field(() => String, { nullable: true })
  assunto?: string;

  @Field(() => String, { nullable: true })
  corpo?: string;

  @Field(() => [String], { nullable: true })
  variaveis?: string[];
}

@InputType()
export class UpdateTemplateInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  nome?: string;

  @Field(() => String, { nullable: true })
  canal?: string;

  @Field(() => String, { nullable: true })
  assunto?: string;

  @Field(() => String, { nullable: true })
  corpo?: string;

  @Field(() => [String], { nullable: true })
  variaveis?: string[];

  @Field(() => Boolean, { nullable: true })
  ativo?: boolean;
}
