import { styled } from '@linaria/react';
import { IconChevronLeft } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';

const StyledContainer = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--t-border-color-light);
  display: flex;
  gap: var(--t-spacing-1);
  height: 40px;
  padding: 0 var(--t-spacing-2);
`;

const StyledText = styled.span`
  color: var(--t-font-color-tertiary);
  font-size: var(--t-font-size-md);
  font-weight: var(--t-font-weight-medium);
`;

type SidePanelSubPageNavigationHeaderProps = {
  title: string;
  onBackClick: () => void;
};

export const SidePanelSubPageNavigationHeader = ({
  onBackClick,
  title,
}: SidePanelSubPageNavigationHeaderProps) => {
  return (
    <StyledContainer>
      <IconButton
        onClick={onBackClick}
        Icon={IconChevronLeft}
        variant="tertiary"
        size="small"
        ariaLabel="Go back"
      />
      <StyledText>{title}</StyledText>
    </StyledContainer>
  );
};
