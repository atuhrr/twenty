// FORK: Voka CRM — Fase 13
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappModule } from 'src/engine/core-modules/whatsapp/whatsapp.module';

import { AutomationExecutionEntity } from './automation-execution.entity';
import { AutomationRuleEntity } from './automation-rule.entity';
import { AutomationExecutorService } from './automation-executor.service';
import { AutomationService } from './automation.service';
import { AutomationResolver } from './automation.resolver';
import { AutomationTriggerListener } from './automation-trigger.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationRuleEntity, AutomationExecutionEntity]),
    WhatsappModule,
  ],
  providers: [
    AutomationService,
    AutomationExecutorService,
    AutomationResolver,
    AutomationTriggerListener,
  ],
  exports: [AutomationService],
})
export class AutomationModule {}
