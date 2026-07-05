// FORK: Voka CRM — Fase 16
import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class InstalledIntegrationDTO {
  @Field()
  id: string;

  @Field()
  integrationKey: string;

  @Field(() => GraphQLJSON)
  config: Record<string, string>;

  @Field()
  enabled: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class IntegrationCatalogItemDTO {
  @Field()
  key: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field()
  logoUrl: string;

  @Field(() => GraphQLJSON)
  configFields: unknown;

  @Field(() => [String])
  events: string[];

  @Field({ nullable: true })
  docsUrl?: string;
}
