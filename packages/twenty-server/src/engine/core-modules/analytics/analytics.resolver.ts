// FORK: Voka CRM — Fase 20.2: resolver GraphQL de analytics
import { UseGuards, UsePipes } from '@nestjs/common';
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';

import { AnalyticsService } from './analytics.service';
import { PeriodFilter } from './dtos/period-filter.input';
import { DashboardStatsDTO } from './dtos/dashboard-stats.dto';
import { GanhoPerdaStatsDTO } from './dtos/ganho-perda-stats.dto';
import { RelatorioConsolidadoDTO } from './dtos/relatorio-consolidado.dto';
import {
  RoiRelatorioDTO,
  CreateRoiRelatorioInput,
  UpdateRoiRelatorioInput,
} from './dtos/roi-relatorio.dto';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => DashboardStatsDTO)
  async dashboardStats(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('period', { type: () => PeriodFilter, defaultValue: PeriodFilter.MES })
    period: PeriodFilter,
  ): Promise<DashboardStatsDTO> {
    return this.analyticsService.getDashboardStats(workspace.id, period);
  }

  @Query(() => GanhoPerdaStatsDTO)
  async analiseGanhoPerda(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('period', { type: () => PeriodFilter, defaultValue: PeriodFilter.MES })
    period: PeriodFilter,
  ): Promise<GanhoPerdaStatsDTO> {
    return this.analyticsService.getAnaliseGanhoPerda(workspace.id, period);
  }

  @Query(() => RelatorioConsolidadoDTO)
  async relatorioConsolidado(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('period', { type: () => PeriodFilter, defaultValue: PeriodFilter.MES })
    period: PeriodFilter,
    @Args('granularidade', {
      type: () => String,
      defaultValue: 'DIA',
      nullable: true,
    })
    granularidade: 'DIA' | 'SEMANA' | 'MES',
  ): Promise<RelatorioConsolidadoDTO> {
    return this.analyticsService.getRelatorioConsolidado(
      workspace.id,
      period,
      granularidade,
    );
  }

  // ── ROI CRUD ────────────────────────────────────────────────────────────────

  @Query(() => [RoiRelatorioDTO])
  async roiRelatorios(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RoiRelatorioDTO[]> {
    return this.analyticsService.listRoiRelatorios(workspace.id);
  }

  @UseGuards(WorkspaceAuthGuard, UserAuthGuard)
  @Mutation(() => RoiRelatorioDTO)
  async createRoiRelatorio(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUser() user: UserEntity,
    @Args('input') input: CreateRoiRelatorioInput,
  ): Promise<RoiRelatorioDTO> {
    return this.analyticsService.createRoiRelatorio(
      workspace.id,
      user.id,
      input,
    );
  }

  @UseGuards(WorkspaceAuthGuard, UserAuthGuard)
  @Mutation(() => RoiRelatorioDTO)
  async updateRoiRelatorio(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateRoiRelatorioInput,
  ): Promise<RoiRelatorioDTO> {
    return this.analyticsService.updateRoiRelatorio(workspace.id, input);
  }

  @UseGuards(WorkspaceAuthGuard, UserAuthGuard)
  @Mutation(() => Boolean)
  async deleteRoiRelatorio(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.analyticsService.deleteRoiRelatorio(workspace.id, id);
  }

  @Query(() => String)
  async exportRoiCsv(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<string> {
    return this.analyticsService.exportRoiCsv(workspace.id);
  }
}
