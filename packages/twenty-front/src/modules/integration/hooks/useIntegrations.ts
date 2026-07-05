// FORK: Voka CRM — Fase 16
import { useMutation, useQuery } from '@apollo/client/react';

import {
  GET_INSTALLED_INTEGRATIONS,
  GET_INTEGRATION_CATALOG,
  INSTALL_INTEGRATION,
  UNINSTALL_INTEGRATION,
  UPDATE_INSTALLED_INTEGRATION,
} from '@/integration/graphql/integrationQueries';

export type IntegrationConfigField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
};

export type IntegrationCatalogItem = {
  key: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string;
  configFields: IntegrationConfigField[];
  events: string[];
  docsUrl?: string;
};

export type InstalledIntegration = {
  id: string;
  integrationKey: string;
  config: Record<string, string>;
  enabled: boolean;
  createdAt: string;
};

export const useIntegrationCatalog = () => {
  const { data, loading } = useQuery<{
    integrationCatalog: IntegrationCatalogItem[];
  }>(GET_INTEGRATION_CATALOG, { fetchPolicy: 'cache-and-network' });

  return { catalog: data?.integrationCatalog ?? [], loading };
};

export const useInstalledIntegrations = () => {
  const { data, loading, refetch } = useQuery<{
    installedIntegrations: InstalledIntegration[];
  }>(GET_INSTALLED_INTEGRATIONS, { fetchPolicy: 'cache-and-network' });

  return { installed: data?.installedIntegrations ?? [], loading, refetch };
};

export const useInstallIntegration = () => {
  const [install, { loading }] = useMutation(INSTALL_INTEGRATION, {
    refetchQueries: [{ query: GET_INSTALLED_INTEGRATIONS }],
  });

  return { install, loading };
};

export const useUpdateInstalledIntegration = () => {
  const [update, { loading }] = useMutation(UPDATE_INSTALLED_INTEGRATION, {
    refetchQueries: [{ query: GET_INSTALLED_INTEGRATIONS }],
  });

  return { update, loading };
};

export const useUninstallIntegration = () => {
  const [uninstall] = useMutation(UNINSTALL_INTEGRATION, {
    refetchQueries: [{ query: GET_INSTALLED_INTEGRATIONS }],
  });

  return { uninstall };
};
