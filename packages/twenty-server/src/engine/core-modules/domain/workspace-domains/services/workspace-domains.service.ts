import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { buildUrlWithPathnameAndSearchParams } from 'src/engine/core-modules/domain/domain-server-config/utils/build-url-with-pathname-and-search-params.util';
import { WorkspaceDomainConfig } from 'src/engine/core-modules/domain/workspace-domains/types/workspace-domain-config.type';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';

@Injectable()
export class WorkspaceDomainsService {
  constructor(
    private readonly domainServerConfigService: DomainServerConfigService,
    private readonly twentyConfigService: TwentyConfigService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    // Request routing resolves workspace via the public domain registry.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(PublicDomainEntity)
    private readonly publicDomainRepository: Repository<PublicDomainEntity>,
  ) {}

  buildWorkspaceURL({
    workspace,
    pathname,
    searchParams,
  }: {
    workspace: WorkspaceDomainConfig;
    pathname?: string;
    searchParams?: Record<string, string | number | boolean>;
  }) {
    const workspaceUrls = this.getWorkspaceUrls(workspace);

    const url = buildUrlWithPathnameAndSearchParams({
      baseUrl: new URL(workspaceUrls.customUrl ?? workspaceUrls.subdomainUrl),
      pathname,
      searchParams,
    });

    return url;
  }

  computeWorkspaceRedirectErrorUrl(
    errorMessage: string,
    workspace: WorkspaceDomainConfig,
    pathname: string,
  ) {
    const url = this.buildWorkspaceURL({
      workspace,
      pathname,
      searchParams: { errorMessage },
    });

    return url.toString();
  }

  private async getDefaultWorkspace() {
    if (this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED')) {
      throw new Error(
        'Default workspace does not exist when multi-workspace is enabled',
      );
    }

    const workspaces = await this.workspaceRepository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['workspaceSSOIdentityProviders'],
    });

    if (workspaces.length > 1) {
      Logger.warn(
        `${workspaces.length} workspaces found in database. In single-workspace mode, there should be only one workspace. The Apple seed workspace will be used as fallback if present.`,
      );
    }

    const foundWorkspace =
      workspaces.find(
        (workspace) => workspace.id === SEED_APPLE_WORKSPACE_ID,
      ) ?? workspaces[0];

    assertIsDefinedOrThrow(foundWorkspace, WorkspaceNotFoundDefaultError);

    return foundWorkspace;
  }

  async getWorkspaceByOriginOrDefaultWorkspace(origin: string) {
    const { workspace } = await this.resolveWorkspaceAndPublicDomain(origin);

    return workspace;
  }

  // In single-domain mode the origin no longer identifies a workspace (all
  // workspaces share the front domain). The login token is a signed JWT scoped
  // to a workspace, so it is the authoritative source: resolve directly by its
  // workspaceId. Falls back to origin resolution in the standard subdomain mode.
  async getWorkspaceForLoginToken(origin: string, tokenWorkspaceId: string) {
    if (this.isMultiWorkspaceSingleDomainEnabled()) {
      return (
        (await this.workspaceRepository.findOne({
          where: { id: tokenWorkspaceId },
          relations: ['workspaceSSOIdentityProviders'],
        })) ?? undefined
      );
    }

    return this.getWorkspaceByOriginOrDefaultWorkspace(origin);
  }

  async resolveWorkspaceAndPublicDomain(origin: string): Promise<{
    workspace: WorkspaceEntity | undefined;
    publicDomain: PublicDomainEntity | null;
  }> {
    const { subdomain, domain } =
      this.domainServerConfigService.getSubdomainAndDomainFromUrl(origin);

    if (!this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED')) {
      // Single-workspace: workspace is always the default. Still resolve a
      // matching public domain so the route trigger can scope by application.
      const publicDomain = isDefined(domain)
        ? await this.publicDomainRepository.findOne({ where: { domain } })
        : null;

      return {
        workspace: await this.getDefaultWorkspace(),
        publicDomain: publicDomain ?? null,
      };
    }

    if (!domain && !subdomain) {
      return { workspace: undefined, publicDomain: null };
    }

    const where = isDefined(domain) ? { customDomain: domain } : { subdomain };

    const workspaceFromCustomDomainOrSubdomain =
      (await this.workspaceRepository.findOne({
        where,
        relations: ['workspaceSSOIdentityProviders'],
      })) ?? undefined;

    if (isDefined(workspaceFromCustomDomainOrSubdomain) || !isDefined(domain)) {
      return {
        workspace: workspaceFromCustomDomainOrSubdomain,
        publicDomain: null,
      };
    }

    const publicDomain = await this.publicDomainRepository.findOne({
      where: { domain },
      relations: ['workspace', 'workspace.workspaceSSOIdentityProviders'],
    });

    return {
      workspace: publicDomain?.workspace ?? undefined,
      publicDomain: publicDomain ?? null,
    };
  }

  private getCustomWorkspaceUrl(customDomain: string) {
    const url = this.domainServerConfigService.getFrontUrl();

    url.hostname = customDomain;

    return url.toString();
  }

  isMultiWorkspaceSingleDomainEnabled() {
    return (
      this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED') &&
      this.twentyConfigService.get('IS_MULTIWORKSPACE_SINGLE_DOMAIN_ENABLED')
    );
  }

  private getTwentyWorkspaceUrl(subdomain: string) {
    const url = this.domainServerConfigService.getFrontUrl();

    // In single-domain mode every workspace lives on the front domain; the
    // workspace is scoped by the authenticated token, not by the hostname.
    url.hostname =
      this.twentyConfigService.get('IS_MULTIWORKSPACE_ENABLED') &&
      !this.isMultiWorkspaceSingleDomainEnabled()
        ? `${subdomain}.${url.hostname}`
        : url.hostname;

    return url.toString();
  }

  getSubdomainAndCustomDomainFromWorkspaceFallbackOnDefaultSubdomain(
    workspace?: WorkspaceDomainConfig | null,
  ) {
    if (!workspace) {
      return {
        subdomain: this.twentyConfigService.get('DEFAULT_SUBDOMAIN'),
        customDomain: null,
        isCustomDomainEnabled: false,
      };
    }

    if (!workspace.isCustomDomainEnabled) {
      return {
        subdomain: workspace.subdomain,
        customDomain: null,
        isCustomDomainEnabled: false,
      };
    }

    return workspace;
  }

  getWorkspaceUrls({
    subdomain,
    customDomain,
    isCustomDomainEnabled,
  }: WorkspaceDomainConfig) {
    return {
      customUrl:
        isCustomDomainEnabled && customDomain
          ? this.getCustomWorkspaceUrl(customDomain)
          : undefined,
      subdomainUrl: this.getTwentyWorkspaceUrl(subdomain),
    };
  }

  async findByCustomDomain(customDomain: string) {
    return this.workspaceRepository.findOne({ where: { customDomain } });
  }
}
