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

  // FORK: Zellate — nome de perfil do WhatsApp (a Cloud API nao expoe foto)
  @Field(() => String, { nullable: true })
  contactName: string | null;

  // FORK: Zellate — vínculo com o CRM (person/opportunity do workspace)
  @Field(() => String, { nullable: true })
  personId: string | null;

  @Field(() => String, { nullable: true })
  opportunityId: string | null;

  // FORK: Zellate — bot pausado para esta conversa (humano assumiu)
  @Field(() => Boolean)
  botPaused: boolean;

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
