// FORK: Voka CRM — Fase 11: DTO for multi-number phone number list
import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WhatsappPhoneNumberDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  wabaId: string;

  @Field(() => String)
  phoneNumberId: string;

  @Field(() => String, { nullable: true })
  displayPhoneNumber: string | null;

  @Field(() => String, { nullable: true })
  label: string | null;

  @Field(() => Boolean)
  isDefault: boolean;

  @Field(() => String)
  connectionStatus: string;

  @Field(() => String)
  createdAt: string;
}

@InputType()
export class UpdateWhatsappPhoneNumberInput {
  @Field(() => String)
  instanceId: string;

  @Field(() => String, { nullable: true })
  label?: string;
}
