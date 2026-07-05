// FORK: Voka CRM — Fase 15: Web Forms + Chat Widget
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

import {
  type WebForm,
  type WebFormField,
  type WebFormFieldType,
  useCreateWebForm,
  useDeleteWebForm,
  useUpdateWebForm,
  useWebForms,
} from '@/web-form/hooks/useWebForm';
import {
  IconCopy,
  IconFileText,
  IconPlus,
  IconTrash,
  IconX,
} from 'twenty-ui/icon';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#F2F4F7',
  card: '#FFFFFF',
  border: '#EAECF0',
  txt: '#101828',
  muted: '#667085',
  brand: '#7C3AED',
  success: '#12B76A',
  danger: '#F04438',
  code: '#F8F5FF',
};

const FIELD_TYPES: { value: WebFormFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'select', label: 'Seleção' },
];

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  background: ${C.bg};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
`;

const Header = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  align-items: center;
  color: ${C.txt};
  display: flex;
  font-size: 20px;
  font-weight: 700;
  gap: 10px;
  margin: 0;
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
  background: #FAFAFA;
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

const Toggle = styled.button<{ enabled: boolean }>`
  background: ${({ enabled }) => (enabled ? C.brand : C.border)};
  border: none;
  border-radius: 99px;
  cursor: pointer;
  height: 20px;
  position: relative;
  transition: background 0.2s;
  width: 36px;

  &::after {
    background: #fff;
    border-radius: 50%;
    content: '';
    height: 14px;
    left: ${({ enabled }) => (enabled ? '18px' : '3px')};
    position: absolute;
    top: 3px;
    transition: left 0.2s;
    width: 14px;
  }
`;

const Btn = styled.button<{ variant?: 'primary' | 'ghost' | 'danger' | 'code' }>`
  align-items: center;
  background: ${({ variant }) =>
    variant === 'primary' ? C.brand
    : variant === 'code' ? C.code
    : variant === 'danger' ? '#FEF3F2'
    : 'transparent'};
  border: ${({ variant }) =>
    variant === 'ghost' ? `1px solid ${C.border}`
    : variant === 'code' ? `1px solid #DDD6FE`
    : variant === 'danger' ? `1px solid #FEE4E2`
    : 'none'};
  border-radius: 8px;
  color: ${({ variant }) =>
    variant === 'primary' ? '#fff'
    : variant === 'code' ? C.brand
    : variant === 'danger' ? C.danger
    : C.txt};
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;

  &:hover { opacity: 0.85; }
  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  border-radius: 6px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  padding: 4px;

  &:hover { background: ${C.border}; }
`;

const Overlay = styled.div`
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.4);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  overflow-y: auto;
  padding: 40px 16px;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${C.card};
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  width: 680px;
`;

const ModalHead = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
`;

const ModalFoot = styled.div`
  border-top: 1px solid ${C.border};
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 24px;
`;

const Tabs = styled.div`
  border-bottom: 1px solid ${C.border};
  display: flex;
  gap: 0;
  padding: 0 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? C.brand : 'transparent')};
  color: ${({ active }) => (active ? C.brand : C.muted)};
  cursor: pointer;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? '700' : '500')};
  padding: 12px 16px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionTitle = styled.div`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: ${C.muted};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const Input = styled.input`
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-size: 13px;
  outline: none;
  padding: 9px 12px;
  width: 100%;

  &:focus { border-color: ${C.brand}; }
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

const CodeBox = styled.pre`
  background: #1E1E2E;
  border-radius: 10px;
  color: #CDD6F4;
  font-family: 'Fira Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
`;

const FieldRow = styled.div`
  align-items: center;
  background: #FAFAFA;
  border: 1px solid ${C.border};
  border-radius: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr 1fr auto auto;
  padding: 10px 14px;
`;

const AddFieldBtn = styled.button`
  align-items: center;
  background: none;
  border: 1px dashed ${C.border};
  border-radius: 8px;
  color: ${C.muted};
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 6px;
  padding: 9px 12px;
  width: 100%;

  &:hover { border-color: ${C.brand}; color: ${C.brand}; }
