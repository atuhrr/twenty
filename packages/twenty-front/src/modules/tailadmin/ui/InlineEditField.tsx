// FORK: Voka CRM — T-12: campo com edição inline (texto → input ao clicar)
import { useState } from 'react';

export type InlineEditType = 'text' | 'select' | 'date' | 'currency';

interface InlineEditFieldProps {
  label: string;
  value: string;
  type?: InlineEditType;
  options?: { value: string; label: string }[];
  onSave: (novoValor: string) => Promise<void> | void;
}

const inputClass =
  'w-full rounded-lg border border-brand-400 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500';

const formatBRL = (v: string) => {
  const n = Number(v);
  return Number.isNaN(n)
    ? v
    : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function InlineEditField({
  label,
  value,
  type = 'text',
  options = [],
  onSave,
}: InlineEditFieldProps) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(value);

  const abrir = () => {
    setRascunho(value);
    setEditando(true);
  };

  const salvar = async () => {
    setEditando(false);
    if (rascunho !== value) await onSave(rascunho);
  };

  const exibicao =
    type === 'currency'
      ? formatBRL(value)
      : type === 'select'
        ? (options.find((o) => o.value === value)?.label ?? value)
        : type === 'date' && value !== ''
          ? new Date(value).toLocaleDateString('pt-BR')
          : value;

  return (
    <div className="py-2">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      {!editando ? (
        <button
          onClick={abrir}
          className="w-full text-left text-sm text-gray-800 dark:text-white/90 rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[28px]"
        >
          {exibicao === '' ? (
            <span className="text-gray-300">—</span>
          ) : (
            exibicao
          )}
        </button>
      ) : type === 'select' ? (
        <select
          autoFocus
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditando(false);
            if (e.key === 'Enter') salvar();
          }}
          className={inputClass}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          autoFocus
          type={
            type === 'date' ? 'date' : type === 'currency' ? 'number' : 'text'
          }
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditando(false);
            if (e.key === 'Enter') salvar();
          }}
          className={inputClass}
        />
      )}
    </div>
  );
}
