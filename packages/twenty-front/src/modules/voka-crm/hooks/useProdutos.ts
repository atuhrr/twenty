// FORK: Voka CRM — Fase 2: catálogo de produtos
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_PRODUTO,
  DELETE_PRODUTO,
  GET_PRODUTOS,
  UPDATE_PRODUTO,
} from '../graphql/queries';

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  unidade: string;
  sku: string | null;
  ativo: boolean;
  categoria: string | null;
  imagens: string[];
  createdAt: string;
};

export const useProdutos = (apenasAtivos = true) => {
  const { data, loading, refetch } = useQuery<{ produtos: Produto[] }>(
    GET_PRODUTOS,
    { variables: { apenasAtivos }, fetchPolicy: 'cache-and-network' },
  );

  const [createMut, { loading: creating }] = useMutation(CREATE_PRODUTO, {
    onCompleted: () => refetch(),
  });
  const [updateMut, { loading: updating }] = useMutation(UPDATE_PRODUTO, {
    onCompleted: () => refetch(),
  });
  const [deleteMut, { loading: deleting }] = useMutation(DELETE_PRODUTO, {
    onCompleted: () => refetch(),
  });

  return {
    produtos: data?.produtos ?? [],
    loading,
    creating,
    updating,
    deleting,
    create: (input: Omit<Produto, 'id' | 'ativo' | 'imagens' | 'createdAt'>) =>
      createMut({ variables: { input } }),
    update: (input: { id: string } & Partial<Produto>) =>
      updateMut({ variables: { input } }),
    del: (id: string) => deleteMut({ variables: { id } }),
  };
};
