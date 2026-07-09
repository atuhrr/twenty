// FORK: Voka CRM — Fase 2: Clientes Recorrentes
import { type FormEvent, useState } from 'react';

import { styled } from '@linaria/react';
import {
  IconCalendar,
  IconDownload,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUsers,
  IconX,
} from 'twenty-ui/icon';

import {
  type ClienteRecorrente,
  useClientesRecorrentes,
} from '@/voka-crm/hooks/useClientesRecorrentes';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import { exportToCsv } from '@/voka-crm/utils/exportToCsv';

void fadeSlideUpKeyframes;

const PERIODICIDADES = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'PONTUAL'];

function fBrl(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function fDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

function isProximo(iso: string | null): boolean {
  if (!iso) return false;
  const diff = new Date(iso + 'T12:00:00').getTime() - Date.now();
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalMode =
  | { kind: 'create' }
  | { kind: 'edit'; row: ClienteRecorrente };

const ClienteModal = ({
  mode,
  onClose,
}: {
  mode: ModalMode;
  onClose: () => void;
}) => {
  const isEdit = mode.kind === 'edit';
  const row    = isEdit ? mode.row : null;

  const [nome, setNome]                       = useState(row?.nome ?? '');
  const [email, setEmail]                     = useState(row?.email ?? '');
  const [telefone, setTelefone]               = useState(row?.telefone ?? '');
  const [empresa, setEmpresa]                 = useState(row?.empresa ?? '');
  const [periodicidade, setPeriodicidade]     = useState(row?.periodicidade ?? 'MENSAL');
  const [valorRecorrente, setValorRecorrente] = useState(
    row ? String(row.valorRecorrente) : '',
  );
  const [proximoContato, setProximoContato]   = useState(row?.proximoContato ?? '');
  const [observacoes, setObservacoes]         = useState(row?.observacoes ?? '');

  const { create, update, creating, updating } = useClientesRecorrentes();
  const loading = creating || updating;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      nome,
      email:           email || null,
      telefone:        telefone || null,
      empresa:         empresa || null,
      periodicidade,
      valorRecorrente: parseFloat(valorRecorrente.replace(',', '.')) || 0,
      proximoContato:  proximoContato || null,
      observacoes:     observacoes || null,
      tags:            [] as string[],
    } as Omit<ClienteRecorrente, 'id' | 'createdAt' | 'updatedAt'>;

    if (isEdit && row) {
      await update({ id: row.id, ...payload });
    } else {
      await create(payload);
    }
    onClose();
  };

  return (
    <StyledOverlay onClick={onClose}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <StyledModalHeader>
          <StyledModalTitle>
            {isEdit ? 'Editar cliente' : 'Novo cliente recorrente'}
          </StyledModalTitle>
          <StyledIconBtn onClick={onClose}><IconX size={16} /></StyledIconBtn>
        </StyledModalHeader>
        <form onSubmit={handleSubmit}>
          <StyledGrid2>
            <StyledField>
              <StyledLabel>Nome *</StyledLabel>
              <StyledInput value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
            </StyledField>
            <StyledField>
              <StyledLabel>Empresa</StyledLabel>
              <StyledInput value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </StyledField>
            <StyledField>
              <StyledLabel>E-mail</StyledLabel>
              <StyledInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </StyledField>
            <StyledField>
              <StyledLabel>Telefone</StyledLabel>
              <StyledInput value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </StyledField>
            <StyledField>
              <StyledLabel>Periodicidade</StyledLabel>
              <StyledSelect value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)}>
                {PERIODICIDADES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                ))}
              </StyledSelect>
            </StyledField>
            <StyledField>
              <StyledLabel>Valor recorrente (R$)</StyledLabel>
              <StyledInput
                type="number"
                min="0"
                step="0.01"
                value={valorRecorrente}
                onChange={(e) => setValorRecorrente(e.target.value)}
              />
            </StyledField>
            <StyledField>
              <StyledLabel>Próximo contato</StyledLabel>
              <StyledInput type="date" value={proximoContato} onChange={(e) => setProximoContato(e.target.value)} />
            </StyledField>
          </StyledGrid2>
          <StyledField>
            <StyledLabel>Observações</StyledLabel>
            <StyledTextarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </StyledField>
          <StyledModalFooter>
            <StyledBtn data-variant="ghost" type="button" onClick={onClose}>Cancelar</StyledBtn>
            <StyledBtn data-variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar cliente'}
            </StyledBtn>
          </StyledModalFooter>
        </form>
      </StyledModal>
    </StyledOverlay>
  );
};

// ─── Página ───────────────────────────────────────────────────────────────────

