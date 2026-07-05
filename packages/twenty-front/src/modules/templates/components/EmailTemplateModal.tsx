// FORK: Voka CRM — B2.1: modal de template de e-mail
import { useState } from 'react';

import { styled } from '@linaria/react';

import { IconPaperclip, IconX } from 'twenty-ui/icon';

import {
  VARIAVEIS_DISPONIVEIS,
  useCreateTemplate,
  useUpdateTemplate,
  type CRMTemplate,
} from '@/templates/hooks/useTemplates';

const C = {
  overlay: 'rgba(0,0,0,0.4)',
  bg:      'var(--t-background-primary)',
  border:  'var(--t-border-color-light)',
  txt:     'var(--t-font-color-primary)',
  muted:   'var(--t-font-color-tertiary)',
  brand:   'var(--t-color-purple)',
  bgHover: 'var(--t-background-secondary)',
};

const Overlay = styled.div`
  align-items: center;
  background: ${C.overlay};
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 300;
`;

const Dialog = styled.div`
  background: ${C.bg};
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  width: 640px;
`;

const Head = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: 20px 24px;
`;

const HeadTitle = styled.h2`
  color: ${C.txt};
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  padding: 4px;
  &:hover { background: ${C.bgHover}; }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Input = styled.input`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 9px 12px;
  &:focus { border-color: ${C.brand}; }
  &::placeholder { color: ${C.muted}; }
`;

const Textarea = styled.textarea`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  line-height: 1.6;
  min-height: 180px;
  outline: none;
  padding: 9px 12px;
  resize: vertical;
  &:focus { border-color: ${C.brand}; }
  &::placeholder { color: ${C.muted}; }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${C.border};
  margin: 0;
`;

const VarSection = styled.div`
  background: var(--t-background-secondary);
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 12px;
`;

const VarTitle = styled.div`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const VarGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const VarChip = styled.button`
  background: var(--t-color-purple2, #f5f0ff);
  border: none;
  border-radius: 6px;
  color: ${C.brand};
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  &:hover { opacity: 0.8; }
`;

const CheckboxRow = styled.label`
  align-items: center;
  color: ${C.txt};
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 8px;
`;

const Footer = styled.div`
  align-items: center;
  border-top: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  padding: 16px 24px;
`;

const AttachBtn = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  gap: 5px;
  font-size: 13px;
  padding: 6px 8px;
  &:hover { background: ${C.bgHover}; color: ${C.txt}; }
`;

const Spacer = styled.div`flex: 1;`;

const BtnSecondary = styled.button`
  background: none;
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  &:hover { background: ${C.bgHover}; }
`;

const BtnPrimary = styled.button`
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 20px;
  &:hover { opacity: 0.9; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  template?: CRMTemplate | null;
  onClose: () => void;
};

// ── Componente ────────────────────────────────────────────────────────────────

export const EmailTemplateModal = ({ template, onClose }: Props) => {
  const { create, loading: creating } = useCreateTemplate();
  const { update, loading: updating } = useUpdateTemplate();

  const [nome, setNome] = useState(template?.nome ?? '');
  const [assunto, setAssunto] = useState(template?.assunto ?? '');
  const [corpo, setCorpo] = useState(template?.corpo ?? '');
  const [usarHtml, setUsarHtml] = useState(false);

  const isEditing = !!template;
  const busy = creating || updating;

  const insertVar = (token: string) => setCorpo((prev) => prev + token);

  const handleSave = async () => {
    if (!nome.trim()) return;

    if (isEditing) {
      await update({ variables: { input: { id: template!.id, nome, assunto, corpo } } });
    } else {
      await create({ variables: { input: { nome, tipo: 'email', assunto, corpo } } });
    }
    onClose();
  };

  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Overlay onClick={handleOverlay}>
      <Dialog>
        <Head>
          <HeadTitle>{isEditing ? 'Editar template de e-mail' : 'Novo template de e-mail'}</HeadTitle>
          <CloseBtn onClick={onClose}><IconX size={18} /></CloseBtn>
        </Head>

        <Body>
          <FieldGroup>
            <Label>Nome do template</Label>
            <Input
              placeholder="Ex: Proposta comercial, Follow-up…"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Assunto</Label>
            <Input
              placeholder="Ex: Olá {{contact.name}}, segue nossa proposta"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Corpo do e-mail</Label>
            <Textarea
              placeholder="Digite o corpo do e-mail. Use as variáveis abaixo para personalizar…"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
            />
          </FieldGroup>

          <Divider />

          <VarSection>
            <VarTitle>Variáveis disponíveis — clique para inserir</VarTitle>
            <VarGrid>
              {VARIAVEIS_DISPONIVEIS.map(({ token, label }) => (
                <VarChip key={token} title={label} onClick={() => insertVar(token)}>
                  {token}
                </VarChip>
              ))}
            </VarGrid>
          </VarSection>

          <CheckboxRow>
            <input
              type="checkbox"
              checked={usarHtml}
              onChange={(e) => setUsarHtml(e.target.checked)}
            />
            Enviar e-mail com HTML markup
          </CheckboxRow>
        </Body>

        <Footer>
          <AttachBtn title="Anexar arquivo">
            <IconPaperclip size={16} />
            Anexar
          </AttachBtn>
          <Spacer />
          <BtnSecondary onClick={onClose}>Fechar</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={busy || !nome.trim()}>
            {busy ? 'Salvando…' : 'Salvar template'}
          </BtnPrimary>
        </Footer>
      </Dialog>
    </Overlay>
  );
};
