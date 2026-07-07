// FORK: Voka CRM — Fase A: átomos de UI compartilhados das telas de auth
import { useState } from 'react';

export const authInputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export const AuthLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
    {children}
    <span className="text-error-500">*</span>
  </label>
);

export const AuthButton = ({
  children,
  disabled,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
  >
    {children}
  </button>
);

interface SenhaInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
}

export const SenhaInput = ({
  value,
  onChange,
  placeholder,
  autoComplete,
}: SenhaInputProps) => {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        type={visivel ? 'text' : 'password'}
        className={`${authInputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {visivel ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
            />
          ) : (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  );
};

export const GoogleButton = ({
  rotulo,
  onClick,
}: {
  rotulo: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full inline-flex items-center justify-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        // oxlint-disable-next-line twenty/no-hardcoded-colors
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        // oxlint-disable-next-line twenty/no-hardcoded-colors
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        // oxlint-disable-next-line twenty/no-hardcoded-colors
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        // oxlint-disable-next-line twenty/no-hardcoded-colors
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
    {rotulo}
  </button>
);

export const OuDivisor = () => (
  <div className="flex items-center gap-3 my-6">
    <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
    <span className="text-sm text-gray-400">Ou</span>
    <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
  </div>
);
