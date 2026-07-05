// FORK: Voka CRM — Fase 18: Equipes
import { useEffect, useState } from 'react';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { IconPlus, IconTrash, IconUsers } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

type Team = {
  id: string;
  name: string;
  description: string | null;
  memberIds: string[];
};

const StyledGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  margin-top: 24px;
`;

const StyledCard = styled.div`
  background: #fff;
  border: 1px solid #EAECF0;
  border-radius: 8px;
  padding: 16px 20px;
`;

const StyledCardTitle = styled.div`
  align-items: center;
  color: #101828;
  display: flex;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  margin-bottom: 6px;
`;

const StyledCardDesc = styled.div`
  color: #667085;
  font-size: 13px;
  margin-bottom: 12px;
  min-height: 20px;
`;

const StyledCardFooter = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
`;

const StyledMemberCount = styled.span`
  color: #667085;
  font-size: 12px;
`;

const StyledDeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: #F04438;
  cursor: pointer;
  padding: 2px;

  &:hover { opacity: 0.7; }
`;

const StyledForm = styled.div`
  background: #F9FAFB;
  border: 1px solid #EAECF0;
  border-radius: 8px;
  margin-top: 24px;
  padding: 20px;
`;

const StyledLabel = styled.label`
  color: #344054;
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const StyledInput = styled.input`
  border: 1px solid #D0D5DD;
  border-radius: 6px;
  color: #101828;
  font-size: 14px;
  margin-bottom: 12px;
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: #7C3AED; outline: none; }
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: #667085;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 12px;
  justify-content: center;
  padding: 48px 0;
`;

const useTeamsApi = () => {
  const baseUrl = `/metadata/teams`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('tokenPair') ? JSON.parse(localStorage.getItem('tokenPair') ?? '{}')?.accessToken?.token ?? '' : ''}`,
  });

  const fetchAll = async (): Promise<Team[]> => {
    const res = await fetch(baseUrl, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json() as Promise<Team[]>;
  };

  const create = async (name: string, description: string): Promise<Team> => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, memberIds: [] }),
    });
    return res.json() as Promise<Team>;
  };

  const remove = async (id: string): Promise<void> => {
    await fetch(`${baseUrl}/${id}`, { method: 'DELETE', headers: getHeaders() });
  };

  return { fetchAll, create, remove };
};

export const SettingsEquipes = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const api = useTeamsApi();

  const load = async () => {
    setLoading(true);
    setTeams(await api.fetchAll());
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await api.create(name.trim(), description.trim());
    setName('');
    setDescription('');
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
        { children: t`Equipes` },
      ]}
    >
      <SettingsPageContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#101828', marginBottom: 4 }}>
              Equipes
            </div>
            <div style={{ fontSize: 14, color: '#667085' }}>
              Organize membros em equipes e gerencie visibilidade de leads por equipe.
            </div>
          </div>
          <Button
            title={t`Nova equipe`}
            Icon={IconPlus}
            size="small"
            variant="primary"
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {showForm && (
          <StyledForm>
            <StyledLabel>Nome da equipe *</StyledLabel>
            <StyledInput
              placeholder="Ex: Vendas Sul"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <StyledLabel>Descrição</StyledLabel>
            <StyledInput
              placeholder="Opcional"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button title={t`Criar`} size="small" variant="primary" onClick={handleCreate} />
              <Button title={t`Cancelar`} size="small" variant="secondary" onClick={() => setShowForm(false)} />
            </div>
          </StyledForm>
        )}

        {loading ? (
          <StyledEmpty>Carregando…</StyledEmpty>
        ) : teams.length === 0 ? (
          <StyledEmpty>
            <IconUsers size={40} />
            Nenhuma equipe criada ainda
          </StyledEmpty>
        ) : (
          <StyledGrid>
            {teams.map(team => (
              <StyledCard key={team.id}>
                <StyledCardTitle>
                  <IconUsers size={16} />
                  {team.name}
                </StyledCardTitle>
                <StyledCardDesc>{team.description ?? 'Sem descrição'}</StyledCardDesc>
                <StyledCardFooter>
                  <StyledMemberCount>{team.memberIds.length} membros</StyledMemberCount>
                  <StyledDeleteBtn onClick={() => handleDelete(team.id)}>
                    <IconTrash size={14} />
                  </StyledDeleteBtn>
                </StyledCardFooter>
              </StyledCard>
            ))}
          </StyledGrid>
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
