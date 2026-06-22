import { normalizeBrPhone } from 'src/engine/core-modules/whatsapp/utils/normalize-br-phone.util';

describe('normalizeBrPhone', () => {
  it('should keep a fully normalized 13-digit number unchanged', () => {
    expect(normalizeBrPhone('5511987654321')).toBe('5511987654321');
  });

  it('should add DDI 55 when missing', () => {
    expect(normalizeBrPhone('11987654321')).toBe('5511987654321');
  });

  it('should add DDI 55 and 9th digit for 10-digit mobile number', () => {
    // wa_id without 9: 5511 87654321 → 55 11 9 87654321
    expect(normalizeBrPhone('5511987654321')).toBe('5511987654321');
    expect(normalizeBrPhone('5511 87654321')).toBe('5511987654321');
  });

  it('should inject 9th digit for 10-digit body starting with 8', () => {
    // 55 + 11 + 87654321 (8 digits, starts with 8 → mobile without 9)
    expect(normalizeBrPhone('551187654321')).toBe('5511987654321');
  });

  it('should inject 9th digit for 10-digit body starting with 9', () => {
    expect(normalizeBrPhone('551198765432')).toBe('55119 98765432'.replace(' ', ''));
  });

  it('should NOT inject 9th digit for landline (starts with 2–5)', () => {
    // 55 + 11 + 32345678 (landline)
    expect(normalizeBrPhone('551132345678')).toBe('551132345678');
  });

  it('should strip non-digit characters before normalizing', () => {
    expect(normalizeBrPhone('+55 (11) 9 8765-4321')).toBe('5511987654321');
  });

  it('should handle number passed without DDI and without 9th digit', () => {
    // 11 + 87654321 → add 55, add 9
    expect(normalizeBrPhone('1187654321')).toBe('5511987654321');
  });

  it('should handle number with + prefix', () => {
    expect(normalizeBrPhone('+5511987654321')).toBe('5511987654321');
  });
});
