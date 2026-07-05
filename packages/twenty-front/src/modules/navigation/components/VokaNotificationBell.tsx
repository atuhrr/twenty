// FORK: Voka CRM — Fase 1: central de notificações
import { useEffect, useRef, useState } from 'react';

import { styled } from '@linaria/react';
import { IconBell, IconCheck } from 'twenty-ui/icon';
import { useNavigate } from 'react-router-dom';

import { useVokaNotifications } from '@/voka-crm/hooks/useVokaNotifications';

// ─── Ícone de tipo de notificação ────────────────────────────────────────────

const TIPO_EMOJI: Record<string, string> = {
  TAREFA_VENCIDA:      '⏰',
  NOVA_MENSAGEM:       '💬',
  MENCAO:              '@',
  LEAD_GANHO:          '✅',
  LEAD_PERDIDO:        '❌',
  SISTEMA:             '🔔',
};

function tipoEmoji(tipo: string): string {
  return TIPO_EMOJI[tipo] ?? '🔔';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const VokaNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAllRead, markOneRead } =
    useVokaNotifications();

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleItemClick = async (id: string, link: string | null) => {
    await markOneRead(id);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <StyledWrapper ref={ref}>
      <StyledBellBtn
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        data-active={open ? 'true' : 'false'}
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <StyledBadge>{unreadCount > 99 ? '99+' : unreadCount}</StyledBadge>
        )}
      </StyledBellBtn>

      {open && (
        <StyledPanel>
          <StyledPanelHeader>
            <StyledPanelTitle>Notificações</StyledPanelTitle>
            {unreadCount > 0 && (
              <StyledMarkAllBtn
                onClick={() => { markAllRead(); }}
                title="Marcar todas como lidas"
              >
                <IconCheck size={13} />
                Marcar todas lidas
              </StyledMarkAllBtn>
            )}
          </StyledPanelHeader>

          <StyledList>
            {loading && notifications.length === 0 ? (
              <StyledEmpty>Carregando…</StyledEmpty>
            ) : notifications.length === 0 ? (
              <StyledEmpty>Nenhuma notificação</StyledEmpty>
            ) : (
              notifications.map((n) => (
                <StyledItem
                  key={n.id}
                  data-unread={!n.lida ? 'true' : 'false'}
                  onClick={() => handleItemClick(n.id, n.link)}
                >
                  <StyledItemEmoji>{tipoEmoji(n.tipo)}</StyledItemEmoji>
                  <StyledItemBody>
                    <StyledItemTitle>{n.titulo}</StyledItemTitle>
                    {n.corpo && <StyledItemCorpo>{n.corpo}</StyledItemCorpo>}
                  </StyledItemBody>
                  <StyledItemTime>{timeAgo(n.createdAt)}</StyledItemTime>
                </StyledItem>
              ))
            )}
          </StyledList>
        </StyledPanel>
      )}
    </StyledWrapper>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const StyledWrapper = styled.div`
  position: relative;
`;

const StyledBellBtn = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--t-font-color-secondary);
  cursor: pointer;
  display: flex;
  height: 32px;
  justify-content: center;
  position: relative;
  transition: background 100ms ease-out, color 100ms ease-out;
  width: 32px;

  &:hover,
  &[data-active='true'] {
    background: var(--t-background-transparent-light);
    color: var(--t-font-color-primary);
  }
`;

const StyledBadge = styled.span`
  background: #7c3aed;
  border: 2px solid var(--t-background-primary);
  border-radius: 999px;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  min-width: 14px;
  padding: 1px 3px;
  pointer-events: none;
  position: absolute;
  right: 2px;
  text-align: center;
  top: 2px;
`;

const StyledPanel = styled.div`
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 12px;
  bottom: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  left: calc(100% + 8px);
  overflow: hidden;
  position: absolute;
  top: 0;
  width: 320px;
  z-index: 300;
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--t-border-color-light);
  display: flex;
  gap: 8px;
  padding: 12px 14px;
`;

const StyledPanelTitle = styled.div`
  color: var(--t-font-color-primary);
  flex: 1;
  font-size: 13px;
  font-weight: 700;
`;

const StyledMarkAllBtn = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: var(--t-font-color-secondary);
  cursor: pointer;
  display: flex;
  font-size: 11px;
  gap: 3px;
  padding: 0;

  &:hover {
    color: var(--t-font-color-primary);
  }
`;

const StyledList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const StyledItem = styled.div`
  align-items: flex-start;
  border-bottom: 1px solid var(--t-border-color-light);
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  transition: background 100ms ease-out;

  &:last-child {
    border-bottom: none;
  }

  &[data-unread='true'] {
    background: var(--t-background-secondary);
  }

  &:hover {
    background: var(--t-background-tertiary);
  }
`;

const StyledItemEmoji = styled.span`
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1.3;
`;

const StyledItemBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledItemTitle = styled.div`
  color: var(--t-font-color-primary);
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemCorpo = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemTime = styled.div`
  color: var(--t-font-color-tertiary);
  flex-shrink: 0;
  font-size: 10px;
`;

const StyledEmpty = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 12px;
  padding: 32px;
  text-align: center;
`;
