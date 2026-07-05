// FORK: Voka CRM — Fase 14
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { SalesbotDTO } from 'src/engine/core-modules/salesbot/dtos/salesbot.dto';
import {
  CreateSalesbotInput,
  UpdateSalesbotInput,
} from 'src/engine/core-modules/salesbot/dtos/salesbot.input';
import { SalesbotService } from 'src/engine/core-modules/salesbot/salesbot.service';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class SalesbotResolver {
  constructor(private readonly salesbotService: SalesbotService) {}

  @Query(() => SalesbotDTO, { nullable: true })
  async salesbot(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<SalesbotDTO | null> {
    const bot = await this.salesbotService.findById(id, workspace.id);

    if (!bot) return null;

    return {
      ...bot,
      createdAt: bot.createdAt.toISOString(),
      updatedAt: bot.updatedAt.toISOString(),
    };
  }

  @Query(() => [SalesbotDTO])
  async salesbots(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SalesbotDTO[]> {
    const bots = await this.salesbotService.list(workspace.id);

    return bots.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));
  }

  @Mutation(() => SalesbotDTO)
  async createSalesbot(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: CreateSalesbotInput,
  ): Promise<SalesbotDTO> {
    const bot = await this.salesbotService.create(workspace.id, input);

    return {
      ...bot,
      createdAt: bot.createdAt.toISOString(),
      updatedAt: bot.updatedAt.toISOString(),
    };
  }

  @Mutation(() => SalesbotDTO)
  async updateSalesbot(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateSalesbotInput,
  ): Promise<SalesbotDTO> {
    const bot = await this.salesbotService.update(workspace.id, input);

    return {
      ...bot,
      createdAt: bot.createdAt.toISOString(),
      updatedAt: bot.updatedAt.toISOString(),
    };
  }

  @Mutation(() => Boolean)
  async deleteSalesbot(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.salesbotService.remove(workspace.id, id);
  }
}
