// FORK: Voka CRM — Fase 14.2 / B1.3
// Paleta do canvas do editor de bots. Todos os valores de chrome referenciam CSS vars
// definidas em packages/twenty-ui/src/theme-constants/theme-*.css (mesmos valores em
// light e dark pois o canvas é sempre dark — análogo ao painel Inbox #203D49).
// Os valores de data (cores por tipo de nó) ficam como constantes aqui por serem
// dados semânticos, análogos às cores de etapa do funil (CLAUDE.md §3.2).

// ── Chrome do canvas ─────────────────────────────────────────────────────────
export const CANVAS_PALETTE = {
  bg:            'var(--t-canvas-bg)',
  topbarBg:      'var(--t-canvas-topbar-bg)',
  topbarBorder:  'var(--t-canvas-topbar-border)',
  cardBg:        'var(--t-canvas-card-bg)',
  cardBorder:    'var(--t-canvas-card-border)',
  startBorder:   'var(--t-canvas-start-border)',
  startIcon:     'var(--t-canvas-start-border)',
  handleBg:      'var(--t-canvas-start-border)',
  textPrimary:   'var(--t-canvas-text-primary)',
  textMuted:     'var(--t-canvas-text-muted)',
  textInverted:  'var(--t-canvas-text-inverted)',
  dotColor:      'var(--t-canvas-dot-color)',
  edge:          'var(--t-canvas-edge)',
  saveBg:        'var(--t-canvas-save-bg)',
  saveBgHover:   'var(--t-canvas-save-bg-hover)',
  cancelColor:   'var(--t-canvas-text-muted)',
} as const;

// ── Chrome dos nós + cores por tipo (DATA) ───────────────────────────────────
export const NODE_PALETTE = {
  // Estrutura do card — tokens de chrome
  bg:             'var(--t-canvas-node-bg)',
  border:         'var(--t-canvas-node-border)',
  borderSelected: 'var(--t-canvas-node-border-selected)',
  headerBorder:   'var(--t-canvas-node-header-border)',
  numColor:       'var(--t-canvas-node-num-color)',
  typeColor:      'var(--t-canvas-node-type-color)',
  bodyText:       'var(--t-canvas-node-body-text)',
  placeholderText:'var(--t-canvas-node-placeholder)',
  // Cores por tipo de nó — DADO (análogo a cores de etapa, CLAUDE.md §3.2)
  message:          '#60a5fa',
  condition:        '#a78bfa',
  pause:            '#94a3b8',
  action:           '#34d399',
  reaction:         '#f97316',
  comment:          '#6366f1',
  internal_message: '#8b5cf6',
  list_message:     '#06b6d4',
  subscribe:        '#10b981',
  ai_agent:         '#0ea5e9',
  handoff:          '#f59e0b',
  validation:       '#ec4899',
  stop:             '#ef4444',
  custom_step:      '#d946ef',
  widget:           '#14b8a6',
  distribution:     '#fb923c',
} as const;

// ── Cores de branch (true/false) — semântica de dados ────────────────────────
export const NODE_BRANCH_COLORS = {
  true:         '#22c55e', // verde — branch verdadeiro / válido
  false:        '#f87171', // vermelho — branch falso / inválido
  handleBorder: 'var(--t-canvas-text-inverted)',
} as const;

// ── Highlight de nó por tipo — semântica de dados ────────────────────────────
export const NODE_HIGHLIGHT = {
  action:   'rgba(52,211,153,0.12)',
  ai_agent: 'rgba(14,165,233,0.15)',
} as const;

// ── Overlay semi-transparente (botões/campos no canvas dark) ─────────────────
export const CANVAS_OVERLAY = {
  xs:          'var(--t-canvas-overlay-xs)',
  sm:          'var(--t-canvas-overlay-sm)',
  md:          'var(--t-canvas-overlay-md)',
  hover:       'var(--t-canvas-overlay-hover)',
  lg:          'var(--t-canvas-overlay-lg)',
  hoverLg:     'var(--t-canvas-overlay-hover-lg)',
  border:      'var(--t-canvas-overlay-border)',
  shadow:      'var(--t-canvas-shadow)',
  modalOverlay:'var(--t-canvas-modal-overlay)',
  modalShadow: 'var(--t-canvas-modal-shadow)',
} as const;

// ── Paleta do preview (WhatsApp dark UI) ────────────────────────────────────
export const PREVIEW_PALETTE = {
  bg:          'var(--t-canvas-preview-bg)',
  topbarBg:    'var(--t-canvas-preview-topbar-bg)',
  border:      'var(--t-canvas-preview-border)',
  text:        'var(--t-canvas-preview-text)',
  textMuted:   'var(--t-canvas-preview-text-muted)',
  bubbleBot:   'var(--t-canvas-preview-bubble-bot)',
  bubbleUser:  'var(--t-canvas-preview-bubble-user)',
  inputBg:     'var(--t-canvas-preview-input-bg)',
  btnBg:       'var(--t-canvas-preview-btn-bg)',
  btnHover:    'var(--t-canvas-preview-btn-hover)',
  btnDisabled: 'var(--t-canvas-preview-btn-disabled)',
  placeholder: 'var(--t-canvas-preview-placeholder)',
  textInverted:'var(--t-canvas-text-inverted)',
  overlayHover:'var(--t-canvas-overlay-md)',
} as const;

// ── Catálogo de nós disponíveis no "Add next step" ──────────────────────────
// Nós núcleo (14.3A)
export const CORE_NODE_CATALOG = [
  { type: 'message',   label: 'Mensagem',         color: '#60a5fa' },
  { type: 'condition', label: 'Condição',          color: '#a78bfa' },
  { type: 'pause',     label: 'Pausa',             color: '#94a3b8' },
  { type: 'action',    label: 'Ação',              color: '#34d399' },
] as const;

// Nós estendidos (14.3B)
export const EXTENDED_NODE_CATALOG = [
  { type: 'reaction',          label: 'Reação',            color: '#f97316' },
  { type: 'comment',           label: 'Comentário',        color: '#6366f1' },
  { type: 'internal_message',  label: 'Msg. Interna',      color: '#8b5cf6' },
  { type: 'list_message',      label: 'Lista (WhatsApp)',   color: '#06b6d4' },
  { type: 'subscribe',         label: 'Inscrever',         color: '#10b981' },
  { type: 'ai_agent',          label: 'Agente de IA',      color: '#0ea5e9' },
  { type: 'handoff',           label: 'Transferir',        color: '#f59e0b' },
  { type: 'validation',        label: 'Validação',         color: '#ec4899' },
  { type: 'stop',              label: 'Parar bot',         color: '#ef4444' },
  { type: 'custom_step',       label: 'Passo custom',      color: '#d946ef' },
  { type: 'widget',            label: 'Widget',            color: '#14b8a6' },
  { type: 'distribution',      label: 'Distribuição',      color: '#fb923c' },
] as const;