const handleExportCsv = (clientes: ClienteRecorrente[]) => {
  const headers = ['Nome', 'E-mail', 'Telefone', 'Empresa', 'Periodicidade', 'Valor Recorrente (R$)', 'Próximo Contato', 'Observações', 'Etiquetas'];
  const rows = clientes.map((c) => [
    c.nome, c.email, c.telefone, c.empresa,
    c.periodicidade, c.valorRecorrente,
    c.proximoContato, c.observacoes,
    (c.tags ?? []).join('; '),
  ]);
  exportToCsv(headers, rows, `clientes-recorrentes-${new Date().toISOString().slice(0, 10)}.csv`);
};

export const ClientesPage = () => {
  const { clientes, loading, del } = useClientesRecorrentes();
  const [modal, setModal]          = useState<ModalMode | null>(null);
  const [confirmId, setConfirmId]  = useState<string | null>(null);

  const totalMensal = clientes.reduce((s, c) => {
    const mult = { MENSAL: 1, TRIMESTRAL: 1/3, SEMESTRAL: 1/6, ANUAL: 1/12, PONTUAL: 0 }[c.periodicidade] ?? 1;
    return s + c.valorRecorrente * mult;
  }, 0);

  return (
    <StyledPage>
      <StyledHeader>
        <div>
          <StyledTitle>Clientes Recorrentes</StyledTitle>
          <StyledSubtitle>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} · MRR {fBrl(totalMensal)}/mês
          </StyledSubtitle>
        </div>
        <StyledBtn data-variant="ghost" onClick={() => handleExportCsv(clientes)} disabled={clientes.length === 0}>
          <IconDownload size={14} />
          Exportar CSV
        </StyledBtn>
        <StyledBtn data-variant="primary" onClick={() => setModal({ kind: 'create' })}>
          <IconPlus size={14} />
          Novo cliente
        </StyledBtn>
      </StyledHeader>

      {loading && clientes.length === 0 ? (
        <StyledEmptyMsg>Carregando…</StyledEmptyMsg>
      ) : clientes.length === 0 ? (
        <StyledEmptyState>
          <IconUsers size={40} color="var(--t-font-color-tertiary)" />
          <div>Nenhum cliente recorrente ainda.</div>
          <StyledBtn data-variant="primary" onClick={() => setModal({ kind: 'create' })}>
            Adicionar primeiro cliente
          </StyledBtn>
        </StyledEmptyState>
      ) : (
        <StyledTableCard>
          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Nome / Empresa</StyledTh>
                <StyledTh>Contato</StyledTh>
                <StyledTh align="center">Periodicidade</StyledTh>
                <StyledTh align="right">Valor recorrente</StyledTh>
                <StyledTh align="center">Próximo contato</StyledTh>
                <StyledTh align="center">Ações</StyledTh>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <StyledTr key={c.id}>
                  <StyledTd>
                    <StyledName>{c.nome}</StyledName>
                    {c.empresa && <StyledMuted>{c.empresa}</StyledMuted>}
                  </StyledTd>
                  <StyledTd>
                    {c.email && <StyledMuted>{c.email}</StyledMuted>}
                    {c.telefone && <StyledMuted>{c.telefone}</StyledMuted>}
                  </StyledTd>
                  <StyledTd align="center">
                    <StyledPeriodPill>{c.periodicidade.charAt(0) + c.periodicidade.slice(1).toLowerCase()}</StyledPeriodPill>
                  </StyledTd>
                  <StyledTd align="right">
                    {c.valorRecorrente > 0 ? fBrl(c.valorRecorrente) : '—'}
                  </StyledTd>
                  <StyledTd align="center">
                    <StyledDateCell data-alert={isProximo(c.proximoContato) ? 'true' : 'false'}>
                      {c.proximoContato ? (
                        <>
                          <IconCalendar size={12} />
                          {fDate(c.proximoContato)}
                        </>
                      ) : '—'}
                    </StyledDateCell>
                  </StyledTd>
                  <StyledTd align="center">
                    <StyledActions>
                      {confirmId === c.id ? (
                        <>
                          <StyledSmallBtn data-variant="danger" onClick={() => { del(c.id); setConfirmId(null); }}>
                            Confirmar
                          </StyledSmallBtn>
                          <StyledSmallBtn data-variant="ghost" onClick={() => setConfirmId(null)}>
                            Cancelar
                          </StyledSmallBtn>
                        </>
                      ) : (
                        <>
                          <StyledIconBtn title="Editar" onClick={() => setModal({ kind: 'edit', row: c })}>
                            <IconPencil size={14} />
                          </StyledIconBtn>
                          <StyledIconBtn title="Excluir" data-danger="true" onClick={() => setConfirmId(c.id)}>
                            <IconTrash size={14} />
                          </StyledIconBtn>
                        </>
                      )}
                    </StyledActions>
                  </StyledTd>
                </StyledTr>
              ))}
            </tbody>
          </StyledTable>
        </StyledTableCard>
      )}

      {modal && <ClienteModal mode={modal} onClose={() => setModal(null)} />}
    </StyledPage>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const StyledPage = styled.div`
  background: var(--t-background-tertiary);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  overflow-y: auto;
  padding: 24px 28px 40px;
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 12px;
`;

