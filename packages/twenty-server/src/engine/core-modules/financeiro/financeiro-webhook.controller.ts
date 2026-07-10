// FORK: Zellate — F1 Financeiro: webhook do Asaas (público, validado por token)
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import { Response } from 'express';

import { FinanceiroWebhookJob } from 'src/engine/core-modules/financeiro/financeiro-webhook.job';
import { FinanceiroService } from 'src/engine/core-modules/financeiro/financeiro.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Controller('financeiro')
export class FinanceiroWebhookController {
  private readonly logger = new Logger(FinanceiroWebhookController.name);

  constructor(
    private readonly financeiroService: FinanceiroService,
    @InjectMessageQueue(MessageQueue.whatsappQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Post('webhook/:workspaceId')
  @HttpCode(200)
  async handleWebhook(
    @Param('workspaceId') workspaceId: string,
    @Headers('asaas-access-token') token: string | undefined,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const valido = await this.financeiroService.validarWebhookToken(
      workspaceId,
      token,
    );

    if (!valido) {
      this.logger.warn(
        `Webhook financeiro com token inválido para workspace ${workspaceId}`,
      );

      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Responde 200 imediatamente; processa assíncrono (padrão whatsapp-queue)
    res.status(200).json({ received: true });

    await this.messageQueueService.add(
      FinanceiroWebhookJob.name,
      { workspaceId, evento: body },
      { retryLimit: 3 },
    );
  }
}
