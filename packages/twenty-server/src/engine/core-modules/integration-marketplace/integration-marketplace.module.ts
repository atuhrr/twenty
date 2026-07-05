// FORK: Voka CRM — Fase 16
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InstalledIntegrationEntity } from './installed-integration.entity';
import { IntegrationMarketplaceResolver } from './integration-marketplace.resolver';
import { IntegrationMarketplaceService } from './integration-marketplace.service';
import { IntegrationTriggerListener } from './integration-trigger.listener';
import { SlackNotificationService } from './slack-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([InstalledIntegrationEntity])],
  providers: [
    IntegrationMarketplaceService,
    IntegrationMarketplaceResolver,
    SlackNotificationService,
    IntegrationTriggerListener,
  ],
  exports: [IntegrationMarketplaceService],
})
export class IntegrationMarketplaceModule {}
