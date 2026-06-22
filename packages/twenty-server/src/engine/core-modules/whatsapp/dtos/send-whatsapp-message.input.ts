import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SendWhatsappMessageInput {
  @Field(() => String)
  contactId: string;

  @Field(() => String)
  phoneNumber: string;

  @Field(() => String)
  text: string;
}
