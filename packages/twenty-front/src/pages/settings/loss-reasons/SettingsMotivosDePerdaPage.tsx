// FORK: Voka CRM — Fase 18/19: Motivos de Perda
import { useEffect, useState } from 'react';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

type LossReason = {
  id: string;
  label: string;
  position: number;
  isDefault: boolean;
};

const StyledList = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StyledRow = styled.div`
  align-items: center;
  background: #fff;
  border: 1px solid #EAECF0;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
`;

const StyledHandle = styled.span`
  color: #D0D5DD;
  cursor: grab;
  font-size: 16px;
  user-select: none;
`;

const StyledLabel = styled.span`
  color: #101828;
  flex: 1;
  font-size: 14px;
`;

const StyledDefault = styled.span`
  background: #F2F4F7;
  border-radius: 999px;
  color: #667085;
  font-size: 11px;
  padding: 2px 8px;
`;

const StyledDeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: #F04438;
  cursor: pointer;
  padding: 2px;

  &:hover { opacity: 0.7; }
  &:disabled { color: #D0D5DD; cursor: not-allowed; }
`;

const StyledForm = styled.div`
  background: #F9FAFB;
  border: 1px solid #EAECF0;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
`;

const StyledInput = styled.input`
  border: 1px solid #D0D5DD;
  border-radius: 6px;
  color: #101828;
  flex: 1;
  font-size: 14px;
  padding: 8px 12px;

  &:focus { border-color: #7C3AED; outline: none; }
`;

const StyledEmpty = styled.div`
  color: #667085;
  font-size: 14px;
  padding: 32px 0;
  text-align: center;
`;

const useApi = () => {
  const getHeaders = () => {
    const raw = localStorage.getItem('tokenPair');
    const token = raw ? (JSON.parse(raw) as { accessToken?: { token?: string } })?.accessToken?.token ?? '' : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };
  const base = '/metadata/loss-reasons';

  return {
    fetchAll: () => fetch(base, { headers: getHeaders() }).then(r => r.json() as Promise<LossReason[]>),
    create: (label: string) =>
      fetch(base, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ label }) }).then(r => r.json() as Promise<LossReason>),
    remove: (id: string) => fetch(`${base}/${id}`, { method: 'DELETE', headers: getHeaders() }),
  };
};

export const SettingsMotivosDePerdaPage = () => {
  const [reasons, setReasons] = useState<LossReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const api = useApi();

  const load = async () => {
    setLoading(true);
    setReasons(await api.fetchAll());
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    await api.create(newLabel.trim());
    setNewLabel('');
    setShowForm(false);
    void load();
  };

  const handleDelete = async (id: string) => {
    await api.remove(id);
    void load();
  };

  return (
    <SettingsPageLayout
      links={[
        { children: t`Configurações`, href: '/settings' },
        { children: t`Motivos de perda` },
      ]}
    >
      <SettingsPageContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#101828', marginBottom: 4 }}>
              Motivos de Perda
            </div>
            <div style={{ fontSize: 14, color: '#667085' }}>
              Configure os motivos disponíveis ao marcar um lead como perdido.
            </div>
          </div>
          <Button
            title={t`Novo motivo`}
            Icon={IconPlus}
            size="small"
            variant="primary"
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {showForm && (
          <StyledForm>
            <StyledInput
              placeholder="Ex: Preço alto"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button title={t`Adicionar`} size="small" variant="primary" onClick={handleCreate} />
            <Button title={t`Cancelar`} size="small" variant="secondary" onClick={() => setShowForm(false)} />
          </StyledForm>
        )}

        {loading ? (
          <StyledEmpty>Carregando…</StyledEmpty>
        ) : reasons.length === 0 ? (
          <StyledEmpty>Nenhum motivo configurado.</StyledEmpty>
        ) : (
          <StyledList>
            {reasons.map(r => (
              <StyledRow key={r.id}>
                <StyledHandle>⠿</StyledHandle>
                <StyledLabel>{r.label}</StyledLabel>
                {r.isDefault && <StyledDefault>padrão</StyledDefault>}
                <StyledDeleteBtn
                  onClick={() => handleDelete(r.id)}
                  disabled={r.isDefault}
                  title={r.isDefault ? 'Motivos padrão não podem ser removidos' : 'Remover'}
                >
                  <IconTrash size={14} />
                </StyledDeleteBtn>
              </StyledRow>
            ))}
          </StyledList>
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
