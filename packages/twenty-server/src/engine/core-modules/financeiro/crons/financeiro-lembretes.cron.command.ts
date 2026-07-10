// FORK: Zellate — F2 Financeiro: registro do cron da régua de lembretes
import { Command, CommandRunner } from 'nest-commander';

import {
  FINANCEIRO_LEMBRETES_CRON_PATTERN,
  FinanceiroLembretesCronJob,
} from 'src/engine/core-modules/financeiro/crons/financeiro-lembretes.cron.job';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Command({
  name: 'cron:financeiro-lembretes',
  description:
    'Registra o cron da régua de lembretes de cobrança (WhatsApp) das faturas',
})
export class FinanceiroLembretesCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: FinanceiroLembretesCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: FINANCEIRO_LEMBRETES_CRON_PATTERN,
        },
      },
    });
  }
}
