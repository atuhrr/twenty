// FORK: Voka CRM — Fase 20.5: hook de relatórios ROI
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_ROI_RELATORIO,
  DELETE_ROI_RELATORIO,
  EXPORT_ROI_CSV,
  GET_ROI_RELATORIOS,
  UPDATE_ROI_RELATORIO,
} from '@/analytics/graphql/queries/roiRelatorio';

export type RoiRelatorio = {
  id: string;
  nome: string;
  investimento: number;
  totalLeads: number;
  leadsGanhos: number;
  leadsPerdidos: number;
  receita: number;
  roi: number | null;
  criadoEm: string;
};

export type CreateRoiInput = {
  nome: string;
  investimento: number;
  etapa?: string;
};

export type UpdateRoiInput = {
  id: string;
  nome?: string;
  investimento?: number;
};

export const useRoiRelatorios = () => {
  const { data, loading, refetch } = useQuery<{
    roiRelatorios: RoiRelatorio[];
  }>(GET_ROI_RELATORIOS, { fetchPolicy: 'cache-and-network' });

  return {
    relatorios: data?.roiRelatorios ?? [],
    loading,
    refetch,
  };
};

export const useCreateRoiRelatorio = () => {
  const [create, { loading }] = useMutation<
    { createRoiRelatorio: RoiRelatorio },
    { input: CreateRoiInput }
  >(CREATE_ROI_RELATORIO, {
    refetchQueries: [{ query: GET_ROI_RELATORIOS }],
  });

  return {
    create: (input: CreateRoiInput) => create({ variables: { input } }),
    loading,
  };
};

export const useUpdateRoiRelatorio = () => {
  const [update, { loading }] = useMutation<
    { updateRoiRelatorio: RoiRelatorio },
    { input: UpdateRoiInput }
  >(UPDATE_ROI_RELATORIO, {
    refetchQueries: [{ query: GET_ROI_RELATORIOS }],
  });

  return {
    update: (input: UpdateRoiInput) => update({ variables: { input } }),
    loading,
  };
};

export const useDeleteRoiRelatorio = () => {
  const [del] = useMutation<
    { deleteRoiRelatorio: boolean },
    { id: string }
  >(DELETE_ROI_RELATORIO, {
    refetchQueries: [{ query: GET_ROI_RELATORIOS }],
  });

  return { del: (id: string) => del({ variables: { id } }) };
};

export const useExportRoiCsv = () => {
  const [fetchCsv, { loading }] = useLazyQuery<{ exportRoiCsv: string }>(
    EXPORT_ROI_CSV,
  );

  const exportCsv = async () => {
    const result = await fetchCsv();
    const csv = result.data?.exportRoiCsv;
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `roi-relatorios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { exportCsv, loading };
};
