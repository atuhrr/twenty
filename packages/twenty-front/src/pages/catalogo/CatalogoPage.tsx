// FORK: Voka CRM — Fase 2: Catálogo de Produtos
import { type FormEvent, useState } from 'react';

import { styled } from '@linaria/react';
import { IconBox, IconDownload, IconPencil, IconPlus, IconTrash, IconX } from 'twenty-ui/icon';

import { type Produto, useProdutos } from '@/voka-crm/hooks/useProdutos';
import { fadeSlideUpKeyframes } from '@/analytics/styles/animations';
import { exportToCsv } from '@/voka-crm/utils/exportToCsv';

void fadeSlideUpKeyframes;

function fBrl(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalMode = { kind: 'create' } | { kind: 'edit'; row: Produto };

const ProdutoModal = ({
  mode,
  onClose,
}: {
  mode: ModalMode;
  onClose: () => void;
}) => {
  const isEdit = mode.kind === 'edit';
  const row    = isEdit ? mode.row : null;

  const [nome, setNome]           = useState(row?.nome ?? '');
  const [descricao, setDescricao] = useState(row?.descricao ?? '');
  const [preco, setPreco]         = useState(row ? String(row.preco) : '');
  const [unidade, setUnidade]     = useState(row?.unidade ?? 'un');
  const [sku, setSku]             = useState(row?.sku ?? '');
  const [categoria, setCategoria] = useState(row?.categoria ?? '');

  const { create, update, creating, updating } = useProdutos();
  const loading = creating || updating;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      nome,
      descricao: descricao || null,
      preco:     parseFloat(preco.replace(',', '.')) || 0,
      unidade:   unidade || 'un',
      sku:       sku || null,
      categoria: categoria || null,
    };

    if (isEdit && row) {
      await update({ id: row.id, ...payload });
    } else {
      await create(payload as Omit<Produto, 'id' | 'ativo' | 'imagens' | 'createdAt'>);
    }
    onClose();
  };

  return (
    <StyledOverlay onClick={onClose}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <StyledModalHeader>
          <StyledModalTitle>
            {isEdit ? 'Editar produto' : 'Novo produto'}
          </StyledModalTitle>
          <StyledIconBtn onClick={onClose}><IconX size={16} /></StyledIconBtn>
        </StyledModalHeader>
        <form onSubmit={handleSubmit}>
          <StyledGrid2>
            <StyledField style={{ gridColumn: '1 / -1' }}>
              <StyledLabel>Nome *</StyledLabel>
              <StyledInput value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
            </StyledField>
            <StyledField>
              <StyledLabel>Preço (R$)</StyledLabel>
              <StyledInput
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </StyledField>
            <StyledField>
              <StyledLabel>Unidade</StyledLabel>
              <StyledInput value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="un, kg, hr…" />
            </StyledField>
            <StyledField>
              <StyledLabel>SKU</StyledLabel>
              <StyledInput value={sku} onChange={(e) => setSku(e.target.value)} />
            </StyledField>
            <StyledField>
              <StyledLabel>Categoria</StyledLabel>
              <StyledInput value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            </StyledField>
            <StyledField style={{ gridColumn: '1 / -1' }}>
              <StyledLabel>Descrição</StyledLabel>
              <StyledTextarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </StyledField>
          </StyledGrid2>
          <StyledModalFooter>
            <StyledBtn data-variant="ghost" type="button" onClick={onClose}>Cancelar</StyledBtn>
            <StyledBtn data-variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar produto'}
            </StyledBtn>
          </StyledModalFooter>
        </form>
      </StyledModal>
    </StyledOverlay>
  );
};

// ─── Página ───────────────────────────────────────────────────────────────────

const handleExportProdutos = (produtos: Produto[]) => {
  const headers = ['Nome', 'Descrição', 'Preço (R$)', 'Unidade', 'SKU', 'Categoria', 'Ativo'];
  const rows = produtos.map((p) => [
    p.nome, p.descricao, p.preco, p.unidade, p.sku, p.categoria, p.ativo ? 'Sim' : 'Não',
  ]);
  exportToCsv(headers, rows, `catalogo-${new Date().toISOString().slice(0, 10)}.csv`);
};

