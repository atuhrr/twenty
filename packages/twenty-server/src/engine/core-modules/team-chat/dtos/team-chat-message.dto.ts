// FORK: Voka CRM — Fase 10
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('TeamChatMessage')
export class TeamChatMessageDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  senderId: string;

  @Field(() => String)
  senderName: string;

  @Field(() => String, { nullable: true })
  relatedRecordId: string | null;

  @Field(() => String, { nullable: true })
  relatedRecordType: string | null;

  @Field(() => String)
  content: string;

  @Field(() => Date)
  createdAt: Date;
}
