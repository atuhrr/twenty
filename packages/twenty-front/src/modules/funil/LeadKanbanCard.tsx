import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCssCompatibleDraggableProps } from '@/ui/layout/draggable-list/utils/getCssCompatibleDraggableProps';

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatBRL(micros: number) {
  const v = micros / 1_000_000;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function isOverdue(iso?: string) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

interface LeadKanbanCardProps {
  lead: any;
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  // FORK: Zellate — mensagens não lidas no WhatsApp deste lead
  unreadCount?: number;
  onOpenChat?: () => void;
}

export function LeadKanbanCard({
  lead,
  index,
  provided,
  snapshot,
  unreadCount = 0,
  onOpenChat,
}: LeadKanbanCardProps) {
  const navigate = useNavigate();
  const didDragRef = useRef(false);
  const isDragging = snapshot.isDragging;
  const colorIdx = index % AVATAR_COLORS.length;
  const name = lead.name ?? '(Sem nome)';
  const companyName = lead.company?.name ?? null;
  const micros = (Number(lead.amount?.amountMicros ?? 0) || 0);
  const closeDate = lead.closeDate ?? lead.closeAt ?? null;
  const overdue = isOverdue(closeDate);

  return (
    <div
      ref={(el) => provided.innerRef(el)}
      {...getCssCompatibleDraggableProps(provided.draggableProps)}
      {...provided.dragHandleProps}
      className={`bg-white rounded-xl border p-4 cursor-pointer select-none transition-shadow ${
        isDragging
          ? 'shadow-lg border-brand-300 rotate-1'
          : 'border-gray-200 shadow-theme-xs hover:shadow-theme-sm'
      }`}
      onMouseDown={() => { didDragRef.current = false; }}
      onMouseMove={() => { didDragRef.current = true; }}
      onClick={() => { if (!didDragRef.current) navigate(`/leads/${lead.id}`); }}
    >
      {/* Name + badge de mensagens não lidas (WhatsApp) */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
        {unreadCount > 0 && (
          <button
            type="button"
            title={`${unreadCount} mensagem(ns) não lida(s) — abrir conversa`}
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-success-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat?.();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
            </svg>
            {unreadCount}
          </button>
        )}
      </div>

      {/* Company */}
      {companyName && (
        <p className="text-xs text-gray-400 truncate mb-2">{companyName}</p>
      )}

      {/* Value */}
      {micros > 0 && (
        <p className="text-sm font-semibold text-brand-500 mb-2">
          {formatBRL(micros)}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2">
        {/* Avatar initials */}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${AVATAR_COLORS[colorIdx]}`}
        >
          {initials(name)}
        </span>

        {/* Close date */}
        {closeDate && (
          <span
            className={`text-xs ${overdue ? 'text-error-500 font-medium' : 'text-gray-400'}`}
          >
            {formatDate(closeDate)}
          </span>
        )}
      </div>
    </div>
  );
}
