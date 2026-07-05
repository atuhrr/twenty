// FORK: Voka CRM — B2.1: drawer para criar/editar template geral
import { useState } from 'react';

import { styled } from '@linaria/react';

import { IconX } from 'twenty-ui/icon';

import {
  CANAL_LABELS,
  VARIAVEIS_DISPONIVEIS,
  useCreateTemplate,
  useUpdateTemplate,
  type CRMTemplate,
} from '@/templates/hooks/useTemplates';

// ── Tokens de tema (light) ───────────────────────────────────────────────────
const C = {
  overlay:  'rgba(0,0,0,0.3)',
  bg:       'var(--t-background-primary)',
  border:   'var(--t-border-color-light)',
  txt:      'var(--t-font-color-primary)',
  muted:    'var(--t-font-color-tertiary)',
  brand:    'var(--t-color-purple)',
  bgHover:  'var(--t-background-secondary)',
  danger:   'var(--t-color-red)',
};

const Overlay = styled.div`
  background: ${C.overlay};
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 200;
`;

const Drawer = styled.div`
  background: ${C.bg};
  border-left: 1px solid ${C.border};
  bottom: 0;
  box-shadow: -4px 0 24px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  width: 480px;
  z-index: 201;
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
  gap: 18px;
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

const Select = styled.select`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 9px 12px;
  &:focus { border-color: ${C.brand}; }
`;

const Textarea = styled.textarea`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  line-height: 1.55;
  min-height: 140px;
  outline: none;
  padding: 9px 12px;
  resize: vertical;
  &:focus { border-color: ${C.brand}; }
  &::placeholder { color: ${C.muted}; }
`;

const VariaveisBox = styled.div`
  background: var(--t-background-secondary);
  border: 1px solid ${C.border};
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
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

const Footer = styled.div`
  align-items: center;
  border-top: 1px solid ${C.border};
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px;
`;

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

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  template?: CRMTemplate | null;
  onClose: () => void;
};

// ── Componente ────────────────────────────────────────────────────────────────

export const TemplateDrawer = ({ template, onClose }: Props) => {
  const { create, loading: creating } = useCreateTemplate();
  const { update, loading: updating } = useUpdateTemplate();

  const [nome, setNome] = useState(template?.nome ?? '');
  const [canal, setCanal] = useState(template?.canal ?? 'TODOS');
  const [corpo, setCorpo] = useState(template?.corpo ?? '');

  const isEditing = !!template;
  const busy = creating || updating;

  const insertVar = (token: string) => setCorpo((prev) => prev + token);

  const handleSave = async () => {
    if (!nome.trim()) return;

    if (isEditing) {
      await update({ variables: { input: { id: template!.id, nome, canal, corpo } } });
    } else {
      await create({ variables: { input: { nome, tipo: 'geral', canal, corpo } } });
    }
    onClose();
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Drawer>
        <Head>
          <HeadTitle>{isEditing ? 'Editar template' : 'Novo template geral'}</HeadTitle>
          <CloseBtn onClick={onClose}><IconX size={18} /></CloseBtn>
        </Head>

        <Body>
          <FieldGroup>
            <Label>Nome do template</Label>
            <Input
              placeholder="Ex: Boas-vindas, Acompanhamento…"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Canal</Label>
            <Select value={canal} onChange={(e) => setCanal(e.target.value)}>
              {Object.entries(CANAL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Texto do template</Label>
            <Textarea
              placeholder="Digite a mensagem. Use as variáveis abaixo para personalizar…"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Inserir variável</Label>
            <VariaveisBox>
              {VARIAVEIS_DISPONIVEIS.map(({ token, label }) => (
                <VarChip key={token} title={label} onClick={() => insertVar(token)}>
                  {token}
                </VarChip>
              ))}
            </VariaveisBox>
          </FieldGroup>
        </Body>

        <Footer>
          <BtnSecondary onClick={onClose}>Cancelar</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={busy || !nome.trim()}>
            {busy ? 'Salvando…' : 'Salvar template'}
          </BtnPrimary>
        </Footer>
      </Drawer>
    </>
  );
};
