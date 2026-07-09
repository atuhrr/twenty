// FORK: Zellate — normalização do wa_id de mensagens RECEBIDAS.
// A Meta entrega o wa_id já em formato internacional (código do país
// incluído, sem "+"). Não se adiciona código de país aqui — fazê-lo
// corrompe números estrangeiros (ex.: alemão 49… virava 5549…).
// A única correção necessária é o 9º dígito de celulares brasileiros,
// que a Meta às vezes omite no wa_id.
export function normalizeWaId(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // BR sem o 9º dígito: 55 + DDD(2) + assinante(8) = 12 dígitos
  if (digits.startsWith('55') && digits.length === 12) {
    const ddd = digits.slice(2, 4);
    const subscriber = digits.slice(4);

    if (/^[6-9]/.test(subscriber)) {
      return '55' + ddd + '9' + subscriber;
    }
  }

  return digits;
}
