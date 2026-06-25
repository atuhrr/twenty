import { useState, useEffect } from 'react';

import { styled } from '@linaria/react';

import { useWhatsappConnectionStatus } from '@/settings/whatsapp/hooks/useWhatsappConnectionStatus';

// C: persistent top-of-screen banner when WhatsApp is disconnected
const StyledBanner = styled.div`
  align-items: center;
  background: #FEF2F2;
  border-bottom: 1px solid #FECACA;
  color: #DC2626;
  display: flex;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  gap: 12px;
  justify-content: center;
  padding: 8px 16px;
  position: relative;
  width: 100%;
`;

const StyledIcon = styled.span`
  font-size: 16px;
`;

const StyledDismiss = styled.button`
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  position: absolute;
  right: 16px;
`;

export const InformationBannerWhatsappDisconnected = () => {
  const { status, loading } = useWhatsappConnectionStatus();
  const isDisconnected = !loading && status !== 'CONNECTED';

  // reset dismiss whenever connection status flips so banner re-appears on next disconnect
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!isDisconnected) setDismissed(false);
  }, [isDisconnected]);

  if (!isDisconnected || dismissed) return null;

  return (
    <StyledBanner role="alert">
      <StyledIcon>⚠️</StyledIcon>
      WhatsApp desconectado — mensagens não serão enviadas ou recebidas.{' '}
      Reconecte em Configurações → WhatsApp.
      <StyledDismiss
        onClick={() => setDismissed(true)}
        aria-label="Fechar aviso"
      >
        ×
      </StyledDismiss>
    </StyledBanner>
  );
};
