// FORK: Voka CRM — Fase 12
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@ObjectType()
export class BroadcastCampaignDTO {
  @Field(() => String) id: string;
  @Field(() => String) workspaceId: string;
  @Field(() => String) name: string;
  @Field(() => String) channel: string;
  @Field(() => String) status: string;
  @Field(() => String, { nullable: true }) templateName: string | null;
  @Field(() => String) languageCode: string;
  @Field(() => String, { nullable: true }) scheduledAt: string | null;
  @Field(() => String, { nullable: true }) startedAt: string | null;
  @Field(() => String, { nullable: true }) completedAt: string | null;
  @Field(() => Int) totalCount: number;
  @Field(() => Int) sentCount: number;
  @Field(() => Int) deliveredCount: number;
  @Field(() => Int) readCount: number;
  @Field(() => Int) failedCount: number;
  @Field(() => String) createdAt: string;
  @Field(() => String) updatedAt: string;
}

@ObjectType()
export class BroadcastRecipientDTO {
  @Field(() => String) id: string;
  @Field(() => String) campaignId: string;
  @Field(() => String, { nullable: true }) contactId: string | null;
  @Field(() => String) phoneNumber: string;
  @Field(() => String) status: string;
  @Field(() => String, { nullable: true }) sentAt: string | null;
  @Field(() => String, { nullable: true }) deliveredAt: string | null;
  @Field(() => String, { nullable: true }) readAt: string | null;
  @Field(() => String, { nullable: true }) errorMessage: string | null;
}

@InputType()
export class CreateBroadcastCampaignInput {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  templateName?: string;

  @Field(() => String, { defaultValue: 'pt_BR' })
  @IsOptional()
  @IsString()
  languageCode: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  scheduledAt?: string;

  @Field(() => [BroadcastRecipientInput])
  recipients: BroadcastRecipientInput[];
}

@InputType()
export class BroadcastRecipientInput {
  @Field(() => String)
  @IsString()
  phoneNumber: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  contactId?: string;
}
