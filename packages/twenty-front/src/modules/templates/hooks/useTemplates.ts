// FORK: Voka CRM — B2.1
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_TEMPLATE,
  DELETE_TEMPLATE,
  GET_TEMPLATES,
  UPDATE_TEMPLATE,
} from '@/templates/graphql/templateQueries';

export type TemplateTipo = 'whatsapp_hsm' | 'geral' | 'email';

export type CRMTemplate = {
  id: string;
  workspaceId: string;
  nome: string;
  tipo: TemplateTipo;
  canal: string | null;
  assunto: string | null;
  corpo: string;
  variaveis: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export const useTemplates = () => {
  const { data, loading, refetch } = useQuery<{ templates: CRMTemplate[] }>(
    GET_TEMPLATES,
    { fetchPolicy: 'cache-and-network' },
  );

  return { templates: data?.templates ?? [], loading, refetch };
};

export const useCreateTemplate = () => {
  const [create, { loading }] = useMutation(CREATE_TEMPLATE, {
    refetchQueries: [{ query: GET_TEMPLATES }],
  });

  return { create, loading };
};

export const useUpdateTemplate = () => {
  const [update, { loading }] = useMutation(UPDATE_TEMPLATE, {
    refetchQueries: [{ query: GET_TEMPLATES }],
  });

  return { update, loading };
};

export const useDeleteTemplate = () => {
  const [remove] = useMutation(DELETE_TEMPLATE, {
    refetchQueries: [{ query: GET_TEMPLATES }],
  });

  return { remove };
};

export const CANAL_LABELS: Record<string, string> = {
  TODOS: 'Todos os canais',
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
  EMAIL: 'E-mail',
};

export const TIPO_LABELS: Record<TemplateTipo, string> = {
  whatsapp_hsm: 'WhatsApp HSM',
  geral: 'Geral',
  email: 'E-mail',
};

export const VARIAVEIS_DISPONIVEIS = [
  { token: '{{contact.name}}', label: 'Nome do contato' },
  { token: '{{contact.phone}}', label: 'Telefone do contato' },
  { token: '{{contact.email}}', label: 'E-mail do contato' },
  { token: '{{profile.name}}', label: 'Seu nome (usuário Zellate)' },
  { token: '{{profile.phone}}', label: 'Seu telefone' },
  { token: '{{workspace.name}}', label: 'Nome da empresa' },
  { token: '{{lead.title}}', label: 'Título do lead' },
  { token: '{{lead.stage}}', label: 'Etapa do lead' },
];
