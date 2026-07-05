// FORK: Voka CRM — Fase 19: Canais conectados (centro de administração)
import type { ComponentType } from 'react';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  IconAt,
  IconChevronRight,
  IconMessage,
  IconPhone,
  IconSend,
} from 'twenty-ui/icon';

type Channel = {
  id: string;
  icon: ComponentType<{ size?: number }>;
  name: string;
  description: string;
  settingsPath?: string;
  status: 'configured' | 'available';
  badge?: string;
};

const CHANNELS: Channel[] = [
  {
    id: 'whatsapp',
    icon: IconMessage,
    name: 'WhatsApp Business',
    description: 'Envie e receba mensagens via Meta Cloud API.',
    settingsPath: getSettingsPath(SettingsPath.Whatsapp),
    status: 'configured',
    badge: 'Ativo',
  },
  {
    id: 'email',
    icon: IconAt,
    name: 'E-mail',
    description: 'Conecte contas IMAP/SMTP para envio e recepção de e-mails.',
    settingsPath: getSettingsPath(SettingsPath.AccountsEmails),
    status: 'configured',
  },
  {
    id: 'instagram',
    icon: IconPhone,
    name: 'Instagram Direct',
    description: 'Responda mensagens diretas do Instagram (requer Facebook Business).',
    status: 'available',
    badge: 'Em breve',
  },
  {
    id: 'telegram',
    icon: IconSend,
    name: 'Telegram',
    description: 'Conecte um bot do Telegram para atendimento.',
    status: 'available',
    badge: 'Em breve',
  },
];

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
`;

const StyledCard = styled.button<{ clickable: boolean }>`
  align-items: center;
  background: #fff;
  border: 1px solid #EAECF0;
  border-radius: 10px;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${({ clickable }) => (clickable ? '#F9FAFB' : '#fff')};
  }
`;

const StyledIconWrap = styled.div`
  align-items: center;
  background: #F2F4F7;
  border-radius: 8px;
  display: flex;
  flex-shrink: 0;
  height: 40px;
  justify-content: center;
  width: 40px;
`;

const StyledInfo = styled.div`
  flex: 1;
`;

const StyledName = styled.div`
  align-items: center;
  color: #101828;
  display: flex;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  margin-bottom: 2px;
`;

const StyledBadge = styled.span<{ active: boolean }>`
  background: ${({ active }) => (active ? '#ECFDF3' : '#F2F4F7')};
  border-radius: 999px;
  color: ${({ active }) => (active ? '#12B76A' : '#667085')};
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
`;

const StyledDesc = styled.div`
  color: #667085;
  font-size: 13px;
`;

export const SettingsCanaisConectados = () => {
  const navigate = useNavigate();

  return (
    <SettingsPageLayout
      links={[
        { children: t`Configurações`, href: '/settings' },
        { children: t`Canais conectados` },
      ]}
    >
      <SettingsPageContainer>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#101828', marginBottom: 4 }}>
            Canais conectados
          </div>
          <div style={{ fontSize: 14, color: '#667085' }}>
            Gerencie todos os canais de comunicação do seu CRM.
          </div>
        </div>

        <StyledList>
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            const clickable = !!ch.settingsPath;

            return (
              <StyledCard
                key={ch.id}
                clickable={clickable}
                onClick={() => ch.settingsPath && navigate(ch.settingsPath)}
              >
                <StyledIconWrap>
                  <Icon size={20} />
                </StyledIconWrap>
                <StyledInfo>
                  <StyledName>
                    {ch.name}
                    {ch.badge && <StyledBadge active={ch.status === 'configured'}>{ch.badge}</StyledBadge>}
                  </StyledName>
                  <StyledDesc>{ch.description}</StyledDesc>
                </StyledInfo>
                {clickable && <IconChevronRight size={16} color="#D0D5DD" />}
              </StyledCard>
            );
          })}
        </StyledList>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
