// FORK: Voka CRM — Fase A: verificação em duas etapas (design two-step-verification.png)
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useReadCaptchaToken } from '@/captcha/hooks/useReadCaptchaToken';
import { useRequestFreshCaptchaToken } from '@/captcha/hooks/useRequestFreshCaptchaToken';
import { useAuth } from '@/auth/hooks/useAuth';
import { loginTokenState } from '@/auth/states/loginTokenState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { AuthButton } from '~/pages/auth/vokaAuthUi';

const DIGITOS = 6;

export const VokaTwoStepPage = () => {
  const { getAuthTokensFromOTP } = useAuth();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [searchParams] = useSearchParams();
  const loginToken = useAtomStateValue(loginTokenState);
  const tokenEfetivo = loginToken ?? searchParams.get('loginToken') ?? '';

  const [valores, setValores] = useState<string[]>(Array(DIGITOS).fill(''));
  const [enviando, setEnviando] = useState(false);
  const { requestFreshCaptchaToken } = useRequestFreshCaptchaToken();
  const { readCaptchaToken } = useReadCaptchaToken();

  useEffect(() => {
    void requestFreshCaptchaToken();
  }, [requestFreshCaptchaToken]);

  const codigo = valores.join('');

  const setDigito = (i: number, valor: string) => {
    const limpo = valor.replace(/\D/g, '');
    setValores((v) => {
      const novo = [...v];
      // Suporta colar o código inteiro
      if (limpo.length > 1) {
        for (let j = 0; j < DIGITOS - i; j++) novo[i + j] = limpo[j] ?? '';
      } else {
        novo[i] = limpo;
      }
      return novo;
    });
    if (limpo !== '' && i < DIGITOS - 1)
      document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const teclou = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && valores[i] === '' && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const verificar = async () => {
    if (codigo.length !== DIGITOS) return;
    if (tokenEfetivo === '') {
      enqueueErrorSnackBar({
        message: 'Sessão de verificação expirada. Entre novamente.',
      });
      return;
    }
    setEnviando(true);
    try {
      const captchaToken = await readCaptchaToken();
      await getAuthTokensFromOTP(codigo, tokenEfetivo, captchaToken);
    } catch {
      enqueueErrorSnackBar({ message: 'Código inválido. Tente novamente.' });
      setValores(Array(DIGITOS).fill(''));
      document.getElementById('otp-0')?.focus();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
        Verificação em duas etapas
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        Abra seu aplicativo autenticador e digite o código de 6 dígitos abaixo.
      </p>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
        Digite o código de segurança
      </p>
      <div className="flex items-center gap-2.5 mb-6">
        {valores.map((valor, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={DIGITOS}
            value={valor}
            onChange={(e) => setDigito(i, e.target.value)}
            onKeyDown={(e) => teclou(i, e)}
            autoFocus={i === 0}
            className="w-12 h-13 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-center text-lg font-semibold text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 py-3"
          />
        ))}
      </div>

      <AuthButton
        onClick={verificar}
        disabled={enviando || codigo.length !== DIGITOS}
      >
        {enviando ? 'Verificando…' : 'Verificar minha conta'}
      </AuthButton>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Problemas com o código?{' '}
        <Link
          to="/entrar"
          className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Entrar novamente
        </Link>
      </p>
    </div>
  );
};
