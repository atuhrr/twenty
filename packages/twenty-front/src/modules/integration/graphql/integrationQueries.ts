// FORK: Voka CRM — Fase 16
import { gql } from '@apollo/client';

export const GET_INTEGRATION_CATALOG = gql`
  query GetIntegrationCatalog {
    integrationCatalog {
      key
      name
      description
      category
      logoUrl
      configFields
      events
      docsUrl
    }
  }
`;

export const GET_INSTALLED_INTEGRATIONS = gql`
  query GetInstalledIntegrations {
    installedIntegrations {
      id
      integrationKey
      config
      enabled
      createdAt
    }
  }
`;

export const INSTALL_INTEGRATION = gql`
  mutation InstallIntegration($input: InstallIntegrationInput!) {
    installIntegration(input: $input) {
      id
      integrationKey
      config
      enabled
      createdAt
    }
  }
`;

export const UPDATE_INSTALLED_INTEGRATION = gql`
  mutation UpdateInstalledIntegration($input: UpdateInstalledIntegrationInput!) {
    updateInstalledIntegration(input: $input) {
      id
      integrationKey
      config
      enabled
    }
  }
`;

export const UNINSTALL_INTEGRATION = gql`
  mutation UninstallIntegration($integrationKey: String!) {
    uninstallIntegration(integrationKey: $integrationKey)
  }
`;
