// FORK: Voka CRM — Fase 13
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_AUTOMATION_RULE,
  DELETE_AUTOMATION_RULE,
  GET_AUTOMATION_EXECUTIONS,
  GET_AUTOMATION_RULES,
  UPDATE_AUTOMATION_RULE,
} from '@/automation/graphql/automationQueries';

export type AutomationCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'notContains' | 'exists';
  value: unknown;
};

export type AutomationAction = {
  type: 'CREATE_TASK' | 'SEND_TEMPLATE' | 'MOVE_STAGE' | 'ASSIGN_USER' | 'WEBHOOK';
  config: Record<string, unknown>;
};

export type AutomationRule = {
  id: string;
  workspaceId: string;
  name: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AutomationExecution = {
  id: string;
  ruleId: string;
  recordId: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error: string | null;
  executedAt: string;
};

export const useAutomationRules = () => {
  const { data, loading, refetch } = useQuery<{
    automationRules: AutomationRule[];
  }>(GET_AUTOMATION_RULES, { fetchPolicy: 'cache-and-network' });

  return { rules: data?.automationRules ?? [], loading, refetch };
};

export const useAutomationExecutions = (ruleId: string | null) => {
  const { data, loading } = useQuery<{
    automationExecutions: AutomationExecution[];
  }>(GET_AUTOMATION_EXECUTIONS, {
    variables: { ruleId },
    skip: !ruleId,
    fetchPolicy: 'cache-and-network',
  });

  return { executions: data?.automationExecutions ?? [], loading };
};

export const useCreateAutomationRule = () => {
  const [create, { loading }] = useMutation(CREATE_AUTOMATION_RULE, {
    refetchQueries: [{ query: GET_AUTOMATION_RULES }],
  });

  return { create, loading };
};

export const useUpdateAutomationRule = () => {
  const [update, { loading }] = useMutation(UPDATE_AUTOMATION_RULE, {
    refetchQueries: [{ query: GET_AUTOMATION_RULES }],
  });

  return { update, loading };
};

export const useDeleteAutomationRule = () => {
  const [remove] = useMutation(DELETE_AUTOMATION_RULE, {
    refetchQueries: [{ query: GET_AUTOMATION_RULES }],
  });

  return { remove };
};
