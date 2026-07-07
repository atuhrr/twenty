// FORK: Voka CRM — Fase 16: Integration Marketplace
import { useState } from 'react';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import {
  type InstalledIntegration,
  type IntegrationCatalogItem,
  type IntegrationConfigField,
  useInstalledIntegrations,
  useInstallIntegration,
  useIntegrationCatalog,
  useUninstallIntegration,
  useUpdateInstalledIntegration,
} from '@/integration/hooks/useIntegrations';

// ── Styles ────────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  padding: 32px 40px;
  max-width: 1100px;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #101828;
  margin: 0 0 4px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #667085;
  margin: 0;
`;

const QuickLinks = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const QuickLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  font-size: 13px;
  color: #344054;
  text-decoration: none;
  cursor: pointer;
  &:hover { background: #f9fafb; }
`;

const CategorySection = styled.div`
  margin-bottom: 36px;
`;

const CategoryTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ installed?: boolean }>`
  background: #fff;
  border: 1.5px solid ${({ installed }) => (installed ? '#7c3aed' : '#eaecf0')};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 6px;
`;

const LogoPlaceholder = styled.div`
  width: 36px;
  height: 36px;
  background: #7c3aed;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
`;

const CardName = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: #101828;
`;

const InstalledBadge = styled.span`
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3eeff;
  border-radius: 999px;
  padding: 2px 8px;
`;

const CardDesc = styled.p`
  font-size: 13px;
  color: #667085;
  margin: 0;
  line-height: 1.5;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

const Btn = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' }>`
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  background: ${({ variant }) => (variant === 'primary' ? '#7c3aed' : '#fff')};
  color: ${({ variant }) =>
    variant === 'primary' ? '#fff' : variant === 'danger' ? '#f04438' : '#344054'};
  border-color: ${({ variant }) =>
    variant === 'primary' ? '#7c3aed' : variant === 'danger' ? '#f04438' : '#eaecf0'};
  &:hover { opacity: 0.88; }
