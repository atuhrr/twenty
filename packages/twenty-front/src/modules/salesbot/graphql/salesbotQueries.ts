// FORK: Voka CRM — Fase 14.1
import { gql } from '@apollo/client';

const SALESBOT_FRAGMENT = gql`
  fragment SalesbotFields on SalesbotDTO {
    id
    workspaceId
    name
    triggers
    graph
    enabled
    createdAt
    updatedAt
  }
`;

export const GET_SALESBOT = gql`
  ${SALESBOT_FRAGMENT}
  query GetSalesbot($id: String!) {
    salesbot(id: $id) {
      ...SalesbotFields
    }
  }
`;

export const GET_SALESBOTS = gql`
  ${SALESBOT_FRAGMENT}
  query GetSalesbots {
    salesbots {
      ...SalesbotFields
    }
  }
`;

export const CREATE_SALESBOT = gql`
  ${SALESBOT_FRAGMENT}
  mutation CreateSalesbot($input: CreateSalesbotInput!) {
    createSalesbot(input: $input) {
      ...SalesbotFields
    }
  }
`;

export const UPDATE_SALESBOT = gql`
  ${SALESBOT_FRAGMENT}
  mutation UpdateSalesbot($input: UpdateSalesbotInput!) {
    updateSalesbot(input: $input) {
      ...SalesbotFields
    }
  }
`;

export const DELETE_SALESBOT = gql`
  mutation DeleteSalesbot($id: String!) {
    deleteSalesbot(id: $id)
  }
`;
