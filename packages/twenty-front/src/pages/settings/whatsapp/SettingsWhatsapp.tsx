import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useConnectWhatsapp } from '@/settings/whatsapp/hooks/useConnectWhatsapp';
import { useWhatsappConnectionStatus } from '@/settings/whatsapp/hooks/useWhatsappConnectionStatus';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type FormEvent, useState } from 'react';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/input';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// FORK: WA brand colors — no equivalent in twenty-ui theme
// oxlint-disable-next-line twenty/no-hardcoded-colors
const WA_GREEN = '#25d366' as const;
// oxlint-disable-next-line twenty/no-hardcoded-colors
const WA_GREEN_DARK = '#1daa52' as const;
// oxlint-disable-next-line twenty/no-hardcoded-colors
const WA_SUCCESS_BG = '#e2f6e8' as const;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStatusBanner = styled.div<{ connected: boolean }>`
  align-items: center;
  background: ${({ connected }) =>
    connected ? WA_SUCCESS_BG : themeCssVariables.background.tertiary};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: 14px 16px;
`;

const StyledStatusRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledDot = styled.span<{ connected: boolean }>`
  background: ${({ connected }) =>
    connected ? WA_GREEN : themeCssVariables.font.color.tertiary};
  border-radius: 50%;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
`;

const StyledStatusLabel = styled.span<{ connected: boolean }>`
  color: ${({ connected }) =>
    connected ? WA_GREEN_DARK : themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledPhoneNumber = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledWebhookBox = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: 12px 14px;
`;

const StyledWebhookLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-transform: uppercase;
`;

const StyledWebhookUrl = styled.code`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  word-break: break-all;
`;

const StyledSubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const SettingsWhatsapp = () => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();

  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { status, displayPhoneNumber } = useWhatsappConnectionStatus();
  const { connectWhatsapp, loading } = useConnectWhatsapp();

  const [formValues, setFormValues] = useState({
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    appSecret: '',
    displayPhoneNumber: '',
  });

  const isConnected = status === 'CONNECTED';

  const webhookUrl = currentWorkspace?.id
    ? `${REACT_APP_SERVER_BASE_URL}/whatsapp/webhook/${currentWorkspace.id}`
    : `${REACT_APP_SERVER_BASE_URL}/whatsapp/webhook/<workspace-id>`;

  const handleChange = (field: keyof typeof formValues) => (text: string) => {
    setFormValues((prev) => ({ ...prev, [field]: text }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const {
      wabaId,
      phoneNumberId,
      accessToken,
      appSecret,
      displayPhoneNumber: phone,
    } = formValues;

    if (!wabaId || !phoneNumberId || !accessToken || !appSecret) {
      enqueueErrorSnackBar({
        message: t`Preencha WABA ID, Phone Number ID, Access Token e App Secret.`,
      });
      return;
    }

    try {
      const result = await connectWhatsapp({
        wabaId,
        phoneNumberId,
        accessToken,
        appSecret,
        ...(phone ? { displayPhoneNumber: phone } : {}),
      });

      if (result?.status === 'CONNECTED') {
        enqueueSuccessSnackBar({
          message: t`WhatsApp conectado com sucesso.`,
        });
        setFormValues({
          wabaId: '',
          phoneNumberId: '',
          accessToken: '',
          appSecret: '',
          displayPhoneNumber: '',
        });
      } else {
        enqueueErrorSnackBar({
          message: t`Verifique as credenciais e tente novamente.`,
        });
      }
    } catch {
      enqueueErrorSnackBar({
        message: t`Não foi possível salvar as credenciais.`,
      });
    }
  };

  return (
    <SettingsPageLayout
      title={t`WhatsApp Business`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: t`WhatsApp` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={t`Status da conexão`}
            description={t`Estado atual do WhatsApp Business para este workspace.`}
          />
          <StyledStatusBanner connected={isConnected}>
            <StyledStatusRow>
              <StyledDot connected={isConnected} />
              <StyledStatusLabel connected={isConnected}>
                {isConnected ? t`Conectado` : t`Desconectado`}
              </StyledStatusLabel>
            </StyledStatusRow>
            {isConnected && displayPhoneNumber && (
              <StyledStatusRow>
                <StyledPhoneNumber>{displayPhoneNumber}</StyledPhoneNumber>
              </StyledStatusRow>
            )}
          </StyledStatusBanner>
        </Section>

        <Section>
          <H2Title
            title={t`URL do Webhook`}
            description={t`Configure esta URL no Meta Business Manager como endpoint de webhook.`}
          />
          <StyledWebhookBox>
            <StyledWebhookLabel>{t`Endpoint`}</StyledWebhookLabel>
            <StyledWebhookUrl>{webhookUrl}</StyledWebhookUrl>
          </StyledWebhookBox>
        </Section>

        <Section>
          <H2Title
            title={t`Credenciais Meta Cloud API`}
            description={t`Cole as credenciais do Meta Business Manager. Sem QR Code — a conexão é feita via API oficial.`}
          />
          <StyledForm onSubmit={handleSubmit}>
            <StyledFieldGroup>
              <SettingsTextInput
                instanceId="whatsapp-waba-id"
                label={t`WABA ID`}
                placeholder="123456789012345"
                value={formValues.wabaId}
                onChange={handleChange('wabaId')}
                required
              />
            </StyledFieldGroup>

            <StyledFieldGroup>
              <SettingsTextInput
                instanceId="whatsapp-phone-number-id"
                label={t`Phone Number ID`}
                placeholder="987654321098765"
                value={formValues.phoneNumberId}
                onChange={handleChange('phoneNumberId')}
                required
              />
            </StyledFieldGroup>

            <StyledFieldGroup>
              <SettingsTextInput
                instanceId="whatsapp-display-phone"
                label={t`Número exibido (opcional)`}
                placeholder="+55 11 99999-9999"
                value={formValues.displayPhoneNumber}
                onChange={handleChange('displayPhoneNumber')}
              />
            </StyledFieldGroup>

            <StyledFieldGroup>
              <SettingsTextInput
                instanceId="whatsapp-access-token"
                label={t`Access Token permanente`}
                placeholder="EAAxxxxx..."
                type="password"
                value={formValues.accessToken}
                onChange={handleChange('accessToken')}
                required
              />
            </StyledFieldGroup>

            <StyledFieldGroup>
              <SettingsTextInput
                instanceId="whatsapp-app-secret"
                label={t`App Secret`}
                placeholder="abcdef1234567890..."
                type="password"
                value={formValues.appSecret}
                onChange={handleChange('appSecret')}
                required
              />
            </StyledFieldGroup>

            <StyledSubmitRow>
              <Button
                title={isConnected ? t`Atualizar credenciais` : t`Conectar`}
                variant="primary"
                accent="blue"
                type="submit"
                disabled={loading}
              />
            </StyledSubmitRow>
          </StyledForm>
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
