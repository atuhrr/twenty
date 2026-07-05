// FORK: Voka CRM — Fase 13
import { Field, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateAutomationRuleInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  triggerType: string;

  @Field(() => GraphQLJSON, { nullable: true })
  triggerConfig?: Record<string, unknown>;

  @Field(() => GraphQLJSON, { nullable: true })
  conditions?: unknown[];

  @Field(() => GraphQLJSON)
  actions: unknown[];
}

@InputType()
export class UpdateAutomationRuleInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  triggerConfig?: Record<string, unknown>;

  @Field(() => GraphQLJSON, { nullable: true })
  conditions?: unknown[];

  @Field(() => GraphQLJSON, { nullable: true })
  actions?: unknown[];

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;
}
