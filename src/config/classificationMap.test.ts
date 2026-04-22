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
        it('returns config for valid macro name VIVIR', () => {
            const result = getMacroConfig('VIVIR');
            expect(result).toBeDefined();
            expect(result?.name).toBe('VIVIR');
            expect(result?.categories).toBeDefined();
            expect(Array.isArray(result?.categories)).toBe(true);
        });

        it('returns config for valid macro name TRABAJAR', () => {
            const result = getMacroConfig('TRABAJAR');
            expect(result).toBeDefined();
            expect(result?.name).toBe('TRABAJAR');
        });

        it('returns config for valid macro name DEBER', () => {
            const result = getMacroConfig('DEBER');
            expect(result).toBeDefined();
            expect(result?.name).toBe('DEBER');
        });

        it('returns config for valid macro name DISFRUTAR', () => {
            const result = getMacroConfig('DISFRUTAR');
            expect(result).toBeDefined();
            expect(result?.name).toBe('DISFRUTAR');
        });

        it('returns undefined for invalid macro name', () => {
            expect(getMacroConfig('INVALID')).toBeUndefined();
        });

        it('returns undefined for empty string', () => {
            expect(getMacroConfig('')).toBeUndefined();
        });
    });

    describe('getCategoriesForMacro', () => {
        it('returns categories for VIVIR', () => {
            const result = getCategoriesForMacro('VIVIR');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]?.name).toBe('Vivienda');
        });

        it('returns categories for TRABAJAR', () => {
            const result = getCategoriesForMacro('TRABAJAR');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]?.name).toBe('Obligaciones fiscales');
        });

        it('returns categories for DEBER', () => {
            const result = getCategoriesForMacro('DEBER');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]?.name).toBe('Préstamos');
        });

        it('returns categories for DISFRUTAR', () => {
            const result = getCategoriesForMacro('DISFRUTAR');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]?.name).toBe('Ocio y salidas');
        });

        it('returns empty array for unknown macro', () => {
            const result = getCategoriesForMacro('UNKNOWN');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns empty array for empty string', () => {
            const result = getCategoriesForMacro('');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getCategoriesForUnit', () => {
        it('works as alias for getCategoriesForMacro with VIVIR', () => {
            const byUnit = getCategoriesForUnit('VIVIR');
            const byMacro = getCategoriesForMacro('VIVIR');
            expect(byUnit).toEqual(byMacro);
        });

        it('works as alias for getCategoriesForMacro with TRABAJAR', () => {
            const byUnit = getCategoriesForUnit('TRABAJAR');
            const byMacro = getCategoriesForMacro('TRABAJAR');
            expect(byUnit).toEqual(byMacro);
        });

        it('returns empty array for unknown unit', () => {
            const result = getCategoriesForUnit('INVALID');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getConceptsForCategory', () => {
        it('returns concepts for valid macro/category VIVIR/Vivienda', () => {
            const result = getConceptsForCategory('VIVIR', 'Vivienda');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]?.name).toBe('Alquiler');
        });

        it('returns concepts for VIVIR/Alimentación', () => {
            const result = getConceptsForCategory('VIVIR', 'Alimentación');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result.map(c => c.name)).toContain('Supermercado');
            expect(result.map(c => c.name)).toContain('Verdulería');
        });

        it('returns concepts for TRABAJAR/Obligaciones fiscales', () => {
            const result = getConceptsForCategory('TRABAJAR', 'Obligaciones fiscales');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.map(c => c.name)).toContain('Monotributo Mauro');
            expect(result.map(c => c.name)).toContain('Monotributo Agos');
        });

        it('returns concepts for DEBER/Préstamos', () => {
            const result = getConceptsForCategory('DEBER', 'Préstamos');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.map(c => c.name)).toContain('Préstamo BNA');
        });

        it('returns concepts for DISFRUTAR/Ocio y salidas', () => {
            const result = getConceptsForCategory('DISFRUTAR', 'Ocio y salidas');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.map(c => c.name)).toContain('Empanadas');
            expect(result.map(c => c.name)).toContain('Asado');
        });

        it('returns empty array for unknown macro', () => {
            const result = getConceptsForCategory('INVALID', 'Vivienda');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns empty array for unknown category', () => {
            const result = getConceptsForCategory('VIVIR', 'Unknown Category');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns empty array for both unknown macro and category', () => {
            const result = getConceptsForCategory('INVALID', 'Unknown');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getDetailsForConcept', () => {
        it('returns details for valid concept VIVIR/Vivienda/Alquiler', () => {
            const result = getDetailsForConcept('VIVIR', 'Vivienda', 'Alquiler');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('Alta Gracia');
            expect(result).toContain('Balbuena Guillermo Ariel');
        });

        it('returns details for VIVIR/Alimentación/Supermercado', () => {
            const result = getDetailsForConcept('VIVIR', 'Alimentación', 'Supermercado');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toContain('Coto');
            expect(result).toContain('Jumbo');
        });

        it('returns details for TRABAJAR/Infraestructura digital/Google Workspace', () => {
            const result = getDetailsForConcept('TRABAJAR', 'Infraestructura digital', 'Google Workspace');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toContain('Suite Google');
        });

        it('returns empty array for unknown macro', () => {
            const result = getDetailsForConcept('INVALID', 'Vivienda', 'Alquiler');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns empty array for unknown category', () => {
            const result = getDetailsForConcept('VIVIR', 'Unknown', 'Alquiler');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns empty array for unknown concept', () => {
            const result = getDetailsForConcept('VIVIR', 'Vivienda', 'Unknown');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        it('returns details when concept has details', () => {
            const result = getDetailsForConcept('VIVIR', 'Vivienda', 'Alquiler');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('getMacros', () => {
        it('returns all 4 macro names', () => {
            const result = getMacros();
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(4);
        });

        it('returns VIVIR', () => {
            expect(getMacros()).toContain('VIVIR');
        });

        it('returns TRABAJAR', () => {
            expect(getMacros()).toContain('TRABAJAR');
        });

        it('returns DEBER', () => {
            expect(getMacros()).toContain('DEBER');
        });

        it('returns DISFRUTAR', () => {
            expect(getMacros()).toContain('DISFRUTAR');
        });
    });

    describe('getAllCategories', () => {
        it('returns unique categories across all macros', () => {
            const result = getAllCategories();
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('returns all categories without duplicates', () => {
            const result = getAllCategories();
            const uniqueCheck = new Set(result);
            expect(uniqueCheck.size).toBe(result.length);
        });

        it('includes categories from VIVIR', () => {
            expect(getAllCategories()).toContain('Vivienda');
            expect(getAllCategories()).toContain('Alimentación');
            expect(getAllCategories()).toContain('Servicios');
        });

        it('includes categories from TRABAJAR', () => {
            expect(getAllCategories()).toContain('Obligaciones fiscales');
            expect(getAllCategories()).toContain('Infraestructura digital');
        });

        it('includes categories from DEBER', () => {
            expect(getAllCategories()).toContain('Préstamos');
            expect(getAllCategories()).toContain('Deudas');
        });

        it('includes categories from DISFRUTAR', () => {
            expect(getAllCategories()).toContain('Ocio y salidas');
            expect(getAllCategories()).toContain('Suscripciones');
        });
    });

    describe('getAllConcepts', () => {
        it('returns unique concepts across all macros', () => {
            const result = getAllConcepts();
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('returns all concepts without duplicates', () => {
            const result = getAllConcepts();
            const uniqueCheck = new Set(result);
            expect(uniqueCheck.size).toBe(result.length);
        });

        it('includes concepts from VIVIR', () => {
            expect(getAllConcepts()).toContain('Alquiler');
            expect(getAllConcepts()).toContain('Supermercado');
            expect(getAllConcepts()).toContain('EPEC');
        });

        it('includes concepts from TRABAJAR', () => {
            expect(getAllConcepts()).toContain('Monotributo Mauro');
            expect(getAllConcepts()).toContain('Google Workspace');
        });

        it('includes concepts from DEBER', () => {
            expect(getAllConcepts()).toContain('Préstamo BNA');
        });

        it('includes concepts from DISFRUTAR', () => {
            expect(getAllConcepts()).toContain('Spotify');
            expect(getAllConcepts()).toContain('Asado');
        });
    });
});
