import { useWhatsappConnectionStatus } from '@/settings/whatsapp/hooks/useWhatsappConnectionStatus';
import { styled } from '@linaria/react';
import { IconBrandWhatsapp } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// DESIGN_SPEC §2: footer badge — sidebar-bg-2, radius 10px, WA green/grey dot
// oxlint-disable-next-line twenty/no-hardcoded-colors
const SIDEBAR_BG_2 = '#1e1e36' as const;
// oxlint-disable-next-line twenty/no-hardcoded-colors
const WA_GREEN = '#25d366' as const;

const StyledCard = styled.div`
  background: ${SIDEBAR_BG_2};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]};
  padding: 10px 12px;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.inverted};
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1.3;
`;

const StyledStatusRow = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
  padding-left: 28px;
`;

const StyledDot = styled.span<{ connected: boolean }>`
  background: ${({ connected }) =>
    connected ? WA_GREEN : themeCssVariables.font.color.tertiary};
  border-radius: 50%;
  flex-shrink: 0;
  height: 7px;
  width: 7px;
`;

const StyledStatusText = styled.span<{ connected: boolean }>`
  color: ${({ connected }) =>
    connected ? WA_GREEN : themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const WhatsappSidebarBadge = () => {
  const { status, displayPhoneNumber, loading } = useWhatsappConnectionStatus();

  if (loading) {
    return null;
  }

  const isConnected = status === 'CONNECTED';

  return (
    <StyledCard>
      <StyledHeader>
        <IconBrandWhatsapp
          size={18}
          color={WA_GREEN}
          aria-hidden={true}
          strokeWidth={1.8}
        />
        <StyledLabel>Conectado com WhatsApp Business</StyledLabel>
      </StyledHeader>
      <StyledStatusRow>
        <StyledDot connected={isConnected} />
        <StyledStatusText connected={isConnected}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </StyledStatusText>
      </StyledStatusRow>
    </StyledCard>
  );
};
