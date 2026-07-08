// FORK: Voka CRM — Fase A: tela de cadastro (design signup.png), lógica do Twenty
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

export const VokaSignUpPage = () => {
  const {
    signUpWithCredentials,
    signUpWithCredentialsInWorkspace,
    signInWithGoogle,
  } = useAuth();
  // No domínio do workspace (single-workspace) o cadastro precisa ser
  // "in workspace" — o redirect multi-workspace é no-op nesse modo e o
  // usuário ficava preso em /cadastro já autenticado.
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();
  const navigate = useNavigate();
  const { enqueueErrorSnackBar } = useSnackBar();

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { requestFreshCaptchaToken } = useRequestFreshCaptchaToken();
  const { readCaptchaToken } = useReadCaptchaToken();

  useEffect(() => {
    void requestFreshCaptchaToken();
  }, [requestFreshCaptchaToken]);

  const valido =
    nome.trim() !== '' &&
    sobrenome.trim() !== '' &&
    email.trim() !== '' &&
    senha.length >= 8 &&
    aceitou;

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setEnviando(true);
    try {
      // O nome é aplicado na etapa "Criar perfil" do onboarding; pré-preenche.
      sessionStorage.setItem(
        'voka-signup-nome',
        JSON.stringify({ firstName: nome.trim(), lastName: sobrenome.trim() }),
      );
      const captchaToken = await readCaptchaToken();
      const emailLimpo = email.trim().toLowerCase();
      if (isOnAWorkspace) {
        await signUpWithCredentialsInWorkspace({
          email: emailLimpo,
          password: senha,
          captchaToken,
        });
      } else {
        // Primeiro cadastro da instância (ainda sem workspace).
        await signUpWithCredentials(emailLimpo, senha, captchaToken);
      }
      // Nenhum dos fluxos navega sozinho em single-workspace (o redirect
      // multi-workspace é no-op) — sem isso o usuário fica autenticado e
      // preso em /cadastro. O hook de rotas intercepta este destino e leva
      // ao passo certo do onboarding (criar perfil etc.).
      navigate('/funil');
    } catch (err) {
      // Token do Turnstile é de uso único — renova para a próxima tentativa.
      void requestFreshCaptchaToken();
      enqueueErrorSnackBar({
        message: (err as Error)?.message ?? 'Não foi possível criar a conta.',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
        Criar conta
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        Comece grátis — leva menos de um minuto.
      </p>

      <GoogleButton
        rotulo="Cadastrar com Google"
        onClick={() => signInWithGoogle({ action: 'create-new-workspace' })}
      />

      <OuDivisor />

      <form onSubmit={cadastrar} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <AuthLabel>Nome</AuthLabel>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              autoComplete="given-name"
              className={authInputClass}
            />
          </div>
          <div>
            <AuthLabel>Sobrenome</AuthLabel>
            <input
              type="text"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              placeholder="Seu sobrenome"
              autoComplete="family-name"
              className={authInputClass}
            />
          </div>
        </div>
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
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={aceitou}
            onChange={(e) => setAceitou(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span>
            Ao criar a conta você concorda com os{' '}
            <span className="font-medium text-gray-800 dark:text-white">
              Termos de Uso
            </span>{' '}
            e a{' '}
            <span className="font-medium text-gray-800 dark:text-white">
              Política de Privacidade
            </span>
            .
          </span>
        </label>

        <AuthButton type="submit" disabled={enviando || !valido}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </AuthButton>
      </form>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Já tem uma conta?{' '}
        <Link
          to="/entrar"
          className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
};
