// FORK: Voka CRM — Fase 21: etapa de onboarding "Conectar WhatsApp"
import { type FormEvent, useCallback, useState } from 'react';

import { styled } from '@linaria/react';

import { SubTitle } from '@/auth/components/SubTitle';
import { Title } from '@/auth/components/Title';
import { useSetNextOnboardingStatus } from '@/onboarding/hooks/useSetNextOnboardingStatus';
import { useConnectWhatsapp } from '@/settings/whatsapp/hooks/useConnectWhatsapp';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { MainButton } from 'twenty-ui/input';
import { ModalContent } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// ── Styles ─────────────────────────────────────────────────────────────────────

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  margin-top: ${themeCssVariables.spacing[6]};
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--t-text-primary, #344054);
`;

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--t-border-color-medium, #d0d5dd);
  border-radius: 8px;
  font-size: 14px;
  color: var(--t-text-primary, #101828);
  background: var(--t-background-primary, #fff);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: var(--t-color-brand, #7c3aed);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
  &::placeholder {
    color: var(--t-text-tertiary, #98a2b3);
  }
`;

const StyledHint = styled.p`
  font-size: 12px;
  color: var(--t-text-secondary, #667085);
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledSkipBtn = styled.button`
  background: none;
  border: none;
  font-size: 13px;
  color: var(--t-text-secondary, #667085);
  cursor: pointer;
  padding: ${themeCssVariables.spacing[2]} 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover {
    color: var(--t-text-primary, #344054);
  }
`;

const StyledWaLogo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #25d366;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${themeCssVariables.spacing[4]};
  svg {
    width: 28px;
    height: 28px;
    fill: #fff;
  }
`;

// ── Component ──────────────────────────────────────────────────────────────────

export const ConnectWhatsApp = () => {
  const setNextOnboardingStatus = useSetNextOnboardingStatus();
  const { connectWhatsapp, loading } = useConnectWhatsapp();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');

  const isFormFilled =
    wabaId.trim() !== '' &&
    phoneNumberId.trim() !== '' &&
    accessToken.trim() !== '' &&
    appSecret.trim() !== '';

  const handleSkip = useCallback(() => {
    setNextOnboardingStatus();
  }, [setNextOnboardingStatus]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isFormFilled) return;

      try {
        const result = await connectWhatsapp({
          wabaId: wabaId.trim(),
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          appSecret: appSecret.trim(),
        });

        if (result?.status === 'CONNECTED') {
          enqueueSuccessSnackBar({
            message: `WhatsApp conectado: ${result.displayPhoneNumber ?? ''}`,
          });
        }
        setNextOnboardingStatus();
      } catch {
        enqueueErrorSnackBar({ message: 'Falha ao conectar o WhatsApp. Verifique as credenciais.' });
      }
    },
    [
      isFormFilled,
      wabaId,
      phoneNumberId,
      accessToken,
      appSecret,
      connectWhatsapp,
      setNextOnboardingStatus,
      enqueueSuccessSnackBar,
      enqueueErrorSnackBar,
    ],
  );

  return (
    <ModalContent isVerticallyCentered isHorizontallyCentered>
      <StyledWaLogo>
        {/* WhatsApp icon */}
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </StyledWaLogo>

      <Title noMarginTop>Conectar WhatsApp</Title>
      <SubTitle>
        Configure o canal WhatsApp Business para receber e enviar mensagens.
      </SubTitle>

      <StyledForm onSubmit={handleSubmit}>
        <StyledField>
          <StyledLabel htmlFor="waba-id">WABA ID (Business Account ID)</StyledLabel>
          <StyledInput
            id="waba-id"
            type="text"
            placeholder="123456789012345"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            autoFocus
          />
        </StyledField>

        <StyledField>
          <StyledLabel htmlFor="phone-id">ID do Número de Telefone</StyledLabel>
          <StyledInput
            id="phone-id"
            type="text"
            placeholder="987654321098765"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
          />
        </StyledField>

        <StyledField>
          <StyledLabel htmlFor="access-token">Token de Acesso Permanente</StyledLabel>
          <StyledInput
            id="access-token"
            type="password"
            placeholder="EAAxxxxx..."
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <StyledHint>
            Gere no Meta Business Manager → WhatsApp → Configuração da API.
          </StyledHint>
        </StyledField>

        <StyledField>
          <StyledLabel htmlFor="app-secret">App Secret</StyledLabel>
          <StyledInput
            id="app-secret"
            type="password"
            placeholder="abc123def456..."
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
          />
          <StyledHint>
            Encontrado em Meta for Developers → Seu App → Configurações → Básico.
          </StyledHint>
        </StyledField>

        <StyledActions>
          <MainButton
            title={loading ? 'Conectando…' : 'Conectar WhatsApp'}
            type="submit"
            disabled={!isFormFilled || loading}
            fullWidth
          />
          <StyledSkipBtn type="button" onClick={handleSkip}>
            Pular por enquanto — configurar depois em Configurações
          </StyledSkipBtn>
        </StyledActions>
      </StyledForm>
    </ModalContent>
  );
};
