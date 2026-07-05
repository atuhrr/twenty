// FORK: Voka CRM — Fase 20.5: queries e mutations de relatórios ROI
import { gql } from '@apollo/client';

const ROI_FIELDS = `
  id
  nome
  investimento
  totalLeads
  leadsGanhos
  leadsPerdidos
  receita
  roi
  criadoEm
`;

export const GET_ROI_RELATORIOS = gql`
  query GetRoiRelatorios {
    roiRelatorios {
      ${ROI_FIELDS}
    }
  }
`;

export const EXPORT_ROI_CSV = gql`
  query ExportRoiCsv {
    exportRoiCsv
  }
`;

export const CREATE_ROI_RELATORIO = gql`
  mutation CreateRoiRelatorio($input: CreateRoiRelatorioInput!) {
    createRoiRelatorio(input: $input) {
      ${ROI_FIELDS}
    }
  }
`;

export const UPDATE_ROI_RELATORIO = gql`
  mutation UpdateRoiRelatorio($input: UpdateRoiRelatorioInput!) {
    updateRoiRelatorio(input: $input) {
      ${ROI_FIELDS}
    }
  }
`;

export const DELETE_ROI_RELATORIO = gql`
  mutation DeleteRoiRelatorio($id: String!) {
    deleteRoiRelatorio(id: $id)
  }
`;
