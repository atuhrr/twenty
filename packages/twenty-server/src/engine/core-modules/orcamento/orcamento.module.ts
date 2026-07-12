// FORK: Zellate — F4: módulo do orçamento/proposta
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappContactWindowEntity } from 'src/engine/core-modules/whatsapp/whatsapp-contact-window.entity';
import { WhatsappModule } from 'src/engine/core-modules/whatsapp/whatsapp.module';
import { VokaCrmModule } from 'src/engine/core-modules/voka-crm/voka-crm.module';

import { OrcamentoController } from './orcamento.controller';
import { OrcamentoResolver } from './orcamento.resolver';
import { OrcamentoService } from './orcamento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappContactWindowEntity]),
    VokaCrmModule,
    WhatsappModule,
  ],
  controllers: [OrcamentoController],
  providers: [OrcamentoService, OrcamentoResolver],
})
export class OrcamentoModule {}
