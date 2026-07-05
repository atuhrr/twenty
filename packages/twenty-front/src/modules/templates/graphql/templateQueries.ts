// FORK: Voka CRM — B2.1
import { gql } from '@apollo/client';

const TEMPLATE_FRAGMENT = gql`
  fragment TemplateFields on TemplateDTO {
    id
    workspaceId
    nome
    tipo
    canal
    assunto
    corpo
    variaveis
    ativo
    criadoEm
    atualizadoEm
  }
`;

export const GET_TEMPLATES = gql`
  ${TEMPLATE_FRAGMENT}
  query GetTemplates {
    templates {
      ...TemplateFields
    }
  }
`;

export const CREATE_TEMPLATE = gql`
  ${TEMPLATE_FRAGMENT}
  mutation CreateTemplate($input: CreateTemplateInput!) {
    createTemplate(input: $input) {
      ...TemplateFields
    }
  }
`;

export const UPDATE_TEMPLATE = gql`
  ${TEMPLATE_FRAGMENT}
  mutation UpdateTemplate($input: UpdateTemplateInput!) {
    updateTemplate(input: $input) {
      ...TemplateFields
    }
  }
`;

export const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($id: String!) {
    deleteTemplate(id: $id)
  }
`;
