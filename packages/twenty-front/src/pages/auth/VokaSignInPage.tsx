// FORK: Voka CRM — Fase A: tela de login (design signin.png), lógica do Twenty
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useReadCaptchaToken } from '@/captcha/hooks/useReadCaptchaToken';
import { useRequestFreshCaptchaToken } from '@/captcha/hooks/useRequestFreshCaptchaToken';
import { useAuth } from '@/auth/hooks/useAuth';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import {
  AuthButton,
  authInputClass,
  AuthLabel,
  GoogleButton,
  OuDivisor,
  SenhaInput,
} from '~/pages/auth/vokaAuthUi';

export const VokaSignInPage = () => {
  const {
    signInWithCredentials,
    signInWithCredentialsInWorkspace,
    signInWithGoogle,
  } = useAuth();
  // No domínio do workspace (single-workspace/dev) o login precisa ser
  // "in workspace" — o redirect multi-workspace é no-op nesse modo.
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();
  const { enqueueErrorSnackBar } = useSnackBar();
  const navigate = useNavigate();
  const { requestFreshCaptchaToken } = useRequestFreshCaptchaToken();
  const { readCaptchaToken } = useReadCaptchaToken();

  useEffect(() => {
    void requestFreshCaptchaToken();
  }, [requestFreshCaptchaToken]);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() === '' || senha === '') return;
    setEnviando(true);
    try {
      const emailLimpo = email.trim().toLowerCase();
      const captchaToken = await readCaptchaToken();
      if (isOnAWorkspace) {
        await signInWithCredentialsInWorkspace(emailLimpo, senha, captchaToken);
        navigate('/funil');
      } else {
        await signInWithCredentials(emailLimpo, senha, captchaToken);
      }
    } catch (err) {
      // Token do Turnstile é de uso único — renova para a próxima tentativa.
      void requestFreshCaptchaToken();
      enqueueErrorSnackBar({
        message:
          (err as Error)?.message ??
          'Não foi possível entrar. Verifique os dados.',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
        Entrar
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        Informe seu e-mail e senha para acessar o CRM.
      </p>

      <GoogleButton
        rotulo="Entrar com Google"
        onClick={() =>
          signInWithGoogle({ action: 'list-available-workspaces' })
        }
      />

      <OuDivisor />

      <form onSubmit={entrar} className="space-y-5">
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
        <div>
          <AuthLabel>Senha</AuthLabel>
          <SenhaInput
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Manter conectado
          </label>
          <Link
            to="/recuperar-senha"
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <AuthButton type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </AuthButton>
      </form>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Não tem uma conta?{' '}
        <Link
          to="/cadastro"
          className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
};
