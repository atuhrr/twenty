// FORK: Voka CRM — Fase 2
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { VokaCrmService } from './voka-crm.service';
import {
  ClienteRecorrenteDTO,
  LeadProdutoDTO,
  MotivoPerdaDTO,
  ProdutoDTO,
  VokaNotificationDTO,
} from './dtos/voka-crm.dto';
import {
  AddLeadProdutoInput,
  CreateClienteRecorrenteInput,
  CreateMotivoPerdaInput,
  CreateProdutoInput,
  UpdateClienteRecorrenteInput,
  UpdateLeadProdutoInput,
  UpdateProdutoInput,
} from './dtos/voka-crm.input';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class VokaCrmResolver {
  constructor(private readonly service: VokaCrmService) {}

  // ── Motivo de Perda ────────────────────────────────────────────────────────

  @Query(() => [MotivoPerdaDTO])
  async motivosPerda(
    @AuthWorkspace() ws: WorkspaceEntity,
  ): Promise<MotivoPerdaDTO[]> {
    return this.service.listMotivoPerda(ws.id);
  }

  @Mutation(() => MotivoPerdaDTO)
  async createMotivoPerda(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: CreateMotivoPerdaInput,
  ): Promise<MotivoPerdaDTO> {
    return this.service.createMotivoPerda(ws.id, input);
  }

  @Mutation(() => Boolean)
  async deleteMotivoPerda(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.service.deleteMotivoPerda(ws.id, id);
  }

  // ── Produto / Catálogo ────────────────────────────────────────────────────

  @Query(() => [ProdutoDTO])
  async produtos(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('apenasAtivos', { type: () => Boolean, nullable: true, defaultValue: true })
    apenasAtivos: boolean,
  ): Promise<ProdutoDTO[]> {
    return this.service.listProdutos(ws.id, apenasAtivos);
  }

  @Mutation(() => ProdutoDTO)
  async createProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: CreateProdutoInput,
  ): Promise<ProdutoDTO> {
    return this.service.createProduto(ws.id, input);
  }

  @Mutation(() => ProdutoDTO)
  async updateProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: UpdateProdutoInput,
  ): Promise<ProdutoDTO> {
    return this.service.updateProduto(ws.id, input);
  }

  @Mutation(() => Boolean)
  async deleteProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.service.deleteProduto(ws.id, id);
  }

  // ── F3: Itens de negócio ──────────────────────────────────────────────────

  @Query(() => [LeadProdutoDTO])
  async leadProdutos(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('leadId') leadId: string,
  ): Promise<LeadProdutoDTO[]> {
    return this.service.listItensDoLead(ws.id, leadId);
  }

  @Mutation(() => [LeadProdutoDTO])
  async addLeadProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: AddLeadProdutoInput,
  ): Promise<LeadProdutoDTO[]> {
    return this.service.addLeadProduto(ws.id, input);
  }

  @Mutation(() => [LeadProdutoDTO])
  async updateLeadProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: UpdateLeadProdutoInput,
  ): Promise<LeadProdutoDTO[]> {
    return this.service.updateLeadProduto(ws.id, input);
  }

  @Mutation(() => [LeadProdutoDTO])
  async removeLeadProduto(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<LeadProdutoDTO[]> {
    return this.service.removeLeadProduto(ws.id, id);
  }

  // ── Cliente Recorrente ────────────────────────────────────────────────────

  @Query(() => [ClienteRecorrenteDTO])
  async clientesRecorrentes(
    @AuthWorkspace() ws: WorkspaceEntity,
  ): Promise<ClienteRecorrenteDTO[]> {
    return this.service.listClientes(ws.id);
  }

  @Mutation(() => ClienteRecorrenteDTO)
  async createClienteRecorrente(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: CreateClienteRecorrenteInput,
  ): Promise<ClienteRecorrenteDTO> {
    return this.service.createCliente(ws.id, input);
  }

  @Mutation(() => ClienteRecorrenteDTO)
  async updateClienteRecorrente(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('input') input: UpdateClienteRecorrenteInput,
  ): Promise<ClienteRecorrenteDTO> {
    return this.service.updateCliente(ws.id, input);
  }

  @Mutation(() => Boolean)
  async deleteClienteRecorrente(
    @AuthWorkspace() ws: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.service.deleteCliente(ws.id, id);
  }

  // ── Notificações ──────────────────────────────────────────────────────────

  @Query(() => [VokaNotificationDTO])
  async vokaNotifications(
    @AuthWorkspace() ws: WorkspaceEntity,
    @AuthUser() user: UserEntity,
    @Args('apenasNaoLidas', { type: () => Boolean, nullable: true, defaultValue: false })
    apenasNaoLidas: boolean,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ): Promise<VokaNotificationDTO[]> {
    return this.service.listNotifications(ws.id, user.id, apenasNaoLidas, limit);
  }

  @Query(() => Int)
  async vokaNotificationsUnreadCount(
    @AuthWorkspace() ws: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<number> {
    return this.service.countUnread(ws.id, user.id);
  }

  @Mutation(() => Boolean)
  async markAllVokaNotificationsAsRead(
    @AuthWorkspace() ws: WorkspaceEntity,
    @AuthUser() user: UserEntity,
  ): Promise<boolean> {
    return this.service.markAllAsRead(ws.id, user.id);
  }

  @Mutation(() => Boolean)
  async markVokaNotificationAsRead(
    @AuthWorkspace() ws: WorkspaceEntity,
    @AuthUser() user: UserEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.service.markAsRead(ws.id, user.id, id);
  }
}
