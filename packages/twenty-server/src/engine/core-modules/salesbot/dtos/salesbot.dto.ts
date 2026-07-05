// FORK: Voka CRM — Fase 14.1
import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class SalesbotDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  workspaceId: string;

  @Field(() => String)
  name: string;

  @Field(() => GraphQLJSON)
  triggers: unknown[];

  @Field(() => GraphQLJSON)
  graph: unknown;

  @Field(() => Boolean)
  enabled: boolean;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}
