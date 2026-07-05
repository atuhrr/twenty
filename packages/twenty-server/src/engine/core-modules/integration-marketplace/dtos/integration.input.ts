// FORK: Voka CRM — Fase 16
import { Field, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class InstallIntegrationInput {
  @Field()
  integrationKey: string;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: Record<string, string>;
}

@InputType()
export class UpdateInstalledIntegrationInput {
  @Field()
  integrationKey: string;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: Record<string, string>;

  @Field({ nullable: true })
  enabled?: boolean;
}
