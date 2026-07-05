// FORK: Voka CRM — Fase 15
import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class WebFormDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => GraphQLJSON)
  fields: unknown[];

  @Field(() => String, { nullable: true })
  funnelId: string | null;

  @Field(() => String)
  publicToken: string;

  @Field(() => Boolean)
  enabled: boolean;

  @Field(() => String)
  createdAt: string;
}
