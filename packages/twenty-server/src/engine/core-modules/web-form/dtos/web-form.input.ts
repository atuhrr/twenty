// FORK: Voka CRM — Fase 15
import { Field, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateWebFormInput {
  @Field(() => String)
  name: string;

  @Field(() => GraphQLJSON)
  fields: unknown[];

  @Field(() => String, { nullable: true })
  funnelId?: string;
}

@InputType()
export class UpdateWebFormInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  fields?: unknown[];

  @Field(() => String, { nullable: true })
  funnelId?: string;

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
