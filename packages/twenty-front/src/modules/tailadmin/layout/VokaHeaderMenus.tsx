// FORK: Voka CRM — Fase C: notificações + menu do usuário no header TailAdmin
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, LogOut, User } from 'lucide-react';
import { isNonEmptyString } from '@sniptt/guards';

import { useAuth } from '@/auth/hooks/useAuth';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { Modal } from '@/tailadmin/ui/Modal';
import {
  useNotifications,
  type VokaNotification,
} from '@/notifications/hooks/useNotifications';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const AVATARES = Array.from(
  { length: 12 },
  (_, i) => `/avatars/avatar-${String(i + 1).padStart(2, '0')}.png`,
);

// ─── Notificações (tarefas de hoje e atrasadas) ──────────────────────────────

export const VokaNotificationsDropdown = () => {
  const [aberto, setAberto] = useState(false);
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } =
    useNotifications(aberto);

  const formatQuando = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-semibold text-white">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificações
              </p>
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={() => marcarTodasLidas()}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {notificacoes.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">
                Nenhuma notificação por aqui.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {notificacoes.map((n: VokaNotification) => {
                  const naoLida = n.readAt === null;
                  return (
                    <li key={n.id}>
                      <Link
                        to={n.link ?? '#'}
                        onClick={() => {
                          if (naoLida) void marcarLida(n.id);
                          setAberto(false);
                        }}
                        className={`flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          naoLida
                            ? 'bg-brand-50/40 dark:bg-brand-500/[0.06]'
                            : ''
                        }`}
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            naoLida
                              ? 'bg-brand-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                            {n.title}
                          </span>
                          {n.body !== null && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                              {n.body}
                            </span>
                          )}
                          <span className="block text-xs text-gray-400 mt-0.5">
                            {formatQuando(n.createdAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Menu do usuário (avatar + perfil + sair) ────────────────────────────────

export const VokaUserDropdown = () => {
  const [aberto, setAberto] = useState(false);
  const [pickerAberto, setPickerAberto] = useState(false);

  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const setCurrentWorkspaceMember = useSetAtomState(
    currentWorkspaceMemberState,
  );
  const { signOut } = useAuth();
  const { updateOneRecord } = useUpdateOneRecord();

  const nome =
    `${currentWorkspaceMember?.name?.firstName ?? ''} ${currentWorkspaceMember?.name?.lastName ?? ''}`.trim();
  const iniciais =
    nome === ''
      ? '?'
      : nome
          .split(' ')
          .slice(0, 2)
          .map((p) => p[0] ?? '')
          .join('')
          .toUpperCase();
  const avatarUrl = currentWorkspaceMember?.avatarUrl ?? null;

  const escolherAvatar = async (caminho: string) => {
    if (currentWorkspaceMember == null) return;
    const url = `${window.location.origin}${caminho}`;
    await updateOneRecord({
      objectNameSingular: 'workspaceMember',
      idToUpdate: currentWorkspaceMember.id,
      updateOneRecordInput: { avatarUrl: url },
    });
    setCurrentWorkspaceMember((atual) =>
      atual ? { ...atual, avatarUrl: url } : atual,
    );
    setPickerAberto(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Menu do usuário"
        className="flex items-center justify-center rounded-full ring-2 ring-transparent hover:ring-brand-200 transition-shadow"
      >
        {isNonEmptyString(avatarUrl) ? (
          <img
            src={avatarUrl}
            alt={nome}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
            {iniciais}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {nome === '' ? 'Usuário' : nome}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentWorkspaceMember?.userEmail ?? ''}
              </p>
            </div>
            <div className="py-1">
              <Link
                to="/settings/profile"
                onClick={() => setAberto(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <User size={16} /> Meu perfil
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  setPickerAberto(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600" />
                Escolher avatar
              </button>
            </div>
            <div className="py-1 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-500/[0.12]"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </>
      )}

      {/* Seletor de avatares (biblioteca em public/avatars) */}
      {pickerAberto && (
        <Modal
          isOpen
          onClose={() => setPickerAberto(false)}
          className="max-w-[420px] p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Escolha seu avatar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Para adicionar mais opções, coloque imagens em{' '}
            <code className="text-xs">public/avatars</code>.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {AVATARES.map((caminho) => {
              const ativo = avatarUrl?.endsWith(caminho) === true;
              return (
                <button
                  key={caminho}
                  type="button"
                  onClick={() => escolherAvatar(caminho)}
                  className={`relative rounded-xl overflow-hidden ring-2 transition-shadow ${
                    ativo
                      ? 'ring-brand-500'
                      : 'ring-transparent hover:ring-brand-300'
                  }`}
                >
                  <img
                    src={caminho}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  {ativo && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};
