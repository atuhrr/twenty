// FORK: Voka CRM — B2.1: página de templates (chat + e-mail)
import { useState } from 'react';

import { styled } from '@linaria/react';

import {
  IconBrandWhatsapp,
  IconEdit,
  IconFileText,
  IconMail,
  IconMessage,
  IconPlus,
  IconTrash,
} from 'twenty-ui/icon';

import { TemplateDrawer } from '@/templates/components/TemplateDrawer';
import { EmailTemplateModal } from '@/templates/components/EmailTemplateModal';
import {
  CANAL_LABELS,
  TIPO_LABELS,
  useDeleteTemplate,
  useTemplates,
  type CRMTemplate,
} from '@/templates/hooks/useTemplates';

// ── Tokens de tema ───────────────────────────────────────────────────────────

const C = {
  bg:      'var(--t-background-secondary)',
  card:    'var(--t-background-primary)',
  border:  'var(--t-border-color-light)',
  txt:     'var(--t-font-color-primary)',
  muted:   'var(--t-font-color-tertiary)',
  brand:   'var(--t-color-purple)',
  green:   'var(--t-color-green)',
  danger:  'var(--t-color-red)',
};

// ── Estilos ──────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: ${C.bg};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  color: ${C.txt};
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
`;

const PageSubtitle = styled.p`
  color: ${C.muted};
  font-size: 13px;
  margin: 0;
`;

// ── Tabs ─────────────────────────────────────────────────────────────────────

const Tabs = styled.div`
  border-bottom: 1px solid ${C.border};
  display: flex;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  align-items: center;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? C.brand : 'transparent')};
  color: ${({ active }) => (active ? C.brand : C.muted)};
  cursor: pointer;
  display: flex;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  margin-bottom: -1px;
  padding: 10px 18px;
  transition: color 0.15s;
  &:hover { color: ${C.txt}; }
`;

// ── Estado vazio ─────────────────────────────────────────────────────────────

const EmptyWrap = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 40px 0;
`;

const EmptyIcon = styled.div`
  align-items: center;
  background: var(--t-background-tertiary, #f7f8fa);
  border: 1px solid ${C.border};
  border-radius: 50%;
  display: flex;
  height: 64px;
  justify-content: center;
  width: 64px;
`;

const EmptyText = styled.p`
  color: ${C.muted};
  font-size: 14px;
  line-height: 1.6;
  margin: -16px 0 0;
  max-width: 480px;
  text-align: center;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
  max-width: 780px;
  width: 100%;
`;

const FeatureCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const CardIcon = styled.div<{ color: string }>`
  align-items: center;
  background: ${({ color }) => color}18;
  border-radius: 12px;
  color: ${({ color }) => color};
  display: flex;
  height: 44px;
  justify-content: center;
  width: 44px;
`;

const CardTitle = styled.h3`
  color: ${C.txt};
  font-size: 15px;
  font-weight: 700;
  margin: 0;
`;

const CardList = styled.ul`
  color: ${C.muted};
  display: flex;
  flex-direction: column;
  font-size: 13px;
  gap: 6px;
  line-height: 1.5;
  list-style: none;
  margin: 0;
  padding: 0;

  li::before {
    color: ${C.brand};
    content: '• ';
  }
`;

const BtnPrimary = styled.button`
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  margin-top: auto;
  padding: 10px 16px;
  text-align: center;
  &:hover { opacity: 0.9; }
`;

const BtnSecondary = styled.button`
  background: none;
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  margin-top: auto;
  padding: 10px 16px;
  &:hover { background: ${C.bg}; }
`;

// ── Tabela de templates ───────────────────────────────────────────────────────

const TableHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const BtnAdd = styled.button`
  align-items: center;
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
  padding: 8px 16px;
  &:hover { opacity: 0.9; }
`;

const Card = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: 12px;
  overflow: hidden;
`;

const Table = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
`;

const Th = styled.th`
  background: var(--t-background-tertiary, #fafafa);
  border-bottom: 1px solid ${C.border};
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 10px 16px;
  text-align: left;
  text-transform: uppercase;
`;

const Td = styled.td`
  border-bottom: 1px solid ${C.border};
  color: ${C.txt};
  padding: 12px 16px;
  vertical-align: middle;
`;

const TipoPill = styled.span<{ tipo: string }>`
  background: ${({ tipo }) =>
    tipo === 'whatsapp_hsm' ? '#dcfce7'
    : tipo === 'email'       ? '#e0f2fe'
    :                          '#f5f0ff'};
  border-radius: 6px;
  color: ${({ tipo }) =>
    tipo === 'whatsapp_hsm' ? '#166534'
    : tipo === 'email'       ? '#0369a1'
    :                          '#6d28d9'};
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: inline-flex;
  padding: 4px;
  &:hover { background: ${C.border}; }
`;

// ── Email empty state ─────────────────────────────────────────────────────────

const EmailEmpty = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 60px 0;
`;

const EmailEmptyBtn = styled.button`
  align-items: center;
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
  padding: 10px 20px;
  &:hover { opacity: 0.9; }