`;

// ─── Field editor row ─────────────────────────────────────────────────────────

const FieldEditor = ({
  field,
  onChange,
  onRemove,
}: {
  field: WebFormField;
  onChange: (f: WebFormField) => void;
  onRemove: () => void;
}) => (
  <FieldRow>
    <Input
      placeholder="Rótulo do campo"
      value={field.label}
      onChange={(e) => onChange({ ...field, label: e.target.value })}
    />
    <Select
      value={field.type}
      onChange={(e) => onChange({ ...field, type: e.target.value as WebFormFieldType })}
    >
      {FIELD_TYPES.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </Select>
    <Input
      placeholder="Placeholder"
      value={field.placeholder ?? ''}
      onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
    />
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
      <input
        type="checkbox"
        checked={field.required ?? false}
        onChange={(e) => onChange({ ...field, required: e.target.checked })}
      />
      Obrig.
    </label>
    <IconBtn onClick={onRemove}><IconTrash size={14} color={C.danger} /></IconBtn>
  </FieldRow>
);

// ─── Embed tab ────────────────────────────────────────────────────────────────

const EmbedTab = ({ form, workspaceId }: { form: WebForm; workspaceId: string }) => {
  const origin = window.location.origin.replace(':4000', ':3000');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const iframeCode = `<iframe\n  src="${origin}/public/web-forms/${form.publicToken}"\n  width="100%"\n  height="520"\n  frameborder="0"\n  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)"\n></iframe>`;

  const widgetCode = `<!-- Voka Chat Widget -->\n<script src="${origin}/public/chat-widget/${workspaceId}/widget.js"></script>`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section>
        <SectionTitle>Embed via iframe</SectionTitle>
        <CodeBox>{iframeCode}</CodeBox>
        <Btn variant="code" onClick={() => copy(iframeCode, 'iframe')}>
          <IconCopy size={14} />
          {copied === 'iframe' ? 'Copiado!' : 'Copiar código iframe'}
        </Btn>
      </Section>

      <Section>
        <SectionTitle>Link direto</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ flex: 1, background: C.code, border: `1px solid #DDD6FE`, borderRadius: 8, color: C.brand, fontSize: 13, padding: '9px 12px' }}>
            {origin}/public/web-forms/{form.publicToken}
          </code>
          <Btn variant="code" onClick={() => copy(`${origin}/public/web-forms/${form.publicToken}`, 'link')}>
            {copied === 'link' ? 'Copiado!' : 'Copiar'}
          </Btn>
        </div>
      </Section>

      <Section>
        <SectionTitle>Chat widget (botão flutuante no site)</SectionTitle>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Cole este script antes do fechamento do &lt;/body&gt; no seu site. Um botão roxo aparecerá no canto inferior direito.
        </p>
        <CodeBox>{widgetCode}</CodeBox>
        <Btn variant="code" onClick={() => copy(widgetCode, 'widget')}>
          <IconCopy size={14} />
          {copied === 'widget' ? 'Copiado!' : 'Copiar snippet widget'}
        </Btn>
      </Section>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  fields: WebFormField[];
};

type Tab = 'builder' | 'embed';

