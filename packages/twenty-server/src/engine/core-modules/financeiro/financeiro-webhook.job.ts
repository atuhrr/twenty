// FORK: Zellate — F1 Financeiro: processamento assíncrono do webhook Asaas
import { Injectable, Logger } from '@nestjs/common';

import { FinanceiroService } from 'src/engine/core-modules/financeiro/financeiro.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type FinanceiroWebhookPayload = {
  workspaceId: string;
  evento: {
    id?: string;
    event?: string;
    payment?: {
      id?: string;
      value?: number;
      billingType?: string;
      paymentDate?: string;
    };
  };
};

@Processor(MessageQueue.whatsappQueue)
@Injectable()
export class FinanceiroWebhookJob {
  private readonly logger = new Logger(FinanceiroWebhookJob.name);

  constructor(private readonly financeiroService: FinanceiroService) {}

  @Process(FinanceiroWebhookJob.name)
  async handle(data: FinanceiroWebhookPayload): Promise<void> {
    await this.financeiroService
      .processarEventoWebhook(data.workspaceId, data.evento)
      .catch((err) => {
        this.logger.error(
          `Falha ao processar webhook financeiro: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      });
  }
}
