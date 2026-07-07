import { IconLock } from 'twenty-ui/icon';
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';

const StyledPillContainer = styled.span`
  align-items: center;
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 40px;
  color: var(--t-font-color-tertiary);
  display: inline-flex;
  font-weight: var(--t-font-weight-medium);
  gap: var(--t-spacing-1);
  padding: var(--t-spacing-1) var(--t-spacing-2);
`;

export const OrganizationAdornment = () => (
  <StyledPillContainer>
    <IconLock size={12} />
    {t`Organization`}
  </StyledPillContainer>
);