`;

// ── Componente principal ──────────────────────────────────────────────────────

type TabId = 'chat' | 'email';

export const TemplatesPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CRMTemplate | null>(null);

  const { templates, refetch } = useTemplates();
  const { remove } = useDeleteTemplate();

  const chatTemplates = templates.filter((t) => t.tipo !== 'email');
  const emailTemplates = templates.filter((t) => t.tipo === 'email');

  const handleDelete = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  const openEditDrawer = (t: CRMTemplate) => {
    setEditingTemplate(t);
    setShowDrawer(true);
  };

  const openEditEmail = (t: CRMTemplate) => {
    setEditingTemplate(t);
    setShowEmailModal(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingTemplate(null);
    refetch();
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEditingTemplate(null);
    refetch();
  };

  return (
    <Page>
      <PageHeader>
        <PageTitle>Templates</PageTitle>
        <PageSubtitle>
          Crie modelos de mensagem para agilizar sua comunicação e manter a consistência.
        </PageSubtitle>
      </PageHeader>

      <Tabs>
        <Tab active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
          <IconMessage size={16} />
          Chat Templates
        </Tab>
        <Tab active={activeTab === 'email'} onClick={() => setActiveTab('email')}>
          <IconMail size={16} />
          E-mail
        </Tab>
      </Tabs>

      {/* ── Chat Templates ────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <>
          {chatTemplates.length === 0 ? (
            <EmptyWrap>
              <EmptyIcon>
                <IconMessage size={28} color="var(--t-font-color-tertiary)" />
              </EmptyIcon>
              <EmptyText>
                Crie templates para agilizar sua comunicação e manter a consistência com seus leads e clientes.
              </EmptyText>
              <CardGrid>
                {/* WhatsApp Business */}
                <FeatureCard>
                  <CardIcon color="#25D366">
                    <IconBrandWhatsapp size={24} />
                  </CardIcon>
                  <CardTitle>Templates de WhatsApp</CardTitle>
                  <CardList>
                    <li>Alcance clientes no WhatsApp Business</li>
                    <li>Envie campanhas de marketing</li>
                    <li>Inicie novas conversas com clientes</li>
                    <li>Use formulários interativos e cartões de produto</li>
                    <li>Taxas de mensagem se aplicam</li>
                    <li>Revisados pela Meta para qualidade</li>
                  </CardList>
                  <BtnPrimary onClick={() => alert('Integração WhatsApp Business — em breve')}>
                    Conectar WhatsApp Business
                  </BtnPrimary>
                </FeatureCard>

                {/* Templates Gerais */}
                <FeatureCard>
                  <CardIcon color="var(--t-color-purple)">
                    <IconFileText size={24} />
                  </CardIcon>
                  <CardTitle>Templates gerais</CardTitle>
                  <CardList>
                    <li>Use em todos os canais</li>
                    <li>Automatize respostas para perguntas frequentes</li>
                    <li>Envie mensagens simples com texto e imagens</li>
                    <li>Sem taxas</li>
                  </CardList>
                  <BtnSecondary onClick={() => { setEditingTemplate(null); setShowDrawer(true); }}>
                    Adicionar novo template geral
                  </BtnSecondary>
                </FeatureCard>
              </CardGrid>
            </EmptyWrap>
          ) : (
            <>
              <TableHeader>
                <BtnAdd onClick={() => { setEditingTemplate(null); setShowDrawer(true); }}>
                  <IconPlus size={15} />
                  Novo template
                </BtnAdd>
              </TableHeader>
              <Card>
                <Table>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th>Canal</Th>
                      <Th>Tipo</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {chatTemplates.map((t) => (
                      <tr key={t.id}>
                        <Td style={{ fontWeight: 600 }}>{t.nome}</Td>
                        <Td style={{ color: C.muted }}>
                          {t.canal ? (CANAL_LABELS[t.canal] ?? t.canal) : 'Todos os canais'}
                        </Td>
                        <Td>
                          <TipoPill tipo={t.tipo}>
                            {TIPO_LABELS[t.tipo] ?? t.tipo}
                          </TipoPill>
                        </Td>
                        <Td>
                          <IconBtn onClick={() => openEditDrawer(t)} title="Editar">
                            <IconEdit size={15} />
                          </IconBtn>
                          <IconBtn onClick={() => handleDelete(t.id)} title="Excluir">
                            <IconTrash size={15} />
                          </IconBtn>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── E-mail Templates ──────────────────────────────────────────────── */}
      {activeTab === 'email' && (
        <>
          {emailTemplates.length === 0 ? (
            <EmailEmpty>
              <EmptyIcon>
                <IconMail size={28} color="var(--t-font-color-tertiary)" />
              </EmptyIcon>
              <EmptyText>
                Crie templates de e-mail com variáveis dinâmicas para personalizar cada mensagem automaticamente.
              </EmptyText>
              <EmailEmptyBtn onClick={() => { setEditingTemplate(null); setShowEmailModal(true); }}>
                <IconPlus size={15} />
                Novo template de e-mail
              </EmailEmptyBtn>
            </EmailEmpty>
          ) : (
            <>
              <TableHeader>
                <BtnAdd onClick={() => { setEditingTemplate(null); setShowEmailModal(true); }}>
                  <IconPlus size={15} />
                  Novo template de e-mail
                </BtnAdd>
              </TableHeader>
              <Card>
                <Table>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th>Assunto</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {emailTemplates.map((t) => (
                      <tr key={t.id}>
                        <Td style={{ fontWeight: 600 }}>{t.nome}</Td>
                        <Td style={{ color: C.muted }}>{t.assunto ?? '—'}</Td>
                        <Td>
                          <IconBtn onClick={() => openEditEmail(t)} title="Editar">
                            <IconEdit size={15} />
                          </IconBtn>
                          <IconBtn onClick={() => handleDelete(t.id)} title="Excluir">
                            <IconTrash size={15} />
                          </IconBtn>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      {showDrawer && (
        <TemplateDrawer
          template={editingTemplate}
          onClose={closeDrawer}
        />
      )}

      {showEmailModal && (
        <EmailTemplateModal
          template={editingTemplate}
          onClose={closeEmailModal}
        />
      )}
    </Page>
  );
};
