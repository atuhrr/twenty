// FORK: Voka CRM — Fase 11: WhatsApp template DTOs
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class WhatsappTemplateComponentDTO {
  @Field(() => String)
  type: string; // HEADER | BODY | FOOTER | BUTTONS

  @Field(() => String, { nullable: true })
  text: string | null;
}

@ObjectType()
export class WhatsappTemplateDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  status: string; // APPROVED | PENDING | REJECTED

  @Field(() => String)
  language: string;

  @Field(() => String, { nullable: true })
  category: string | null;

  @Field(() => [WhatsappTemplateComponentDTO])
  components: WhatsappTemplateComponentDTO[];
}

@InputType()
export class SendWhatsappTemplateInput {
  @Field(() => String)
  contactId: string;

  @Field(() => String)
  phoneNumber: string;

  @Field(() => String)
  templateName: string;

  @Field(() => String)
  languageCode: string;

  @Field(() => GraphQLJSON, { nullable: true })
  components?: object[];
}
