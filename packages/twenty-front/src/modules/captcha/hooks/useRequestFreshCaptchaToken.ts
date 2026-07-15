import { captchaTokenState } from '@/captcha/states/captchaTokenState';
import { isRequestingCaptchaTokenState } from '@/captcha/states/isRequestingCaptchaTokenState';
import { isCaptchaRequiredForPath } from '@/captcha/utils/isCaptchaRequiredForPath';
import { captchaState } from '@/client-config/states/captchaState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useCallback } from 'react';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { CaptchaDriverType } from '~/generated-metadata/graphql';
import { useStore } from 'jotai';

// FORK: Voka CRM — o widget invisível do Turnstile vive num único container
// (#captcha-widget). Chamar render() duas vezes no mesmo container é rejeitado
// pelo Turnstile ("already rendered"), então a renovação silenciosamente falha
// e o token de USO ÚNICO fica consumido — no retry o servidor recusa com
// "captcha inválido, tente outro dispositivo". Guardamos o id do widget para
// removê-lo antes de renderizar um novo, garantindo um token fresco a cada
// chamada (usado em cada submit e no retry do cadastro/login).
let turnstileWidgetId: string | undefined;

export const useRequestFreshCaptchaToken = () => {
  const store = useStore();
  const setCaptchaToken = useSetAtomState(captchaTokenState);
  const setIsRequestingCaptchaToken = useSetAtomState(
    isRequestingCaptchaTokenState,
  );

  const requestFreshCaptchaToken = useCallback(async () => {
    if (!isCaptchaRequiredForPath(window.location.pathname)) {
      return;
    }

    const captcha = store.get(captchaState.atom);

    if (!isDefined(captcha)) {
      return;
    }

    assertIsDefinedOrThrow(captcha);

    setIsRequestingCaptchaToken(true);

    let captchaWidget: any;
    switch (captcha.provider) {
      case CaptchaDriverType.GOOGLE_RECAPTCHA:
        window.grecaptcha
          .execute(captcha.siteKey, {
            action: 'submit',
          })
          .then((token: string) => {
            setCaptchaToken(token);
            setIsRequestingCaptchaToken(false);
          });
        break;
      case CaptchaDriverType.TURNSTILE:
        // Remove o widget anterior (se houver) antes de renderizar um novo, para
        // não bater no "already rendered" e sempre obter um token fresco.
        if (isDefined(turnstileWidgetId)) {
          try {
            window.turnstile.remove(turnstileWidgetId);
          } catch {
            // widget já removido (container desmontado ao trocar de rota)
          }
          turnstileWidgetId = undefined;
        }
        captchaWidget = window.turnstile.render('#captcha-widget', {
          sitekey: captcha.siteKey,
        });
        turnstileWidgetId = captchaWidget;
        window.turnstile.execute(captchaWidget, {
          callback: (token: string) => {
            setCaptchaToken(token);
            setIsRequestingCaptchaToken(false);
          },
        });
    }
  }, [setCaptchaToken, setIsRequestingCaptchaToken, store]);

  return { requestFreshCaptchaToken };
};
