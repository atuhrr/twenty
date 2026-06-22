// Normalizes a Brazilian WhatsApp number to E.164 format: 55DDDNNNNNNNNN
// The Meta Cloud API sometimes delivers wa_id without the 9th digit for mobile numbers.
export function normalizeBrPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

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
