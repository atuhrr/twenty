// FORK: Voka CRM — Fase 9/10: thread summary DTO for the Inbox conversation list
import { Field, Int, ObjectType } from '@nestjs/graphql';

import { ChannelType } from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappMessageDTO } from 'src/engine/core-modules/whatsapp/dtos/whatsapp-message.dto';

@ObjectType()
export class WhatsappThreadSummaryDTO {
  @Field(() => String)
  contactId: string;

  @Field(() => String, { nullable: true })
  phoneNumber: string | null;

  @Field(() => WhatsappMessageDTO)
  lastMessage: WhatsappMessageDTO;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => String)
  channelType: ChannelType;

  @Field(() => String, { nullable: true })
  assignedUserId: string | null;

  @Field(() => String, { nullable: true })
  assignedUserName: string | null;
}
