// FORK: Voka CRM — Fase 15
import { gql } from '@apollo/client';

export const GET_WEB_FORMS = gql`
  query GetWebForms {
    webForms {
      id
      name
      fields
      funnelId
      publicToken
      enabled
      createdAt
    }
  }
`;

export const CREATE_WEB_FORM = gql`
  mutation CreateWebForm($input: CreateWebFormInput!) {
    createWebForm(input: $input) {
      id
      name
      fields
      funnelId
      publicToken
      enabled
      createdAt
    }
  }
`;

export const UPDATE_WEB_FORM = gql`
  mutation UpdateWebForm($input: UpdateWebFormInput!) {
    updateWebForm(input: $input) {
      id
      name
      fields
      funnelId
      publicToken
      enabled
      createdAt
    }
  }
`;

export const DELETE_WEB_FORM = gql`
  mutation DeleteWebForm($id: String!) {
    deleteWebForm(id: $id)
  }
`;
