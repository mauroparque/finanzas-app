/**
 * Mapa Maestro de Clasificación Financiera (Spec v1.0)
 *
 * Estructura: Macro → Categoría → Concepto → Detalle (texto libre)
 *
 * Las "Unidades" (HOGAR, BRASIL, PROFESIONAL) son un atributo separado
 * que proporciona contexto geográfico/funcional, no jerarquía.
 */

export interface DetailOption {
    name: string;
}

export interface ConceptOption {
    name: string;
    details?: string[];  // Ejemplos/sugerencias
}

export interface CategoryOption {
    name: string;
    concepts: ConceptOption[];
}

export interface MacroConfig {
    name: 'VIVIR' | 'TRABAJAR' | 'DEBER' | 'DISFRUTAR';
    categories: CategoryOption[];
}

export const CLASSIFICATION_MAP: MacroConfig[] = [
    // ========================================================================
    // VIVIR — Gastos necesarios para sostener la vida cotidiana
    // ========================================================================
    {
        name: 'VIVIR',
        categories: [
            {
                name: 'Vivienda',
                concepts: [
                    {
                        name: 'Alquiler',
                        details: ['Alta Gracia', 'Balbuena Guillermo Ariel', 'Renovación contrato'],
                    },
                    {
                        name: 'Mantenimiento hogar',
                        details: ['Plomero', 'Electricista', 'Pintura', 'Arreglos varios'],
                    },
                    {
                        name: 'Honorarios inmobiliaria',
                        details: ['Comisión renovación', 'Gestión contrato'],
                    },
                ]
            },
            {
                name: 'Alimentación',
                concepts: [
                    {
                        name: 'Supermercado',
                        details: ['Coto', 'Jumbo', 'Carrefour', 'Hipermercado'],
                    },
                    {
                        name: 'Verdulería',
                        details: ['Frutas frescas', 'Verduras'],
                    },
                    {
                        name: 'Carnicería',
                        details: ['Cortes de carne'],
                    },
                    {
                        name: 'Panadería',
                        details: ['Pan', 'Facturas', 'Productos de panadería'],
                    },
                    {
                        name: 'Mayorista',
                        details: ['Becerra', 'Almacén mayorista'],
                    },
                    {
                        name: 'Agua',
                        details: ['Mite', 'Bidones de agua'],
                    },
                    {
                        name: 'Quesería / fiambrería',
                        details: ['Quesos', 'Fiambres', 'Delicatessen'],
                    },
                ]
            },
            {
                name: 'Servicios',
                concepts: [
                    {
                        name: 'EPEC',
                        details: ['Luz', 'Empresa Provincial de Energía de Córdoba'],
                    },
                    {
                        name: 'Cooperativa',
                        details: ['Agua potable', 'Cooperativa local'],
                    },
                    {
                        name: 'Personal',
                        details: ['Celular', 'Plan de telefonía móvil'],
                    },
                    {
                        name: 'Nuevo Liniers',
                        details: ['Expensas', 'Administración del complejo'],
                    },
                    {
                        name: 'BancoRoela',
                        details: ['Mantenimiento de cuenta bancaria'],
                    },
                    {
                        name: 'Condominio',
                        details: ['Brasil', 'Balneário Camboriú', 'Administración del edificio'],
                    },
                    {
                        name: 'Celesc',
                        details: ['Luz Brasil', 'Electricidad del inmueble'],
                    },
                    {
                        name: 'Ambiental',
                        details: ['Residuos Brasil', 'Recolección de residuos'],
                    },
                    {
                        name: 'Cable CCS',
                        details: ['Cable/internet Brasil', 'CCS Camboriú Cable System'],
                    },
                    {
                        name: 'IPTU',
                        details: ['Brasil', 'Impuesto predial territorial urbano'],
                    },
                ]
            },
            {
                name: 'Animales',
                concepts: [
                    {
                        name: 'Bocantino',
                        details: ['Comida de mascotas', 'Perros', 'Gatos'],
                    },
                    {
                        name: 'Veterinaria',
                        details: ['Consultas', 'Análisis', 'Tratamientos'],
                    },
                    {
                        name: 'Guardería',
                        details: ['Estadía de perros', 'Cuidado durante viajes'],
                    },
                    {
                        name: 'Vacunas y antiparasitarios',
                        details: ['Vacunación periódica', 'Desparasitación'],
                    },
                ]
            },
            {
                name: 'Salud',
                concepts: [
                    {
                        name: 'Médico / consulta',
                        details: ['Especialista', 'Consulta médica general'],
                    },
                    {
                        name: 'Medicamentos',
                        details: ['Farmacia', 'Medicamentos recetados', 'De venta libre', 'Vitaminas'],
                    },
                    {
                        name: 'Odontólogo',
                        details: ['Consultas', 'Tratamientos odontológicos'],
                    },
                    {
                        name: 'Obra social / prepaga',
                        details: ['Cuota mensual', 'Cobertura de salud'],
                    },
                ]
            },
            {
                name: 'Movilidad',
                concepts: [
                    {
                        name: 'Nafta',
                        details: ['Shell', 'YPF', 'Combustible para el Renault'],
                    },
                    {
                        name: 'Peajes',
                        details: ['Autopista', 'Peajes de viajes'],
                    },
                    {
                        name: 'Seguro auto',
                        details: ['Cuota mensual', 'Sancor Seguros'],
                    },
                    {
                        name: 'Mantenimiento auto',
                        details: ['Service periódico', 'Repuestos', 'Lavado', 'Neumáticos'],
                    },
                    {
                        name: 'Uber / remis',
                        details: ['Transporte alternativo'],
                    },
                ]
            },
            {
                name: 'Formación',
                concepts: [
                    {
                        name: 'Matrícula / arancel',
                        details: ['UNC', 'Carrera Ciencias de la Computación', 'Aranceles universitarios'],
                    },
                    {
                        name: 'Materiales de estudio',
                        details: ['Fotocopias', 'Impresiones', 'Apuntes', 'Cuadernos'],
                    },
                    {
                        name: 'Librería',
                        details: ['Material académico', 'Libros de estudio'],
                    },
                    {
                        name: 'Cursos / certificaciones',
                        details: ['Udemy', 'Coursera', 'Posgrados', 'Especializaciones'],
                    },
                ]
            },
        ]
    },

    // ========================================================================
    // TRABAJAR — Gastos necesarios para el ejercicio profesional
    // ========================================================================
    {
        name: 'TRABAJAR',
        categories: [
            {
                name: 'Obligaciones fiscales',
                concepts: [
                    {
                        name: 'Monotributo Mauro',
                        details: ['Cuota mensual', 'Profesional autónomo'],
                    },
                    {
                        name: 'Monotributo Agos',
                        details: ['Cuota mensual', 'Profesional autónoma'],
                    },
                    {
                        name: 'Honorarios contador',
                        details: ['Asesoría fiscal', 'Liquidación monotributos'],
                    },
                ]
            },
            {
                name: 'Seguros y servicios profesionales',
                concepts: [
                    {
                        name: 'Mala Praxis Mauro',
                        details: ['Seguro de responsabilidad profesional', 'Cuota mensual'],
                    },
                    {
                        name: 'Mala Praxis Agos',
                        details: ['Seguro de responsabilidad profesional', 'Cuota mensual'],
                    },
                    {
                        name: 'RESMA',
                        details: ['Servicio profesional', 'Derivación de pacientes', 'Formaciones clínicas'],
                    },
                ]
            },
            {
                name: 'Infraestructura digital',
                concepts: [
                    {
                        name: 'Google Workspace',
                        details: ['Suite Google', 'Consultorio profesional', 'Gmail, Drive, Docs'],
                    },
                    {
                        name: 'Dominio Lumen',
                        details: ['lumensaludmental.com', 'Renovación anual'],
                    },
                    {
                        name: 'Google Cloud / Hetzner',
                        details: ['Infraestructura servidor', 'Self-hosting', 'n8n, PostgreSQL'],
                    },
                ]
            },
            {
                name: 'Equipamiento profesional',
                concepts: [
                    {
                        name: 'Insumos consultorio',
                        details: ['Material clínico', 'Papelería profesional', 'Elementos de sesión'],
                    },
                    {
                        name: 'Tecnología laboral',
                        details: ['PC', 'Pantallas', 'Periféricos', 'Dispositivos de trabajo'],
                    },
                    {
                        name: 'Librería laboral',
                        details: ['Libros técnicos', 'DSM', 'CIE', 'Manuales diagnósticos'],
                    },
                ]
            },
        ]
    },

    // ========================================================================
    // DEBER — Compromisos financieros ya contraídos
    // ========================================================================
    {
        name: 'DEBER',
        categories: [
            {
                name: 'Préstamos',
                concepts: [
                    {
                        name: 'Préstamo BNA',
                        details: ['Banco Nación Argentina', 'Cuota fija mensual'],
                    },
                    {
                        name: 'Préstamo ANSES',
                        details: ['ANSES CRECER', 'Crédito bancario'],
                    },
                    {
                        name: 'Préstamo personal',
                        details: ['PF 2261551771', 'PF 1753009581', 'Identificados por número'],
                    },
                    {
                        name: 'Préstamo BBVA',
                        details: ['Cuota mensual', 'Estado pendiente de confirmar'],
                    },
                ]
            },
            {
                name: 'Deudas',
                concepts: [
                    {
                        name: 'Deuda AGIP',
                        details: ['CABA', 'Planes de pago', 'Obligaciones impositivas'],
                    },
                    {
                        name: 'Multas / infracciones',
                        details: ['Tránsito', 'Resolución administrativa'],
                    },
                ]
            },
        ]
    },

    // ========================================================================
    // DISFRUTAR — Gastos discrecionales
    // ========================================================================
    {
        name: 'DISFRUTAR',
        categories: [
            {
                name: 'Ocio y salidas',
                concepts: [
                    {
                        name: 'Empanadas',
                        details: ['Salidas', 'Pedidos'],
                    },
                    {
                        name: 'Hamburguesas',
                        details: ['Comer afuera', 'Salidas'],
                    },
                    {
                        name: 'Cervezas / gaseosas',
                        details: ['Bebidas para salidas', 'Reuniones en casa'],
                    },
                    {
                        name: 'Asado',
                        details: ['Familiares', 'Con amigos', 'Carne, bebidas, carbón'],
                    },
                    {
                        name: 'Heladería / café',
                        details: ['Salidas', 'Confitería'],
                    },
                    {
                        name: 'Restaurantes / otros',
                        details: ['Salidas gastronómicas', 'Entretenimiento'],
                    },
                ]
            },
            {
                name: 'Compras personales',
                concepts: [
                    {
                        name: 'Regalos',
                        details: ['Familiares', 'Amigos', 'Conocidos'],
                    },
                    {
                        name: 'Peluquería / estética',
                        details: ['Barbería', 'Cuidado personal estético'],
                    },
                    {
                        name: 'Ropa y calzado',
                        details: ['Indumentaria personal'],
                    },
                    {
                        name: 'Librería personal',
                        details: ['Sin propósito académico', 'Cuadernos', 'Stickers', 'Papelería'],
                    },
                    {
                        name: 'Consumibles varios',
                        details: ['Datos móviles', 'Artículos de bazar', 'Misceláneos'],
                    },
                ]
            },
            {
                name: 'Suscripciones',
                concepts: [
                    {
                        name: 'Spotify',
                        details: ['Música streaming', 'Cuota mensual'],
                    },
                    {
                        name: 'Streaming',
                        details: ['Netflix', 'Plataformas de contenido', 'Audiovisual'],
                    },
                    {
                        name: 'Otras apps personales',
                        details: ['Bienestar', 'Productividad', 'Entretenimiento'],
                    },
                ]
            },
        ]
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getMacroConfig = (macroName: string): MacroConfig | undefined => {
    return CLASSIFICATION_MAP.find((m) => m.name === macroName);
};

export const getCategoriesForMacro = (macroName: string): CategoryOption[] => {
    return getMacroConfig(macroName)?.categories || [];
};

export const getConceptsForCategory = (macroName: string, categoryName: string): ConceptOption[] => {
    const macro = getMacroConfig(macroName);
    if (!macro) return [];
    const category = macro.categories.find((c) => c.name === categoryName);
    return category?.concepts || [];
};

export const getDetailsForConcept = (
    macroName: string,
    categoryName: string,
    conceptName: string
): string[] => {
    const concepts = getConceptsForCategory(macroName, categoryName);
    const concept = concepts.find((c) => c.name === conceptName);
    return concept?.details || [];
};

// Get all macros
export const getMacros = (): string[] => {
    return CLASSIFICATION_MAP.map((m) => m.name);
};

// Get all categories across all macros
export const getAllCategories = (): string[] => {
    return Array.from(
        new Set(CLASSIFICATION_MAP.flatMap((m) => m.categories.map((c) => c.name)))
    );
};

// Get all concepts across all macros
export const getAllConcepts = (): string[] => {
    return Array.from(
        new Set(
            CLASSIFICATION_MAP.flatMap((m) =>
                m.categories.flatMap((c) => c.concepts.map((p) => p.name))
            )
        )
    );
};

export default CLASSIFICATION_MAP;
