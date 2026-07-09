// Normaliza número DIGITADO pelo usuário para envio (produto BR-first):
// completa o código do país 55 quando o número é local e injeta o 9º
// dígito de celular quando omitido.
// Números estrangeiros já em formato internacional (≥ 12 dígitos sem o
// prefixo 55) passam intactos — prefixar 55 neles corrompe o número
// (ex.: alemão 4917612345678 virava 554917612345678).
// Para wa_id de mensagens RECEBIDAS use normalizeWaId, nunca esta função.
export function normalizeBrPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // Internacional não-BR (com código de país) — não tocar
  if (!digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  const withCountry = digits.startsWith('55') ? digits : '55' + digits;

  // 55 + DDD(2) + number
  const body = withCountry.slice(2); // DDD + subscriber number

  if (body.length === 10) {
    const ddd = body.slice(0, 2);
    const subscriber = body.slice(2);
    // Mobile: starts with 6-9 and has 8 digits — inject the missing 9th digit
    if (/^[6-9]/.test(subscriber)) {
      return '55' + ddd + '9' + subscriber;
    }
    // Landline: keep as-is
    return withCountry;
  }

  // 11 digits body (DDD + 9 + 8): already normalized
  return withCountry;
}
