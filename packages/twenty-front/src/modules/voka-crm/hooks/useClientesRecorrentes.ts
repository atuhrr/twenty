// FORK: Voka CRM — Fase 2: clientes recorrentes
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_CLIENTE_RECORRENTE,
  DELETE_CLIENTE_RECORRENTE,
  GET_CLIENTES_RECORRENTES,
  UPDATE_CLIENTE_RECORRENTE,
} from '../graphql/queries';

export type ClienteRecorrente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  periodicidade: string;
  valorRecorrente: number;
  proximoContato: string | null;
  responsavelId: string | null;
  tags: string[];
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const useClientesRecorrentes = () => {
  const { data, loading, refetch } = useQuery<{
    clientesRecorrentes: ClienteRecorrente[];
  }>(GET_CLIENTES_RECORRENTES, { fetchPolicy: 'cache-and-network' });

  const [createMut, { loading: creating }] = useMutation(
    CREATE_CLIENTE_RECORRENTE,
    { onCompleted: () => refetch() },
  );
  const [updateMut, { loading: updating }] = useMutation(
    UPDATE_CLIENTE_RECORRENTE,
    { onCompleted: () => refetch() },
  );
  const [deleteMut, { loading: deleting }] = useMutation(
    DELETE_CLIENTE_RECORRENTE,
    { onCompleted: () => refetch() },
  );

  return {
    clientes: data?.clientesRecorrentes ?? [],
    loading,
    creating,
    updating,
    deleting,
    create: (input: Omit<ClienteRecorrente, 'id' | 'createdAt' | 'updatedAt'>) =>
      createMut({ variables: { input } }),
    update: (input: { id: string } & Partial<ClienteRecorrente>) =>
      updateMut({ variables: { input } }),
    del: (id: string) => deleteMut({ variables: { id } }),
  };
};
