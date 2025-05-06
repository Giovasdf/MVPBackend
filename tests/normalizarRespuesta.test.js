import { describe, it, expect } from 'vitest';
import { normalizarRespuesta, esAfirmativo, esNegativo, esListo } from '../index.mjs';

describe('PA7 - Normalización y validación de respuestas', () => {
  it('Debe normalizar texto quitando acentos y símbolos', () => {
    expect(normalizarRespuesta(' Sí! ')).toBe('si');
    expect(normalizarRespuesta('No.')).toBe('no');
  });

  it('Detecta respuestas afirmativas', () => {
    expect(esAfirmativo('sí')).toBe(true);
    expect(esAfirmativo('ok')).toBe(true);
  });

  it('Detecta respuestas negativas', () => {
    expect(esNegativo('no')).toBe(true);
    expect(esNegativo('cancelar')).toBe(true);
  });

  it('Detecta "listo"', () => {
    expect(esListo('listo')).toBe(true);
    expect(esListo('terminar')).toBe(true);
  });
});
