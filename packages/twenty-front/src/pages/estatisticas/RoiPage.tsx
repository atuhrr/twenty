// FORK: Voka CRM — Fase 20.5: Análise de ROI (tema claro Kommo)
import { type FormEvent, useMemo, useState } from 'react';

import { styled } from '@linaria/react';
import { IconDownload, IconPencil, IconPlus, IconTrash, IconX } from 'twenty-ui/icon';

import { useCountUp } from '@/analytics/hooks/useCountUp';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import {
  type CreateRoiInput,
  type RoiRelatorio,
  type UpdateRoiInput,
  useCreateRoiRelatorio,
  useDeleteRoiRelatorio,
  useExportRoiCsv,
  useRoiRelatorios,
  useUpdateRoiRelatorio,
} from '@/analytics/hooks/useRoiRelatorio';

void fadeSlideUpKeyframes;

// ─── Formatação ───────────────────────────────────────────────────────────────

function fBrl(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function fRoi(v: number | null): string {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function fDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ─── Resumo do conjunto ───────────────────────────────────────────────────────

type Summary = {
  totalInvestido: number;
  totalReceita: number;
  roiMedio: number | null;
  qtdRelatorios: number;
};

function calcSummary(rows: RoiRelatorio[]): Summary {
  if (rows.length === 0) {
    return { totalInvestido: 0, totalReceita: 0, roiMedio: null, qtdRelatorios: 0 };
  }
  const totalInvestido = rows.reduce((s, r) => s + r.investimento, 0);
  const totalReceita   = rows.reduce((s, r) => s + r.receita, 0);
  const roiMedio =
    totalInvestido > 0
      ? ((totalReceita - totalInvestido) / totalInvestido) * 100
      : null;
  return { totalInvestido, totalReceita, roiMedio, qtdRelatorios: rows.length };
}

// ─── Card de métrica ──────────────────────────────────────────────────────────

const SummaryCard = ({
  label,
  value,
  format,
  loading,
  delay,
  positive,
}: {
  label: string;
  value: number;
  format: 'brl' | 'int' | 'pct';
  loading: boolean;
  delay: number;
  positive?: boolean;
}) => {
  const animated = useCountUp(loading ? 0 : Math.abs(value), 800);
  const sign     = value < 0 ? '-' : value > 0 && format === 'pct' ? '+' : '';

  const display = loading ? '…' : format === 'brl'
    ? fBrl(value)
    : format === 'pct'
      ? `${sign}${animated.toFixed(1)}%`
      : animated.toLocaleString('pt-BR');

  const color =
    format === 'pct' && !loading
      ? value >= 0
        ? 'var(--stats-metric-primary)'
        : 'var(--stats-chart-lost)'
      : undefined;

  return (
    <StyledSummaryCard style={{ animationDelay: `${delay}ms` }}>
      <StyledSummaryLabel>{label}</StyledSummaryLabel>
      <StyledSummaryValue style={color ? { color } : undefined}>
        {display}
      </StyledSummaryValue>
    </StyledSummaryCard>
  );
};

// ─── Modal de criação/edição ──────────────────────────────────────────────────

type ModalMode = { kind: 'create' } | { kind: 'edit'; row: RoiRelatorio };

const RoiModal = ({
  mode,
  onClose,
}: {
  mode: ModalMode;
  onClose: () => void;
}) => {
  const isEdit = mode.kind === 'edit';
  const initial = isEdit
    ? { nome: mode.row.nome, investimento: String(mode.row.investimento) }
    : { nome: '', investimento: '' };

  const [nome, setNome]           = useState(initial.nome);
  const [invest, setInvest]       = useState(initial.investimento);
  const { create, loading: cLoad } = useCreateRoiRelatorio();
  const { update, loading: uLoad } = useUpdateRoiRelatorio();

  const loading = cLoad || uLoad;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const investimento = parseFloat(invest.replace(',', '.'));
    if (isNaN(investimento) || !nome.trim()) return;

    if (isEdit) {
      const input: UpdateRoiInput = { id: mode.row.id };
      if (nome !== mode.row.nome) input.nome = nome;
      if (investimento !== mode.row.investimento) input.investimento = investimento;
      await update(input);
    } else {
      const input: CreateRoiInput = { nome: nome.trim(), investimento };
      await create(input);
    }
    onClose();
  };

  return (
    <StyledOverlay onClick={onClose}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <StyledModalHeader>
          <StyledModalTitle>
            {isEdit ? 'Editar relatório' : 'Novo relatório de ROI'}
          </StyledModalTitle>
          <StyledIconBtn onClick={onClose} title="Fechar">
            <IconX size={16} />
          </StyledIconBtn>
        </StyledModalHeader>

        <form onSubmit={handleSubmit}>
          <StyledField>
            <StyledLabel htmlFor="roi-nome">Nome do relatório</StyledLabel>
            <StyledInput
              id="roi-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Q2 2025 — Funil Principal"
              required
              autoFocus
            />
          </StyledField>

          <StyledField>
            <StyledLabel htmlFor="roi-invest">Investimento (R$)</StyledLabel>
            <StyledInput
              id="roi-invest"
              type="number"
              min="0"
              step="0.01"
              value={invest}
              onChange={(e) => setInvest(e.target.value)}
              placeholder="0,00"
              required
            />
          </StyledField>

          <StyledModalFooter>
            <StyledBtn data-variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </StyledBtn>
            <StyledBtn data-variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar relatório'}
            </StyledBtn>
          </StyledModalFooter>
        </form>
      </StyledModal>
    </StyledOverlay>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const RoiPage = () => {
  const { relatorios, loading }    = useRoiRelatorios();
  const { del }                    = useDeleteRoiRelatorio();
  const { exportCsv, loading: csv} = useExportRoiCsv();
  const [modal, setModal]          = useState<ModalMode | null>(null);
  const [confirmId, setConfirmId]  = useState<string | null>(null);

  const summary = useMemo(() => calcSummary(relatorios), [relatorios]);

  const handleDelete = async (id: string) => {
    await del(id);
    setConfirmId(null);
  };

  return (
    <StyledPage>
      {/* Cabeçalho */}
      <StyledHeader>
        <StyledTitle>Análise de ROI</StyledTitle>
        <StyledActions>
          <StyledBtn
            data-variant="ghost"
            onClick={() => exportCsv()}
            disabled={csv || relatorios.length === 0}
          >
            <IconDownload size={14} />
            Exportar CSV
          </StyledBtn>
          <StyledBtn
            data-variant="primary"
            onClick={() => setModal({ kind: 'create' })}
          >
            <IconPlus size={14} />
            Novo relatório
          </StyledBtn>
        </StyledActions>
      </StyledHeader>

      {/* Banner informativo azul */}
      <StyledInfoBanner>
        <strong>Aprenda a aproveitar ao máximo o relatório de ROI.</strong>{' '}
        Cadastre seus investimentos por campanha ou período e acompanhe a receita gerada para
        identificar quais canais trazem o melhor retorno.
      </StyledInfoBanner>

      {/* Como usar o ROI — 3 cards informativos */}
      <StyledInfoSection>
        <StyledInfoSectionTitle>Como usar o ROI?</StyledInfoSectionTitle>
        <StyledInfoCardsRow>
          <StyledInfoCard>
            <StyledInfoStep>1</StyledInfoStep>
            <StyledInfoCardBody>
              <StyledInfoCardTitle>Cadastre o investimento</StyledInfoCardTitle>
              <StyledInfoCardText>
                Informe o valor total investido em marketing, vendas e operações
                para cada campanha ou período analisado.
              </StyledInfoCardText>
            </StyledInfoCardBody>
          </StyledInfoCard>
          <StyledInfoCard>
            <StyledInfoStep>2</StyledInfoStep>
            <StyledInfoCardBody>
              <StyledInfoCardTitle>Conecte os leads ganhos</StyledInfoCardTitle>
              <StyledInfoCardText>
                Os leads ganhos e a receita gerada são calculados automaticamente
                a partir do seu funil de vendas.
              </StyledInfoCardText>
            </StyledInfoCardBody>
          </StyledInfoCard>
          <StyledInfoCard>
            <StyledInfoStep>3</StyledInfoStep>
            <StyledInfoCardBody>
              <StyledInfoCardTitle>Analise o retorno</StyledInfoCardTitle>
              <StyledInfoCardText>
                ROI = (Receita − Investimento) ÷ Investimento × 100.
                Um ROI positivo indica retorno sobre o investimento.
              </StyledInfoCardText>
            </StyledInfoCardBody>
          </StyledInfoCard>
        </StyledInfoCardsRow>
      </StyledInfoSection>

      {/* Cards de resumo */}
      <StyledSummaryRow>
        <SummaryCard
          label="Total investido"
          value={summary.totalInvestido}
          format="brl"
          loading={loading}
          delay={0}
        />
        <SummaryCard
          label="Total receita (leads ganhos)"
          value={summary.totalReceita}
          format="brl"
          loading={loading}
          delay={100}
        />
        <SummaryCard
          label="ROI médio"
          value={summary.roiMedio ?? 0}
          format="pct"
          loading={loading || summary.roiMedio === null}
          delay={200}
          positive={summary.roiMedio !== null && summary.roiMedio >= 0}
        />
        <SummaryCard
          label="Relatórios"
          value={summary.qtdRelatorios}
          format="int"
          loading={loading}
          delay={300}
        />
      </StyledSummaryRow>

      {/* Tabela */}
      <StyledTableCard>
        {loading && relatorios.length === 0 ? (
          <StyledEmptyMsg>Carregando…</StyledEmptyMsg>
        ) : relatorios.length === 0 ? (
          <StyledEmptyMsg>
            Nenhum relatório ainda.{' '}
            <button
              style={{ color: 'var(--t-color-purple-40)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setModal({ kind: 'create' })}
            >
              Criar o primeiro
            </button>
          </StyledEmptyMsg>
        ) : (
          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Nome</StyledTh>
                <StyledTh align="right">Investimento</StyledTh>
                <StyledTh align="right">Total Leads</StyledTh>
                <StyledTh align="right">Ganhos</StyledTh>
                <StyledTh align="right">Perdidos</StyledTh>
                <StyledTh align="right">Receita</StyledTh>
                <StyledTh align="right">ROI</StyledTh>
                <StyledTh align="center">Criado em</StyledTh>
                <StyledTh align="center">Ações</StyledTh>
              </tr>
            </thead>
            <tbody>
              {relatorios.map((row) => (
                <StyledTr key={row.id}>
                  <StyledTd>
                    <StyledRowName>{row.nome}</StyledRowName>
                  </StyledTd>
                  <StyledTd align="right">{fBrl(row.investimento)}</StyledTd>
                  <StyledTd align="right">{row.totalLeads.toLocaleString('pt-BR')}</StyledTd>
                  <StyledTd align="right" style={{ color: 'var(--stats-metric-primary)' }}>
                    {row.leadsGanhos.toLocaleString('pt-BR')}
                  </StyledTd>
                  <StyledTd align="right" style={{ color: 'var(--stats-chart-lost)' }}>
                    {row.leadsPerdidos.toLocaleString('pt-BR')}
                  </StyledTd>
                  <StyledTd align="right">{fBrl(row.receita)}</StyledTd>
                  <StyledTd
                    align="right"
                    style={{
                      color:
                        row.roi === null
                          ? undefined
                          : row.roi >= 0
                            ? 'var(--stats-metric-primary)'
                            : 'var(--stats-chart-lost)',
                      fontWeight: 600,
                    }}
                  >
                    {fRoi(row.roi)}
                  </StyledTd>
                  <StyledTd align="center" style={{ color: 'var(--t-font-color-secondary)' }}>
                    {fDate(row.criadoEm)}
                  </StyledTd>
                  <StyledTd align="center">
                    <StyledRowActions>
                      {confirmId === row.id ? (
                        <>
                          <StyledSmallBtn
                            data-variant="danger"
                            onClick={() => handleDelete(row.id)}
                          >
                            Confirmar
                          </StyledSmallBtn>
                          <StyledSmallBtn
                            data-variant="ghost"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancelar
                          </StyledSmallBtn>
                        </>
                      ) : (
                        <>
                          <StyledIconBtn
                            title="Editar"
                            onClick={() =>
                              setModal({ kind: 'edit', row })
                            }
                          >
                            <IconPencil size={14} />
                          </StyledIconBtn>
                          <StyledIconBtn
                            title="Excluir"
                            data-danger="true"
                            onClick={() => setConfirmId(row.id)}
                          >
                            <IconTrash size={14} />
                          </StyledIconBtn>
                        </>
                      )}
                    </StyledRowActions>
                  </StyledTd>
                </StyledTr>
              ))}
            </tbody>
          </StyledTable>
        )}
      </StyledTableCard>

      {/* Modal */}
      {modal !== null && (
        <RoiModal mode={modal} onClose={() => setModal(null)} />
      )}
    </StyledPage>
  );
};

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  background: var(--t-background-tertiary);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 40px;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
`;

const StyledTitle = styled.h1`
  color: var(--t-font-color-primary);
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledBtn = styled.button`
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 8px 16px;
  transition: opacity var(--anim-duration-fast) var(--anim-ease-out);

  &[data-variant='primary'] {
    background: var(--color-brand-500);
    border: none;
    color: #ffffff;
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:not(:disabled):hover {
    opacity: 0.85;
  }
`;

const StyledSummaryRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, 1fr);
`;

const StyledSummaryCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
`;

const StyledSummaryLabel = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2px;
`;

const StyledSummaryValue = styled.div`
  color: var(--t-font-color-primary);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.4px;
  min-height: 30px;
`;

const StyledTableCard = styled.div`
  animation: fade-slide-up var(--anim-duration-slow) var(--anim-ease-out) both;
  animation-delay: 200ms;
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
  transition: background var(--anim-duration-fast) var(--anim-ease-out);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: var(--t-background-secondary);
  }

  &:hover {
    background: var(--t-background-tertiary);
  }
`;

const StyledTd = styled.td<{ align?: string }>`
  color: var(--t-font-color-primary);
  font-size: 13px;
  padding: 12px 14px;
  text-align: ${({ align }) => align ?? 'left'};
  white-space: nowrap;
`;

const StyledRowName = styled.span`
  font-weight: 500;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
`;

const StyledRowActions = styled.div`
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
  transition: background var(--anim-duration-fast) var(--anim-ease-out),
    color var(--anim-duration-fast) var(--anim-ease-out);
  width: 28px;

  &:hover {
    background: var(--t-background-tertiary);
    color: var(--t-font-color-primary);
  }

  &[data-danger='true']:hover {
    background: var(--t-background-danger);
    color: var(--t-font-color-danger);
  }
`;

const StyledSmallBtn = styled.button`
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  transition: opacity var(--anim-duration-fast) var(--anim-ease-out);

  &[data-variant='danger'] {
    background: var(--t-background-danger);
    border: none;
    color: var(--t-font-color-danger);
  }

  &[data-variant='ghost'] {
    background: transparent;
    border: 1px solid var(--t-border-color-medium);
    color: var(--t-font-color-secondary);
  }

  &:hover {
    opacity: 0.8;
  }
`;

const StyledEmptyMsg = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 13px;
  padding: 40px;
  text-align: center;
`;

// ─── Info banner + cards ─────────────────────────────────────────────────────

const StyledInfoBanner = styled.div`
  background: #eff8ff;
  border-left: 4px solid #2e90fa;
  border-radius: 0 6px 6px 0;
  color: #101828;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 16px;
`;

const StyledInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StyledInfoSectionTitle = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

const StyledInfoCardsRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
`;

const StyledInfoCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 10px;
  display: flex;
  gap: 14px;
  padding: 16px 18px;
`;

const StyledInfoStep = styled.div`
  align-items: center;
  background: #eff8ff;
  border-radius: 50%;
  color: #2e90fa;
  display: flex;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledInfoCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledInfoCardTitle = styled.div`
  color: var(--t-font-color-primary);
  font-size: 13px;
  font-weight: 600;
`;

const StyledInfoCardText = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 12px;
  line-height: 1.5;
`;

// ─── Modal ────────────────────────────────────────────────────────────────────

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
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-bounce)
    both;
  background: var(--t-background-primary);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  padding: 24px;
  width: 440px;
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

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
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
  font-size: 14px;
  outline: none;
  padding: 10px 12px;
  transition: border-color var(--anim-duration-fast) var(--anim-ease-out);
  width: 100%;

  &:focus {
    border-color: var(--color-brand-500);
  }
`;

const StyledModalFooter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;
