import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
} from 'src/engine/core-modules/whatsapp/whatsapp-message.entity';
import { WhatsappService } from 'src/engine/core-modules/whatsapp/whatsapp.service';
import { normalizeBrPhone } from 'src/engine/core-modules/whatsapp/utils/normalize-br-phone.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

export type WhatsappOpportunityStageJobData = {
  workspaceId: string;
  opportunityId: string;
  contactId: string;
};

const MEETING_FREEFORM_TEXT =
  'Olá! Passando para confirmar nossa reunião agendada. Estamos ansiosos para conversar com você!';
const MEETING_TEMPLATE_NAME = 'reuniao_agendada';
const MEETING_TEMPLATE_LANGUAGE = 'pt_BR';

@Processor(MessageQueue.whatsappQueue)
export class WhatsappOpportunityStageJob {
  private readonly logger = new Logger(WhatsappOpportunityStageJob.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @Process(WhatsappOpportunityStageJob.name)
  async handle(data: WhatsappOpportunityStageJobData): Promise<void> {
    const { workspaceId, opportunityId, contactId } = data;

    const { isWindowOpen } = await this.whatsappService.getContactWindow(
      workspaceId,
      contactId,
    );

    const messageType = isWindowOpen
      ? WhatsappMessageType.TEXT
      : WhatsappMessageType.TEMPLATE;
    const messageContent = isWindowOpen ? MEETING_FREEFORM_TEXT : null;
    const automationMsgId = `automation:opportunity:${opportunityId}:MEETING`;

    // Idempotency: dedupeAndSaveMessage returns null when externalMessageId exists
    const saved = await this.whatsappService.dedupeAndSaveMessage({
      workspaceId,
      contactId,
      direction: WhatsappMessageDirection.OUTBOUND,
      type: messageType,
      content: messageContent,
      mediaUrl: null,
      externalMessageId: automationMsgId,
      status: WhatsappMessageStatus.SENT,
      timestamp: new Date(),
    });

    if (!saved) {
      this.logger.debug(
        `Automation message for opportunity ${opportunityId}:MEETING already dispatched — skipped`,
      );

      return;
    }

    const phone = await this.resolveContactPhone(workspaceId, contactId);

    if (!phone) {
      this.logger.warn(
        `No phone found for contact ${contactId} in workspace ${workspaceId} — WhatsApp not sent`,
      );

      return;
    }

    if (isWindowOpen) {
      await this.whatsappService.sendTextMessage(
        workspaceId,
        phone,
        MEETING_FREEFORM_TEXT,
      );
    } else {
      await this.whatsappService.sendTemplateMessage(
        workspaceId,
        phone,
        MEETING_TEMPLATE_NAME,
        MEETING_TEMPLATE_LANGUAGE,
        [],
      );
    }
  }

  private async resolveContactPhone(
    workspaceId: string,
    contactId: string,
  ): Promise<string | null> {
    const authContext = buildSystemAuthContext(workspaceId);
    let phone: string | null = null;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepo =
          await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            workspaceId,
            'person',
            { shouldBypassPermissionChecks: true },
          );

        const person = await personRepo.findOne({
          where: { id: contactId },
        } as never);

        if (!person) return;

        const phonesField = person.phones as {
          primaryPhoneCallingCode?: string;
          primaryPhoneNumber?: string;
        } | null;
        const callingCode = phonesField?.primaryPhoneCallingCode ?? '';
        const number = phonesField?.primaryPhoneNumber ?? '';

        if (number) {
          phone = normalizeBrPhone(callingCode.replace('+', '') + number);
        }
      },
      authContext,
    );

    return phone;
  }
}
