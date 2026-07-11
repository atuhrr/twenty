// FORK: Zellate — Calendário do usuário (referências: calendar-view.png,
// calendar-add-to.png). Mês/semana/dia estilo Teams: eventos próprios
// (agendaEvento) criados/editados em modal central, com vínculo opcional a
// lead, e as tarefas com prazo aparecem como camada do negócio.
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useMutation, useQuery } from '@apollo/client/react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AGENDA_EVENTOS,
  ATUALIZAR_AGENDA_EVENTO,
  CRIAR_AGENDA_EVENTO,
  EXCLUIR_AGENDA_EVENTO,
} from '@/agenda/graphql/agendaQueries';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';

type AgendaEvento = {
  id: string;
  titulo: string;
  cor: string;
  inicio: string;
  fim: string;
  leadId: string | null;
};

type TaskLite = ObjectRecord & {
  title?: string | null;
  status?: string | null;
  dueAt?: string | null;
};

type LeadOption = ObjectRecord & { name?: string | null };

type Visao = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

// Cores semânticas do evento — chaves salvas no banco, valores via token
const CORES: Array<{ chave: string; rotulo: string; cssVar: string }> = [
  { chave: 'primary', rotulo: 'Azul', cssVar: 'var(--color-brand-500)' },
  { chave: 'success', rotulo: 'Verde', cssVar: 'var(--color-success-500)' },
  { chave: 'warning', rotulo: 'Amarelo', cssVar: 'var(--color-warning-500)' },
  { chave: 'danger', rotulo: 'Vermelho', cssVar: 'var(--color-error-500)' },
];

const corDoEvento = (chave: string): string =>
  CORES.find((c) => c.chave === chave)?.cssVar ?? CORES[0].cssVar;

// FORK: Zellate — o FullCalendar aplica backgroundColor via style inline, mas
// não resolve `var(--…)`; resolvemos o token para o valor computado (hex) —
// mesmo padrão do themeColor da página de campanhas. Sem isso, todos os
// eventos caíam na cor padrão e a seleção de cor não tinha efeito.
const corResolvida = (chave: string): string => {
  const cssVar = corDoEvento(chave);
  const nome = cssVar.match(/var\((--[^)]+)\)/)?.[1];

  if (nome === undefined) return cssVar;

  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nome)
    .trim();

  return valor !== '' ? valor : cssVar;
};

const paraDatetimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

// ─── Modal (calendar-add-to.png) ─────────────────────────────────────────────

