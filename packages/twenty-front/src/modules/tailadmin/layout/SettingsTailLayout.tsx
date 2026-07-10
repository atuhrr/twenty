// FORK: Voka CRM — T-10: layout de Settings com sidebar interna TailAdmin
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

type ItemNav = { label: string; path: string };
type GrupoNav = { titulo: string; itens: ItemNav[] };

const GRUPOS: GrupoNav[] = [
  {
    titulo: 'Conta',
    itens: [
      { label: 'Meu perfil', path: getSettingsPath(SettingsPath.ProfilePage) },
      { label: 'Aparência', path: getSettingsPath(SettingsPath.Experience) },
      {
        label: 'Contas conectadas',
        path: getSettingsPath(SettingsPath.Accounts),
      },
    ],
  },
  {
    titulo: 'Workspace',
    itens: [
      { label: 'Geral', path: getSettingsPath(SettingsPath.General) },
      {
        label: 'Membros',
        path: getSettingsPath(SettingsPath.WorkspaceMembersPage),
      },
      {
        label: 'Funções e permissões',
        path: getSettingsPath(SettingsPath.Roles),
      },
    ],
  },
  {
    titulo: 'CRM',
    itens: [
      { label: 'Equipes', path: getSettingsPath(SettingsPath.Equipes) },
      {
        label: 'Motivos de perda',
        path: getSettingsPath(SettingsPath.MotivosDePerca),
      },
      {
        label: 'Objetos e campos',
        path: getSettingsPath(SettingsPath.Objects),
      },
    ],
  },
  {
    titulo: 'Canais',
    itens: [
      { label: 'WhatsApp', path: getSettingsPath(SettingsPath.Whatsapp) },
      { label: 'Financeiro', path: getSettingsPath(SettingsPath.Financeiro) },
      { label: 'Campanhas', path: getSettingsPath(SettingsPath.Broadcast) },
      {
        label: 'Canais conectados',
        path: getSettingsPath(SettingsPath.CanaisConectados),
      },
    ],
  },
  {
    titulo: 'Desenvolvedor',
    itens: [
      {
        label: 'APIs e Webhooks',
        path: getSettingsPath(SettingsPath.ApiWebhooks),
      },
      {
        label: 'Integrações',
        path: getSettingsPath(SettingsPath.Integrations),
      },
    ],
  },
  {
    titulo: 'Admin',
    itens: [
      { label: 'Faturamento', path: getSettingsPath(SettingsPath.Billing) },
    ],
  },
];

export const SettingsTailLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar interna */}
      <aside className="w-[240px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-2">
          Configurações
        </h2>
        <nav className="space-y-5">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {grupo.titulo}
              </p>
              <ul className="space-y-0.5">
                {grupo.itens.map((item) => {
                  const ativo =
                    pathname === item.path ||
                    pathname.startsWith(`${item.path}/`);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`block px-2 py-1.5 text-sm rounded-lg transition-colors ${
                          ativo
                            ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-500/[0.12] dark:text-brand-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
};
