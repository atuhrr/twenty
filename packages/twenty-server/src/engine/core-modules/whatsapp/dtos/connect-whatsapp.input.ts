import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ConnectWhatsappInput {
  @Field(() => String)
  wabaId: string;

  @Field(() => String)
  phoneNumberId: string;

  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  appSecret: string;

  @Field(() => String, { nullable: true })
  displayPhoneNumber?: string;
}
