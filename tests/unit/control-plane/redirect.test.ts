import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from '../../../apps/control-plane/src/lib/redirect';

describe('sanitizeRedirectPath (regressão de open redirect)', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/settings?tab=x', '/settings?tab=x'],
    ['/configuracoes/geral', '/configuracoes/geral'],
    ['/', '/'],
    ['/a?next=//evil.com', '/a?next=//evil.com'], // "//" dentro da query não é host
    ['/a#//evil.com', '/a#//evil.com'],
  ])('permite caminho interno %j', (input, expected) => {
    expect(sanitizeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ['//evil.com'],
    ['///evil.com'],
    ['https://evil.com'],
    ['http://evil.com/x'],
    ['/\\evil.com'], // navegadores tratam "\" como "/"
    ['/\t/evil.com'], // navegadores removem \t e reabrem "//"
    ['/\n/evil.com'],
    ['/\r/evil.com'],
    ['\\\\evil.com'],
    ['javascript:alert(1)'],
    ['data:text/html,x'],
    ['dashboard'], // relativo, sem "/" inicial
    [' /dashboard'], // espaço inicial
    ['evil.com'],
  ])('rejeita %j e cai no fallback "/"', (input) => {
    expect(sanitizeRedirectPath(input)).toBe('/');
  });

  it('string vazia -> fallback "/"', () => {
    expect(sanitizeRedirectPath('')).toBe('/');
  });

  it.each([[null], [undefined], [42], [{}], [['/a']]])('valor não-string %j -> fallback', (input) => {
    expect(sanitizeRedirectPath(input)).toBe('/');
  });

  it('respeita fallback customizado', () => {
    expect(sanitizeRedirectPath('//evil.com', '/login')).toBe('/login');
    expect(sanitizeRedirectPath('', '/login')).toBe('/login');
  });

  it('não devolve nada que resolva para outra origem', () => {
    for (const input of ['/a', '/%2Fevil.com', '/..//evil.com', '/./x']) {
      const out = sanitizeRedirectPath(input);
      expect(new URL(out, 'http://internal.invalid').origin).toBe('http://internal.invalid');
    }
  });
});