const StyledTitle = styled.h1`
  color: var(--t-font-color-primary);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0 0 2px;
`;

const StyledSubtitle = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 12px;
`;

const StyledBtn = styled.button`
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 14px;
  transition: opacity 120ms ease-out;

  &[data-variant='primary'] {
    background: var(--color-brand-500);
    border: none;
    color: #fff;
  }

  &[data-variant='ghost'] {
    background: var(--t-background-primary);
    border: 1px solid var(--t-border-color-medium);
    color: var(--t-font-color-primary);
  }

  &[data-variant='danger'] {
    background: var(--t-background-danger);
    border: none;
    color: var(--t-font-color-danger);
  }

  &:not(:disabled):hover { opacity: 0.85; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const StyledTableCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 10px;
  overflow: hidden;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTh = styled.th<{ align?: string }>`
  background: var(--t-background-secondary);
  border-bottom: 1px solid var(--t-border-color-light);
  color: var(--t-font-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding: 10px 14px;
  text-align: ${({ align }) => align ?? 'left'};
  text-transform: uppercase;
  white-space: nowrap;
`;

const StyledTr = styled.tr`
  border-bottom: 1px solid var(--t-border-color-light);
  transition: background 100ms ease-out;
  &:last-child { border-bottom: none; }
  &:nth-child(even) { background: var(--t-background-secondary); }
  &:hover { background: var(--t-background-tertiary); }
`;

const StyledTd = styled.td<{ align?: string }>`
  color: var(--t-font-color-primary);
  font-size: 13px;
  padding: 12px 14px;
  text-align: ${({ align }) => align ?? 'left'};
`;

const StyledName = styled.div`
  font-weight: 600;
`;

const StyledMuted = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 11px;
`;

const StyledPeriodPill = styled.span`
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 20px;
  color: var(--t-font-color-secondary);
  font-size: 11px;
  padding: 2px 8px;
`;

const StyledDateCell = styled.div`
  align-items: center;
  color: var(--t-font-color-secondary);
  display: inline-flex;
  font-size: 12px;
  gap: 4px;

  &[data-alert='true'] {
    color: #f79009;
    font-weight: 600;
  }
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: 4px;
  justify-content: center;
`;

const StyledIconBtn = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--t-font-color-secondary);
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;
  &:hover { background: var(--t-background-tertiary); color: var(--t-font-color-primary); }
  &[data-danger='true']:hover { background: var(--t-background-danger); color: var(--t-font-color-danger); }
`;

const StyledSmallBtn = styled.button`
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  &[data-variant='danger'] { background: var(--t-background-danger); border: none; color: var(--t-font-color-danger); }
  &[data-variant='ghost'] { background: transparent; border: 1px solid var(--t-border-color-medium); color: var(--t-font-color-secondary); }
`;

const StyledEmptyMsg = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 13px;
  padding: 40px;
  text-align: center;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: var(--t-font-color-secondary);
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 16px;
  padding: 60px 20px;
`;

const StyledGrid2 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 12px;
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StyledLabel = styled.label`
  color: var(--t-font-color-secondary);
  font-size: 12px;
  font-weight: 500;
`;

const StyledInput = styled.input`
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  color: var(--t-font-color-primary);
  font-size: 13px;
  outline: none;
  padding: 9px 11px;
  width: 100%;
  &:focus { border-color: var(--color-brand-500); }
`;

const StyledSelect = styled.select`
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  color: var(--t-font-color-primary);
  font-size: 13px;
  outline: none;
  padding: 9px 11px;
  width: 100%;
  &:focus { border-color: var(--color-brand-500); }
`;

const StyledTextarea = styled.textarea`
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  color: var(--t-font-color-primary);
  font-size: 13px;
  outline: none;
  padding: 9px 11px;
  resize: vertical;
  width: 100%;
  &:focus { border-color: var(--color-brand-500); }
`;

const StyledOverlay = styled.div`
  align-items: center;
  background: var(--t-background-overlay-secondary);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 200;
`;

const StyledModal = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-bounce) both;
  background: var(--t-background-primary);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  width: 560px;
`;

const StyledModalHeader = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 20px;
`;

const StyledModalTitle = styled.div`
  color: var(--t-font-color-primary);
  flex: 1;
  font-size: 16px;
  font-weight: 700;
`;

const StyledModalFooter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;
