// FORK: Voka CRM — T-11/Fase A: layout de auth fiel ao design TailAdmin
// (form à esquerda; painel escuro com padrão de grade + logo à direita).
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

import { VokaBrand } from '@/tailadmin/ui/VokaBrand';

const PASSOS_ONBOARDING: { paths: string[]; label: string }[] = [
  {
    paths: [AppPath.CreateProfile, AppPath.WorkspaceActivation],
    label: 'Bem-vindo',
  },
  { paths: [AppPath.ConnectWhatsApp], label: 'WhatsApp' },
  { paths: [AppPath.InviteTeam], label: 'Equipe' },
  { paths: [AppPath.SyncEmails], label: 'E-mails' },
];

// Padrão de grade do painel (linhas sutis, como no design TailAdmin)
const gradeCss = {
  backgroundImage:
    'linear-gradient(var(--color-gray-800) 1px, transparent 1px), linear-gradient(90deg, var(--color-gray-800) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
} as const;

export const AuthTailLayout = () => {
  const { pathname } = useLocation();

  const passoAtivo = PASSOS_ONBOARDING.findIndex((p) =>
    p.paths.some((path) => pathname.startsWith(path)),
  );
  const emOnboarding = passoAtivo >= 0;

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-900">
      {/* Coluna esquerda — formulário */}
      <div className="flex flex-col overflow-y-auto p-6 lg:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors w-fit"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar ao painel
        </Link>

        {/* Stepper de onboarding */}
        {emOnboarding && (
          <div className="pt-8 max-w-md w-full mx-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mb-5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${((passoAtivo + 1) / PASSOS_ONBOARDING.length) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              {PASSOS_ONBOARDING.map((passo, i) => (
                <div
                  key={passo.label}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      i < passoAtivo
                        ? 'bg-success-500 text-white'
                        : i === passoAtivo
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}
                  >
                    {i < passoAtivo ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      i === passoAtivo
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passo.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Coluna direita — painel de marca (desktop) */}
      <div className="relative hidden lg:flex items-center justify-center bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={gradeCss} />
        <div className="relative flex flex-col items-center text-center px-10">
          <VokaBrand className="text-3xl text-white" size={44} />
          <p className="mt-4 max-w-sm text-gray-400">
            O CRM brasileiro feito para times que vivem de WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};
