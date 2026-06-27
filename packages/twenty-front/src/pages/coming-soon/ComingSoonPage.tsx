import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: center;
  min-height: 400px;
  padding: ${themeCssVariables.spacing[10]};
`;

const StyledEmoji = styled.div`
  font-size: 3rem;
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
  text-align: center;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
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
