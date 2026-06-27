// FORK: Voka CRM — Fase 10
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SendTeamChatMessageInput {
  @Field(() => String, { nullable: true })
  relatedRecordId?: string;

  @Field(() => String, { nullable: true })
  relatedRecordType?: string;

  @Field(() => String)
  content: string;
}