export const CatalogoPage = () => {
  const { produtos, loading, del } = useProdutos();
  const [modal, setModal]          = useState<ModalMode | null>(null);
  const [confirmId, setConfirmId]  = useState<string | null>(null);
  const [busca, setBusca]          = useState('');

  const filtered = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.categoria ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <StyledPage>
      <StyledHeader>
        <div>
          <StyledTitle>Catálogo de Produtos</StyledTitle>
          <StyledSubtitle>{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</StyledSubtitle>
        </div>
        <StyledSearchInput
          placeholder="Buscar produto, categoria, SKU…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <StyledBtn data-variant="ghost" onClick={() => handleExportProdutos(produtos)} disabled={produtos.length === 0}>
          <IconDownload size={14} />
          Exportar CSV
        </StyledBtn>
        <StyledBtn data-variant="primary" onClick={() => setModal({ kind: 'create' })}>
          <IconPlus size={14} />
          Novo produto
        </StyledBtn>
      </StyledHeader>

      {loading && produtos.length === 0 ? (
        <StyledEmptyMsg>Carregando…</StyledEmptyMsg>
      ) : filtered.length === 0 ? (
        <StyledEmptyState>
          <IconBox size={40} color="var(--t-font-color-tertiary)" />
          <div>{busca ? 'Nenhum produto encontrado.' : 'Catálogo vazio.'}</div>
          {!busca && (
            <StyledBtn data-variant="primary" onClick={() => setModal({ kind: 'create' })}>
              Adicionar primeiro produto
            </StyledBtn>
          )}
        </StyledEmptyState>
      ) : (
        <StyledGrid>
          {filtered.map((p) => (
            <StyledCard key={p.id}>
              <StyledCardHeader>
                <StyledCardName>{p.nome}</StyledCardName>
                <StyledCardActions>
                  <StyledIconBtn title="Editar" onClick={() => setModal({ kind: 'edit', row: p })}>
                    <IconPencil size={13} />
                  </StyledIconBtn>
                  {confirmId === p.id ? (
                    <>
                      <StyledSmallBtn data-variant="danger" onClick={() => { del(p.id); setConfirmId(null); }}>
                        Excluir
                      </StyledSmallBtn>
                      <StyledSmallBtn data-variant="ghost" onClick={() => setConfirmId(null)}>
                        Não
                      </StyledSmallBtn>
                    </>
                  ) : (
                    <StyledIconBtn title="Excluir" data-danger="true" onClick={() => setConfirmId(p.id)}>
                      <IconTrash size={13} />
                    </StyledIconBtn>
                  )}
                </StyledCardActions>
              </StyledCardHeader>

              {p.descricao && <StyledCardDesc>{p.descricao}</StyledCardDesc>}

              <StyledCardMeta>
                <StyledCardPrice>{fBrl(p.preco)} / {p.unidade}</StyledCardPrice>
                {p.categoria && <StyledCardTag>{p.categoria}</StyledCardTag>}
                {p.sku && <StyledCardSku>SKU: {p.sku}</StyledCardSku>}
              </StyledCardMeta>
            </StyledCard>
          ))}
        </StyledGrid>
      )}

      {modal && <ProdutoModal mode={modal} onClose={() => setModal(null)} />}
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
  align-items: center;
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

const StyledSearchInput = styled.input`
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  color: var(--t-font-color-primary);
  flex: 1;
  font-size: 13px;
  max-width: 280px;
  outline: none;
  padding: 8px 12px;
  &:focus { border-color: var(--t-color-purple-40, #7c3aed); }
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
  white-space: nowrap;

  &[data-variant='primary'] {
    background: var(--t-color-purple-40, #7c3aed);
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

const StyledGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const StyledCard = styled.div`
  animation: fade-slide-up var(--anim-duration-normal) var(--anim-ease-out) both;
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  transition: box-shadow 120ms ease-out;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
`;

const StyledCardHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 8px;
`;

const StyledCardName = styled.div`
  color: var(--t-font-color-primary);
  flex: 1;
  font-size: 14px;
  font-weight: 600;
`;

const StyledCardActions = styled.div`
  align-items: center;
  display: flex;
  gap: 2px;
`;

const StyledCardDesc = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 12px;
  line-height: 1.4;
`;

const StyledCardMeta = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const StyledCardPrice = styled.div`
  color: var(--t-font-color-primary);
  font-size: 13px;
  font-weight: 600;
`;

const StyledCardTag = styled.span`
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 20px;
  color: var(--t-font-color-secondary);
  font-size: 10px;
  padding: 2px 7px;
`;

const StyledCardSku = styled.span`
  color: var(--t-font-color-tertiary);
  font-family: monospace;
  font-size: 10px;
`;

const StyledIconBtn = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: var(--t-font-color-secondary);
  cursor: pointer;
  display: flex;
  height: 24px;
  justify-content: center;
  width: 24px;
  &:hover { background: var(--t-background-tertiary); color: var(--t-font-color-primary); }
  &[data-danger='true']:hover { background: var(--t-background-danger); color: var(--t-font-color-danger); }
`;

const StyledSmallBtn = styled.button`
  border-radius: 5px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  &[data-variant='danger'] { background: var(--t-background-danger); border: none; color: var(--t-font-color-danger); }
  &[data-variant='ghost'] { background: transparent; border: 1px solid var(--t-border-color-medium); color: var(--t-font-color-secondary); }
`;

const StyledGrid2 = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
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
  &:focus { border-color: var(--t-color-purple-40, #7c3aed); }
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
  &:focus { border-color: var(--t-color-purple-40, #7c3aed); }
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
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  width: 500px;
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
