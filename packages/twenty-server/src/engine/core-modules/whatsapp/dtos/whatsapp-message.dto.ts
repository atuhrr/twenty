import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import {
  ChannelType,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';

registerEnumType(WhatsappMessageDirection, { name: 'WhatsappMessageDirection' });
registerEnumType(WhatsappMessageType, { name: 'WhatsappMessageType' });
registerEnumType(WhatsappMessageStatus, { name: 'WhatsappMessageStatus' });
registerEnumType(ChannelType, { name: 'ChannelType' });

@ObjectType('WhatsappMessage')
export class WhatsappMessageDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  contactId: string;

  @Field(() => WhatsappMessageDirection)
  direction: WhatsappMessageDirection;

  @Field(() => WhatsappMessageType)
  type: WhatsappMessageType;

  @Field(() => String, { nullable: true })
  content: string | null;

  @Field(() => String, { nullable: true })
  mediaUrl: string | null;

  @Field(() => String)
  externalMessageId: string;

  @Field(() => WhatsappMessageStatus)
  status: WhatsappMessageStatus;

  @Field(() => Date)
  timestamp: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => ChannelType)
  channelType: ChannelType;
}