`;

// ── Modal ─────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
`;
const Modal = styled.div`
  background: #fff; border-radius: 14px; padding: 28px;
  width: 480px; max-width: 95vw; box-shadow: 0 20px 48px rgba(0,0,0,0.18);
`;
const ModalTitle = styled.h3`
  font-size: 17px; font-weight: 700; margin: 0 0 18px; color: #101828;
`;
const Field = styled.div`margin-bottom: 14px;`;
const Label = styled.label`
  display: block; font-size: 13px; font-weight: 500; color: #344054; margin-bottom: 5px;
`;
const Input = styled.input`
  width: 100%; padding: 8px 11px; border: 1px solid #eaecf0; border-radius: 7px;
  font-size: 14px; color: #101828; outline: none; box-sizing: border-box;
  &:focus { border-color: #7c3aed; }
`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;margin-top:22px;`;
const ExternalLink = styled.a`
  font-size: 13px; color: #7c3aed; text-decoration: none;
  display: inline-block; margin-top: 8px;
  &:hover { text-decoration: underline; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

type ModalState = {
  item: IntegrationCatalogItem;
  installed?: InstalledIntegration;
  config: Record<string, string>;
};

export const SettingsIntegrations = () => {
  const navigate = useNavigate();
  const { catalog } = useIntegrationCatalog();
  const { installed, refetch } = useInstalledIntegrations();
  const { install } = useInstallIntegration();
  const { update } = useUpdateInstalledIntegration();
  const { uninstall } = useUninstallIntegration();

  const [modal, setModal] = useState<ModalState | null>(null);

  const installedMap = new Map(installed.map((i) => [i.integrationKey, i]));

  const categories = Array.from(new Set(catalog.map((c) => c.category)));

  const openCard = (item: IntegrationCatalogItem) => {
    // Items with no configFields redirect to their own settings page
    if (item.configFields.length === 0 && item.docsUrl) {
      if (item.docsUrl.startsWith('/')) {
        navigate(item.docsUrl);
      } else {
        window.open(item.docsUrl, '_blank');
      }
      return;
    }
    const inst = installedMap.get(item.key);
    setModal({
      item,
      installed: inst,
      config: inst ? { ...inst.config } : {},
    });
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!modal) return;
    await install({ variables: { input: { integrationKey: modal.item.key, config: modal.config } } });
    await refetch();
    closeModal();
  };

  const handleToggle = async (inst: InstalledIntegration) => {
    await update({ variables: { input: { integrationKey: inst.integrationKey, config: inst.config, enabled: !inst.enabled } } });
    await refetch();
  };

  const handleUninstall = async (key: string) => {
    await uninstall({ variables: { integrationKey: key } });
    await refetch();
    closeModal();
  };

  return (
    <Wrap>
      <PageHeader>
        <Title>Marketplace de Integrações</Title>
        <Subtitle>
          Conecte o Voka CRM aos seus apps favoritos. Use as chaves de API e
          webhooks nativos para integrações personalizadas.
        </Subtitle>
      </PageHeader>

      <QuickLinks>
        <QuickLink href="/settings/developers">🔑 Chaves de API</QuickLink>
        <QuickLink href="/settings/developers/webhooks/new">🔗 Novo Webhook</QuickLink>
        <QuickLink href="/settings/developers/graphql">⚙️ GraphQL Playground</QuickLink>
        <QuickLink href="/settings/developers/rest">📡 REST API Playground</QuickLink>
      </QuickLinks>

      {categories.map((cat) => (
        <CategorySection key={cat}>
          <CategoryTitle>{cat}</CategoryTitle>
          <Grid>
            {catalog
              .filter((c) => c.category === cat)
              .map((item) => {
                const inst = installedMap.get(item.key);
                return (
                  <Card
                    key={item.key}
                    installed={!!inst?.enabled}
                    onClick={() => openCard(item)}
                  >
                    <CardHeader>
                      {item.logoUrl ? (
                        <Logo src={item.logoUrl} alt={item.name} />
                      ) : (
                        <LogoPlaceholder>
                          {item.name.slice(0, 2).toUpperCase()}
                        </LogoPlaceholder>
                      )}
                      <CardName>{item.name}</CardName>
                      {inst?.enabled && <InstalledBadge>✓ Ativo</InstalledBadge>}
                      {inst && !inst.enabled && <InstalledBadge style={{ color: '#667085', background: '#f9fafb' }}>Pausado</InstalledBadge>}
                    </CardHeader>
                    <CardDesc>{item.description}</CardDesc>
                    {inst && (
                      <CardActions onClick={(e) => e.stopPropagation()}>
                        <Btn variant="ghost" onClick={() => handleToggle(inst)}>
                          {inst.enabled ? 'Pausar' : 'Ativar'}
                        </Btn>
                        <Btn variant="ghost" onClick={() => openCard(item)}>
                          Configurar
                        </Btn>
                      </CardActions>
                    )}
                    {!inst && item.configFields.length > 0 && (
                      <CardActions>
                        <Btn variant="primary">Instalar</Btn>
                      </CardActions>
                    )}
                    {!inst && item.configFields.length === 0 && (
                      <CardActions>
                        <Btn variant="ghost">Configurar →</Btn>
                      </CardActions>
                    )}
                  </Card>
                );
              })}
          </Grid>
        </CategorySection>
      ))}

      {/* Configure Modal */}
      {modal && (
        <Overlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {modal.installed ? 'Atualizar' : 'Instalar'} — {modal.item.name}
            </ModalTitle>
            <p style={{ fontSize: 13, color: '#667085', margin: '0 0 18px' }}>
              {modal.item.description}
            </p>
            {modal.item.configFields.map((cf: IntegrationConfigField) => (
              <Field key={cf.key}>
                <Label>
                  {cf.label}
                  {cf.required && <span style={{ color: '#f04438' }}> *</span>}
                </Label>
                <Input
                  type={cf.type === 'password' ? 'password' : 'text'}
                  placeholder={cf.placeholder ?? ''}
                  value={modal.config[cf.key] ?? ''}
                  onChange={(e) =>
                    setModal((m) =>
                      m ? { ...m, config: { ...m.config, [cf.key]: e.target.value } } : m,
                    )
                  }
                />
              </Field>
            ))}
            {modal.item.docsUrl && !modal.item.docsUrl.startsWith('/') && (
              <ExternalLink href={modal.item.docsUrl} target="_blank" rel="noreferrer">
                📚 Ver documentação
              </ExternalLink>
            )}
            {modal.item.events.length > 0 && (
              <p style={{ fontSize: 12, color: '#667085', margin: '14px 0 0' }}>
                Eventos suportados: {modal.item.events.join(', ')}
              </p>
            )}
            <ModalFooter>
              {modal.installed && (
                <Btn
                  variant="danger"
                  onClick={() => handleUninstall(modal.item.key)}
                >
                  Desinstalar
                </Btn>
              )}
              <Btn variant="ghost" onClick={closeModal}>
                Cancelar
              </Btn>
              <Btn variant="primary" onClick={handleSave}>
                {modal.installed ? 'Salvar' : 'Instalar'}
              </Btn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </Wrap>
  );
};
