import { styled } from '@linaria/react';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--t-spacing-4);
  justify-content: center;
  min-height: 400px;
  padding: var(--t-spacing-10);
`;

const StyledEmoji = styled.div`
  font-size: 3rem;
`;

const StyledTitle = styled.h2`
  color: var(--t-font-color-primary);
  font-family: var(--t-font-family);
  font-size: var(--t-font-size-xl);
  font-weight: var(--t-font-weight-semi-bold);
  margin: 0;
  text-align: center;
`;

const StyledDescription = styled.p`
  color: var(--t-font-color-secondary);
  font-family: var(--t-font-family);
  font-size: var(--t-font-size-md);
  margin: 0;
  text-align: center;
`;

type ComingSoonPageProps = {
  emoji?: string;
  title: string;
  description?: string;
};

export const ComingSoonPage = ({
  emoji = '🚧',
  title,
  description = 'Este módulo estará disponível em breve.',
}: ComingSoonPageProps) => (
  <StyledContainer>
    <StyledEmoji>{emoji}</StyledEmoji>
    <StyledTitle>{title}</StyledTitle>
    <StyledDescription>{description}</StyledDescription>
  </StyledContainer>
);
