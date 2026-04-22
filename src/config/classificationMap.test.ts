import { describe, it, expect } from 'vitest';
import {
  getMacroConfig,
  getCategoriesForMacro,
  getCategoriesForUnit,
  getConceptsForCategory,
  getDetailsForConcept,
  getMacros,
  getAllCategories,
  getAllConcepts,
} from './classificationMap';

describe('classificationMap helpers', () => {
  describe('getMacroConfig', () => {
    it('returns config for valid macro name', () => {
      const result = getMacroConfig('VIVIR');
      expect(result).toBeDefined();
      expect(result?.name).toBe('VIVIR');
      expect(result?.categories).toBeDefined();
      expect(Array.isArray(result?.categories)).toBe(true);
    });

    it('returns undefined for invalid macro name', () => {
      expect(getMacroConfig('INVALID')).toBeUndefined();
      expect(getMacroConfig('')).toBeUndefined();
    });
  });

  describe('getCategoriesForMacro', () => {
    it('returns categories for each macro', () => {
      const macros = ['VIVIR', 'TRABAJAR', 'DEBER', 'DISFRUTAR'];
      macros.forEach((macro) => {
        const result = getCategoriesForMacro(macro);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('returns empty array for unknown macro', () => {
      expect(getCategoriesForMacro('UNKNOWN')).toEqual([]);
      expect(getCategoriesForMacro('')).toEqual([]);
    });
  });

  describe('getCategoriesForUnit', () => {
    it('works as alias for getCategoriesForMacro', () => {
      expect(getCategoriesForUnit('VIVIR')).toEqual(getCategoriesForMacro('VIVIR'));
      expect(getCategoriesForUnit('INVALID')).toEqual([]);
    });
  });

  describe('unit-to-macro mapping', () => {
    it('maps HOGAR to VIVIR categories', () => {
      const cats = getCategoriesForUnit('HOGAR');
      expect(cats.length).toBeGreaterThan(0);
      expect(cats.some(c => c.name === 'Vivienda')).toBe(true);
    });
    it('maps PROFESIONAL to TRABAJAR categories', () => {
      const cats = getCategoriesForUnit('PROFESIONAL');
      expect(cats.length).toBeGreaterThan(0);
    });
    it('maps BRASIL to DEBER categories', () => {
      const cats = getCategoriesForUnit('BRASIL');
      expect(cats.length).toBeGreaterThan(0);
    });
  });

  describe('getConceptsForCategory', () => {
    it('returns concepts for valid macro/category pairs', () => {
      const cases = [
        ['VIVIR', 'Vivienda'],
        ['VIVIR', 'Alimentación'],
        ['TRABAJAR', 'Obligaciones fiscales'],
        ['DEBER', 'Préstamos'],
        ['DISFRUTAR', 'Ocio y salidas'],
      ];
      cases.forEach(([macro, category]) => {
        const result = getConceptsForCategory(macro, category);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('returns empty array for unknown inputs', () => {
      expect(getConceptsForCategory('INVALID', 'Vivienda')).toEqual([]);
      expect(getConceptsForCategory('VIVIR', 'Unknown Category')).toEqual([]);
      expect(getConceptsForCategory('INVALID', 'Unknown')).toEqual([]);
    });
  });

  describe('getDetailsForConcept', () => {
    it('returns details for valid concept', () => {
      const result = getDetailsForConcept('VIVIR', 'Vivienda', 'Alquiler');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Alta Gracia');
    });

    it('returns empty array for unknown inputs', () => {
      expect(getDetailsForConcept('INVALID', 'Vivienda', 'Alquiler')).toEqual([]);
      expect(getDetailsForConcept('VIVIR', 'Unknown', 'Alquiler')).toEqual([]);
      expect(getDetailsForConcept('VIVIR', 'Vivienda', 'Unknown')).toEqual([]);
    });
  });

  describe('getMacros', () => {
    it('returns all 4 macro names', () => {
      const result = getMacros();
      expect(result).toHaveLength(4);
      expect(result).toContain('VIVIR');
      expect(result).toContain('TRABAJAR');
      expect(result).toContain('DEBER');
      expect(result).toContain('DISFRUTAR');
    });
  });

  describe('getAllCategories', () => {
    it('returns unique categories across all macros', () => {
      const result = getAllCategories();
      expect(result.length).toBeGreaterThan(0);
      const uniqueCheck = new Set(result);
      expect(uniqueCheck.size).toBe(result.length);
      expect(result).toContain('Vivienda');
      expect(result).toContain('Obligaciones fiscales');
      expect(result).toContain('Préstamos');
      expect(result).toContain('Ocio y salidas');
    });
  });

  describe('getAllConcepts', () => {
    it('returns unique concepts across all macros', () => {
      const result = getAllConcepts();
      expect(result.length).toBeGreaterThan(0);
      const uniqueCheck = new Set(result);
      expect(uniqueCheck.size).toBe(result.length);
      expect(result).toContain('Alquiler');
      expect(result).toContain('Monotributo Mauro');
      expect(result).toContain('Préstamo BNA');
      expect(result).toContain('Spotify');
    });
  });
});
