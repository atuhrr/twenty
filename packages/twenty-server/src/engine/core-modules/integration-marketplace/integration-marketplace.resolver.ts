// FORK: Voka CRM — Fase 16
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

import { InstalledIntegrationDTO, IntegrationCatalogItemDTO } from './dtos/integration.dto';
import { InstallIntegrationInput, UpdateInstalledIntegrationInput } from './dtos/integration.input';
import { IntegrationMarketplaceService } from './integration-marketplace.service';

@Resolver()
@UseGuards(WorkspaceAuthGuard)
export class IntegrationMarketplaceResolver {
  constructor(
    private readonly integrationService: IntegrationMarketplaceService,
  ) {}

  @Query(() => [IntegrationCatalogItemDTO])
  integrationCatalog(): IntegrationCatalogItemDTO[] {
    return this.integrationService.getCatalog() as IntegrationCatalogItemDTO[];
  }

  @Query(() => [InstalledIntegrationDTO])
  async installedIntegrations(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<InstalledIntegrationDTO[]> {
    return this.integrationService.listInstalled(workspace.id);
  }

  @Mutation(() => InstalledIntegrationDTO)
  async installIntegration(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: InstallIntegrationInput,
  ): Promise<InstalledIntegrationDTO> {
    return this.integrationService.install(
      workspace.id,
      input.integrationKey,
      input.config ?? {},
    );
  }

  @Mutation(() => InstalledIntegrationDTO)
  async updateInstalledIntegration(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateInstalledIntegrationInput,
  ): Promise<InstalledIntegrationDTO> {
    return this.integrationService.update(
      workspace.id,
      input.integrationKey,
      input.config ?? {},
      input.enabled ?? true,
    );
  }

  @Mutation(() => Boolean)
  async uninstallIntegration(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('integrationKey') integrationKey: string,
  ): Promise<boolean> {
    return this.integrationService.uninstall(workspace.id, integrationKey);
  }
}
