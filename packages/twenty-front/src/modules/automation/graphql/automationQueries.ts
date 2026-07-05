// FORK: Voka CRM — Fase 13
import { gql } from '@apollo/client';

export const GET_AUTOMATION_RULES = gql`
  query GetAutomationRules {
    automationRules {
      id
      workspaceId
      name
      triggerType
      triggerConfig
      conditions
      actions
      enabled
      createdAt
      updatedAt
    }
  }
`;

export const GET_AUTOMATION_EXECUTIONS = gql`
  query GetAutomationExecutions($ruleId: String!) {
    automationExecutions(ruleId: $ruleId) {
      id
      ruleId
      recordId
      status
      error
      executedAt
    }
  }
`;

export const CREATE_AUTOMATION_RULE = gql`
  mutation CreateAutomationRule($input: CreateAutomationRuleInput!) {
    createAutomationRule(input: $input) {
      id
      name
      triggerType
      triggerConfig
      conditions
      actions
      enabled
      createdAt
    }
  }
`;

export const UPDATE_AUTOMATION_RULE = gql`
  mutation UpdateAutomationRule($input: UpdateAutomationRuleInput!) {
    updateAutomationRule(input: $input) {
      id
      name
      triggerType
      triggerConfig
      conditions
      actions
      enabled
      updatedAt
    }
  }
`;

export const DELETE_AUTOMATION_RULE = gql`
  mutation DeleteAutomationRule($id: String!) {
    deleteAutomationRule(id: $id)
  }
`;
