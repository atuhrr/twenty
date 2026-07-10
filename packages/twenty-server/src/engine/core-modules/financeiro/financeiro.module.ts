// FORK: Zellate — F1 Financeiro: módulo de faturas (driver Asaas)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AsaasProvider } from 'src/engine/core-modules/financeiro/asaas.provider';
import { AssinaturaEntity } from 'src/engine/core-modules/financeiro/assinatura.entity';
import { FinanceiroLembretesCronJob } from 'src/engine/core-modules/financeiro/crons/financeiro-lembretes.cron.job';
import { FaturaEntity } from 'src/engine/core-modules/financeiro/fatura.entity';
import { FaturaEventoEntity } from 'src/engine/core-modules/financeiro/fatura-evento.entity';
import { FinanceiroContaEntity } from 'src/engine/core-modules/financeiro/financeiro-conta.entity';
import { FinanceiroResolver } from 'src/engine/core-modules/financeiro/financeiro.resolver';
import { FinanceiroService } from 'src/engine/core-modules/financeiro/financeiro.service';
import { FinanceiroWebhookController } from 'src/engine/core-modules/financeiro/financeiro-webhook.controller';
import { FinanceiroWebhookJob } from 'src/engine/core-modules/financeiro/financeiro-webhook.job';
import { NotificationsModule } from 'src/engine/core-modules/notifications/notifications.module';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappModule } from 'src/engine/core-modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinanceiroContaEntity,
      FaturaEntity,
      FaturaEventoEntity,
      AssinaturaEntity,
      WhatsappContactWindowEntity,
    ]),
    SecretEncryptionModule,
    NotificationsModule,
    WhatsappModule,
  ],
  controllers: [FinanceiroWebhookController],
  providers: [
    AsaasProvider,
    FinanceiroService,
    FinanceiroResolver,
    FinanceiroWebhookJob,
    FinanceiroLembretesCronJob,
  ],
  exports: [FinanceiroService],
})
export class FinanceiroModule {}
