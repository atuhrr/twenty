import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('WhatsappContactWindow')
export class WhatsappContactWindowDTO {
  @Field(() => String)
  contactId: string;

  @Field(() => Date, { nullable: true })
  lastInboundAt: Date | null;

  // Computed: lastInboundAt is within the last 24h
  @Field(() => Boolean)
  isWindowOpen: boolean;
}
