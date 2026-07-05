// FORK: Voka CRM — Fase 13
import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class AutomationRuleDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  workspaceId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  triggerType: string;

  @Field(() => GraphQLJSON)
  triggerConfig: Record<string, unknown>;

  @Field(() => GraphQLJSON)
  conditions: unknown[];

  @Field(() => GraphQLJSON)
  actions: unknown[];

  @Field(() => Boolean)
  enabled: boolean;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}

@ObjectType()
export class AutomationExecutionDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  ruleId: string;

  @Field(() => String)
  workspaceId: string;

  @Field(() => String)
  recordId: string;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  error: string | null;

  @Field(() => String)
  executedAt: string;
}