function EventoModal({
  evento,
  intervaloInicial,
  onFechar,
  onSalvar,
  onExcluir,
  salvando,
}: {
  evento: AgendaEvento | null;
  intervaloInicial: { inicio: Date; fim: Date } | null;
  onFechar: () => void;
  onSalvar: (dados: {
    titulo: string;
    cor: string;
    inicio: string;
    fim: string;
    leadId: string;
  }) => Promise<void>;
  onExcluir: (() => Promise<void>) | null;
  salvando: boolean;
}) {
  const editando = evento != null;
  const agora = new Date();
  const [titulo, setTitulo] = useState(evento?.titulo ?? '');
  const [cor, setCor] = useState(evento?.cor ?? 'primary');
  const [inicio, setInicio] = useState(
    paraDatetimeLocal(
      evento ? new Date(evento.inicio) : (intervaloInicial?.inicio ?? agora),
    ),
  );
  const [fim, setFim] = useState(
    paraDatetimeLocal(
      evento
        ? new Date(evento.fim)
        : (intervaloInicial?.fim ??
            new Date(agora.getTime() + 60 * 60 * 1000)),
    ),
  );
  const [leadId, setLeadId] = useState(evento?.leadId ?? '');
  const [buscaLead, setBuscaLead] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const { records: leads } = useFindManyRecords<LeadOption>({
    objectNameSingular: 'opportunity',
    filter: {},
    recordGqlFields: { id: true, name: true },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 200,
  });

  const leadsVisiveis = useMemo(() => {
    const q = buscaLead.trim().toLowerCase();
    const lista = q
      ? leads.filter((l) => (l.name ?? '').toLowerCase().includes(q))
      : leads;
    return lista.slice(0, 50);
  }, [leads, buscaLead]);

  const valido =
    titulo.trim() !== '' &&
    inicio !== '' &&
    fim !== '' &&
    new Date(fim) > new Date(inicio);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {editando ? 'Editar evento' : 'Adicionar evento'}
          </h2>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Marque calls e compromissos — vincule a um lead para ver o contexto
          do negócio direto no calendário.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Título do evento
            </label>
            <input
              autoFocus
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Call com o cliente"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Cor do evento
            </span>
            <div className="flex gap-4">
              {CORES.map((c) => (
                <label
                  key={c.chave}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="cor-evento"
                    checked={cor === c.chave}
                    onChange={() => setCor(c.chave)}
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: c.cssVar }}
                  />
                  {c.rotulo}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Início
              </label>
              <input
                type="datetime-local"
                className={inputClass}
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Fim
              </label>
              <input
                type="datetime-local"
                className={inputClass}
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Vincular a um lead (opcional)
            </label>
            <input
              className={`${inputClass} mb-1.5`}
              value={buscaLead}
              onChange={(e) => setBuscaLead(e.target.value)}
              placeholder="Buscar lead pelo nome…"
            />
            <select
              className={inputClass}
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">— Sem lead</option>
              {leadsVisiveis.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name ?? '(sem nome)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {onExcluir ? (
            confirmandoExclusao ? (
              <button
                onClick={() => void onExcluir()}
                className="rounded-lg bg-error-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Confirmar exclusão
              </button>
            ) : (
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-gray-800"
              >
                Excluir
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              disabled={salvando || !valido}
              onClick={() =>
                void onSalvar({ titulo, cor, inicio, fim, leadId })
              }
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {salvando
                ? 'Salvando…'
                : editando
                  ? 'Salvar alterações'
                  : 'Adicionar evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export const CalendarioPage = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line twenty/no-state-useref -- ref à API imperativa do FullCalendar, não é estado
  const calendarioRef = useRef<FullCalendar | null>(null);
  const [visao, setVisao] = useState<Visao>('dayGridMonth');
  const [tituloBarra, setTituloBarra] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<AgendaEvento | null>(
    null,
  );
  const [intervaloInicial, setIntervaloInicial] = useState<{
    inicio: Date;
    fim: Date;
  } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data, refetch } = useQuery<{ agendaEventos: AgendaEvento[] }>(
    AGENDA_EVENTOS,
    { fetchPolicy: 'cache-and-network' },
  );
  const eventos = useMemo(() => data?.agendaEventos ?? [], [data]);

  // Camada do negócio: tarefas com prazo aparecem no calendário
  const { records: tarefas } = useFindManyRecords<TaskLite>({
    objectNameSingular: 'task',
    recordGqlFields: { id: true, title: true, status: true, dueAt: true },
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: 300,
  });

  const [criarEvento] = useMutation(CRIAR_AGENDA_EVENTO);
  const [atualizarEvento] = useMutation(ATUALIZAR_AGENDA_EVENTO);
  const [excluirEvento] = useMutation(EXCLUIR_AGENDA_EVENTO);

  const eventosCalendario = useMemo(() => {
    const doUsuario = eventos.map((e) => ({
      id: `evento:${e.id}`,
      title: e.titulo,
      start: e.inicio,
      end: e.fim,
      display: 'block' as const,
      backgroundColor: corResolvida(e.cor),
      borderColor: corResolvida(e.cor),
    }));
    const doNegocio = tarefas
      .filter((t) => t.dueAt != null && t.status !== 'CONCLUIDO')
      .map((t) => ({
        id: `tarefa:${t.id}`,
        title: `✓ ${t.title ?? 'Tarefa'}`,
        start: t.dueAt as string,
        allDay: true,
        backgroundColor: 'var(--color-gray-400)',
        borderColor: 'var(--color-gray-400)',
      }));
    return [...doUsuario, ...doNegocio];
  }, [eventos, tarefas]);

  const api = () => calendarioRef.current?.getApi();

  const mudarVisao = (v: Visao) => {
    setVisao(v);
    api()?.changeView(v);
  };

  const abrirNovo = (intervalo?: { inicio: Date; fim: Date }) => {
    setEventoEditando(null);
    setIntervaloInicial(intervalo ?? null);
    setModalAberto(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const [tipo, id] = arg.event.id.split(':');
    if (tipo === 'tarefa') {
      navigate('/tarefas');
      return;
    }
    const evento = eventos.find((e) => e.id === id);
    if (evento) {
      setEventoEditando(evento);
      setIntervaloInicial(null);
      setModalAberto(true);
    }
  };

  const handleSelect = (arg: DateSelectArg) => {
    abrirNovo({ inicio: arg.start, fim: arg.end });
    api()?.unselect();
  };

  const salvar = async (dados: {
    titulo: string;
    cor: string;
    inicio: string;
    fim: string;
    leadId: string;
  }) => {
    setSalvando(true);
    try {
      const payload = {
        titulo: dados.titulo.trim(),
        cor: dados.cor,
        inicio: new Date(dados.inicio).toISOString(),
        fim: new Date(dados.fim).toISOString(),
        leadId: dados.leadId || null,
      };
      if (eventoEditando) {
        await atualizarEvento({
          variables: { input: { id: eventoEditando.id, ...payload } },
        });
      } else {
        await criarEvento({ variables: { input: payload } });
      }
      await refetch();
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!eventoEditando) return;
    await excluirEvento({ variables: { id: eventoEditando.id } });
    await refetch();
    setModalAberto(false);
  };

  const botaoVisao = (v: Visao, rotulo: string) => (
    <button
      key={v}
      onClick={() => mudarVisao(v)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        visao === v
          ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4 gap-4">
      {/* Barra do calendário (calendar-view.png) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => api()?.prev()}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => api()?.next()}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => abrirNovo()}
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Adicionar evento
            <Plus size={15} />
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {tituloBarra}
        </h2>

        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {botaoVisao('dayGridMonth', 'Mês')}
          {botaoVisao('timeGridWeek', 'Semana')}
          {botaoVisao('timeGridDay', 'Dia')}
        </div>
      </div>

      {/* Calendário */}
      <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <FullCalendar
          ref={calendarioRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={false}
          height="100%"
          selectable
          selectMirror
          dayMaxEvents={4}
          events={eventosCalendario}
          eventClick={handleEventClick}
          select={handleSelect}
          datesSet={(arg) => setTituloBarra(arg.view.title)}
        />
      </div>

      {modalAberto && (
        <EventoModal
          key={eventoEditando?.id ?? 'novo'}
          evento={eventoEditando}
          intervaloInicial={intervaloInicial}
          onFechar={() => setModalAberto(false)}
          onSalvar={salvar}
          onExcluir={eventoEditando ? excluir : null}
          salvando={salvando}
        />
      )}
    </div>
  );
};
