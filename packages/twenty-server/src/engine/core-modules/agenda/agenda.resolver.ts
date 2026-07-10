// FORK: Zellate — CRUD do calendário (agenda de eventos do workspace)
import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AgendaEventoEntity } from 'src/engine/core-modules/agenda/agenda-evento.entity';
import {
  AgendaEventoDTO,
  AtualizarAgendaEventoInput,
  CriarAgendaEventoInput,
} from 'src/engine/core-modules/agenda/dtos/agenda-evento.dto';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

const CORES_VALIDAS = new Set(['danger', 'success', 'primary', 'warning']);

// Agenda é acessível a qualquer membro do workspace (sem flag de permissão)
@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@Resolver()
@UsePipes(ResolverValidationPipe)
export class AgendaResolver {
  constructor(
    @InjectWorkspaceScopedRepository(AgendaEventoEntity)
    private readonly eventoRepo: WorkspaceScopedRepository<AgendaEventoEntity>,
  ) {}

  @Query(() => [AgendaEventoDTO])
  async agendaEventos(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<AgendaEventoDTO[]> {
    return this.eventoRepo.find(workspace.id, {
      order: { inicio: 'ASC' },
      take: 500,
    });
  }

  @Mutation(() => AgendaEventoDTO)
  async criarAgendaEvento(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CriarAgendaEventoInput,
  ): Promise<AgendaEventoDTO> {
    return this.eventoRepo.save(workspace.id, {
      titulo: input.titulo.trim(),
      cor: CORES_VALIDAS.has(input.cor ?? '') ? input.cor : 'primary',
      inicio: input.inicio,
      fim: input.fim,
      leadId: input.leadId ?? null,
    });
  }

  @Mutation(() => AgendaEventoDTO)
  async atualizarAgendaEvento(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: AtualizarAgendaEventoInput,
  ): Promise<AgendaEventoDTO> {
    await this.eventoRepo.update(
      workspace.id,
      { id: input.id },
      {
        ...(input.titulo !== undefined ? { titulo: input.titulo.trim() } : {}),
        ...(input.cor !== undefined && CORES_VALIDAS.has(input.cor)
          ? { cor: input.cor }
          : {}),
        ...(input.inicio !== undefined ? { inicio: input.inicio } : {}),
        ...(input.fim !== undefined ? { fim: input.fim } : {}),
        ...(input.leadId !== undefined ? { leadId: input.leadId } : {}),
      },
    );

    return this.eventoRepo.findOneOrFail(workspace.id, {
      where: { id: input.id },
    });
  }

  @Mutation(() => Boolean)
  async excluirAgendaEvento(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    await this.eventoRepo.delete(workspace.id, { id });

    return true;
  }
}
