// FORK: Voka CRM — Fase 2
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClienteRecorrenteEntity } from './entities/cliente-recorrente.entity';
import { MotivoPerdaEntity } from './entities/motivo-perda.entity';
import { ProdutoEntity } from './entities/produto.entity';
import { VokaNotificationEntity } from './entities/voka-notification.entity';
import { VokaCrmResolver } from './voka-crm.resolver';
import { VokaCrmService } from './voka-crm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        MotivoPerdaEntity,
        ProdutoEntity,
        ClienteRecorrenteEntity,
        VokaNotificationEntity,
      ],
    ),
  ],
  providers: [VokaCrmService, VokaCrmResolver],
  exports: [VokaCrmService],
})
export class VokaCrmModule {}
