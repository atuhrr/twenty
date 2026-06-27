// FORK: Voka CRM — Fase 11
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignWhatsappThreadInput {
  @Field(() => String)
  contactId: string;

  @Field(() => String, { nullable: true })
  assignedUserId?: string;

  @Field(() => String, { nullable: true })
  assignedUserName?: string;
}
