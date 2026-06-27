// FORK: Voka CRM — Fase 11
import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType('WhatsappQuickReply')
export class WhatsappQuickReplyDTO {
  @Field()
  id: string;

  @Field()
  shortcut: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreateWhatsappQuickReplyInput {
  @Field()
  shortcut: string;

  @Field()
  title: string;

  @Field()
  content: string;
}
