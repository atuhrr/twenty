// FORK: Voka CRM — Fase 15
import { useMutation, useQuery } from '@apollo/client/react';
import { v4 as uuidv4 } from 'uuid';

import {
  CREATE_WEB_FORM,
  DELETE_WEB_FORM,
  GET_WEB_FORMS,
  UPDATE_WEB_FORM,
} from '@/web-form/graphql/webFormQueries';

export type WebFormFieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea';

export type WebFormField = {
  id: string;
  type: WebFormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type WebForm = {
  id: string;
  name: string;
  fields: WebFormField[];
  funnelId: string | null;
  publicToken: string;
  enabled: boolean;
  createdAt: string;
};

export const newField = (type: WebFormFieldType = 'text'): WebFormField => ({
  id: uuidv4(),
  type,
  label: '',
  required: false,
});

export const useWebForms = () => {
  const { data, loading, refetch } = useQuery<{ webForms: WebForm[] }>(
    GET_WEB_FORMS,
    { fetchPolicy: 'cache-and-network' },
  );

  return { forms: data?.webForms ?? [], loading, refetch };
};

export const useCreateWebForm = () => {
  const [create, { loading }] = useMutation(CREATE_WEB_FORM, {
    refetchQueries: [{ query: GET_WEB_FORMS }],
  });

  return { create, loading };
};

export const useUpdateWebForm = () => {
  const [update, { loading }] = useMutation(UPDATE_WEB_FORM, {
    refetchQueries: [{ query: GET_WEB_FORMS }],
  });

  return { update, loading };
};

export const useDeleteWebForm = () => {
  const [remove] = useMutation(DELETE_WEB_FORM, {
    refetchQueries: [{ query: GET_WEB_FORMS }],
  });

  return { remove };
};