export const WebFormsPage = () => {
  const { forms, refetch } = useWebForms();
  const { create } = useCreateWebForm();
  const { update } = useUpdateWebForm();
  const { remove } = useDeleteWebForm();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const workspaceId = currentWorkspace?.id ?? 'SEU_WORKSPACE_ID';

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WebForm | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [form, setForm] = useState<FormState>({ name: '', fields: [] });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', fields: [] });
    setActiveTab('builder');
    setShowModal(true);
  };

  const openEdit = (f: WebForm) => {
    setEditing(f);
    setForm({ name: f.name, fields: f.fields });
    setActiveTab('builder');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const addField = () =>
    setForm((f) => ({
      ...f,
      fields: [...f.fields, { id: uuidv4(), type: 'text', label: '', required: false }],
    }));

  const updateField = (i: number, field: WebFormField) =>
    setForm((f) => ({ ...f, fields: f.fields.map((x, idx) => (idx === i ? field : x)) }));

  const removeField = (i: number) =>
    setForm((f) => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const input = { name: form.name.trim(), fields: form.fields };

    if (editing) {
      await update({ variables: { input: { id: editing.id, ...input } } });
    } else {
      await create({ variables: { input } });
    }

    closeModal();
    await refetch();
  };

  const handleToggle = async (f: WebForm) => {
    await update({ variables: { input: { id: f.id, enabled: !f.enabled } } });
    await refetch();
  };

  const handleDelete = async (id: string) => {
    await remove({ variables: { id } });
    await refetch();
  };

  return (
    <Page>
      <Header>
        <Title>
          <IconFileText size={22} color={C.brand} />
          Formulários Web
        </Title>
        <Btn variant="primary" onClick={openCreate}>
          <IconPlus size={16} />
          Novo Formulário
        </Btn>
      </Header>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Campos</Th>
              <Th>Token público</Th>
              <Th>Ativo</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ color: C.muted, fontSize: 13, padding: '32px 16px', textAlign: 'center' }}
                >
                  Nenhum formulário criado. Clique em "Novo Formulário".
                </td>
              </tr>
            ) : (
              forms.map((f) => (
                <tr key={f.id}>
                  <Td>
                    <span
                      style={{ color: C.brand, cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => openEdit(f)}
                    >
                      {f.name}
                    </span>
                  </Td>
                  <Td style={{ color: C.muted }}>{f.fields.length} campo(s)</Td>
                  <Td>
                    <code style={{ background: C.code, borderRadius: 4, color: C.brand, fontSize: 11, padding: '2px 6px' }}>
                      {f.publicToken.slice(0, 12)}…
                    </code>
                  </Td>
                  <Td>
                    <Toggle enabled={f.enabled} onClick={() => handleToggle(f)} />
                  </Td>
                  <Td>
                    <IconBtn onClick={() => handleDelete(f.id)}>
                      <IconTrash size={16} color={C.danger} />
                    </IconBtn>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <Overlay onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Modal>
            <ModalHead>
              <h2 style={{ color: C.txt, fontSize: 16, fontWeight: 700, margin: 0 }}>
                {editing ? `Editar: ${editing.name}` : 'Novo Formulário'}
              </h2>
              <IconBtn onClick={closeModal}><IconX size={18} /></IconBtn>
            </ModalHead>

            <Tabs>
              <Tab active={activeTab === 'builder'} onClick={() => setActiveTab('builder')}>
                Construtor
              </Tab>
              {editing && (
                <Tab active={activeTab === 'embed'} onClick={() => setActiveTab('embed')}>
                  Embed / Widget
                </Tab>
              )}
            </Tabs>

            <ModalBody>
              {activeTab === 'builder' && (
                <>
                  <Field>
                    <Label>Nome do formulário *</Label>
                    <Input
                      placeholder="Ex: Fale Conosco"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </Field>

                  <Section>
                    <SectionTitle>Campos ({form.fields.length})</SectionTitle>

                    {form.fields.length === 0 && (
                      <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
                        Adicione campos abaixo para montar o formulário.
                      </div>
                    )}

                    {form.fields.map((field, i) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        onChange={(f) => updateField(i, f)}
                        onRemove={() => removeField(i)}
                      />
                    ))}

                    <AddFieldBtn onClick={addField}>
                      <IconPlus size={14} />
                      Adicionar campo
                    </AddFieldBtn>
                  </Section>
                </>
              )}

              {activeTab === 'embed' && editing && (
                <EmbedTab form={editing} workspaceId={workspaceId} />
              )}
            </ModalBody>

            {activeTab === 'builder' && (
              <ModalFoot>
                <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
                <Btn
                  variant="primary"
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                >
                  <IconFileText size={14} />
                  {editing ? 'Salvar alterações' : 'Criar Formulário'}
                </Btn>
              </ModalFoot>
            )}
          </Modal>
        </Overlay>
      )}
    </Page>
  );
};
