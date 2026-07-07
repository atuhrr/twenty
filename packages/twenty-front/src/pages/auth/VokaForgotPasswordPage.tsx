// FORK: Voka CRM — Fase A: esqueci a senha (design reset-password.png)
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { AuthButton, authInputClass, AuthLabel } from '~/pages/auth/vokaAuthUi';

export const VokaForgotPasswordPage = () => {
  const { handleResetPassword } = useHandleResetPassword();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() === '') return;
    setEnviando(true);
    try {
      await handleResetPassword(email.trim().toLowerCase())();
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
        Esqueceu sua senha?
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        Informe o e-mail da sua conta e enviaremos um link para redefinir a
        senha.
      </p>

      {enviado ? (
        <div className="rounded-xl border border-success-500/30 bg-success-50 dark:bg-success-500/[0.08] p-4 text-sm text-success-700 dark:text-success-400">
          Se este e-mail estiver cadastrado, o link de redefinição foi enviado.
          Confira sua caixa de entrada.
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <div>
            <AuthLabel>E-mail</AuthLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              autoComplete="email"
              className={authInputClass}
            />
          </div>
          <AuthButton type="submit" disabled={enviando || email.trim() === ''}>
            {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
          </AuthButton>
        </form>
      )}

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Lembrou a senha?{' '}
        <Link
          to="/entrar"
          className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Clique aqui
        </Link>
      </p>
    </div>
  );
};
