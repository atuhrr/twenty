import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { WhatsappConnectionStatus } from 'src/engine/core-modules/whatsapp/whatsapp-instance.entity';

registerEnumType(WhatsappConnectionStatus, {
  name: 'WhatsappConnectionStatus',
});

@ObjectType('WhatsappConnectionStatusResult')
export class WhatsappConnectionStatusDTO {
  @Field(() => WhatsappConnectionStatus)
  status: WhatsappConnectionStatus;

  @Field(() => String, { nullable: true })
  displayPhoneNumber: string | null;
}
