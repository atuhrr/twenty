// FORK: Zellate — F2 Financeiro: cron da régua de lembretes de cobrança
import { Injectable, Logger } from '@nestjs/common';

import { FinanceiroService } from 'src/engine/core-modules/financeiro/financeiro.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

// A régua trabalha por dia de vencimento; rodar de hora em hora dá folga
// para retries sem duplicar (dedupe por marco+vencimento no faturaEvento).
export const FINANCEIRO_LEMBRETES_CRON_PATTERN = '0 * * * *';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class FinanceiroLembretesCronJob {
  private readonly logger = new Logger(FinanceiroLembretesCronJob.name);

  constructor(private readonly financeiroService: FinanceiroService) {}

  @Process(FinanceiroLembretesCronJob.name)
  async handle(): Promise<void> {
    try {
      await this.financeiroService.processarLembretes();
    } catch (error) {
      this.logger.error(
        `Régua de lembretes falhou: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
