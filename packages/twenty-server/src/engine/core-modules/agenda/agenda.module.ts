// FORK: Zellate — módulo do calendário (agenda de eventos)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgendaEventoEntity } from 'src/engine/core-modules/agenda/agenda-evento.entity';
import { AgendaResolver } from 'src/engine/core-modules/agenda/agenda.resolver';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaEventoEntity])],
  providers: [
    AgendaResolver,
    provideWorkspaceScopedRepository(AgendaEventoEntity),
  ],
})
export class AgendaModule {}
