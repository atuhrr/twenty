// FORK: Voka CRM — Fase 14.1
import { Field, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateSalesbotInput {
  @Field(() => String)
  name: string;

  @Field(() => GraphQLJSON, { nullable: true })
  triggers?: unknown[];

  @Field(() => GraphQLJSON, { nullable: true })
  graph?: unknown;
}

@InputType()
export class UpdateSalesbotInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  triggers?: unknown[];

  @Field(() => GraphQLJSON, { nullable: true })
  graph?: unknown;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
