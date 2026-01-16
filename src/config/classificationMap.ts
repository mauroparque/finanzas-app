// Mapa Maestro de Clasificación Financiera
// Este archivo define la jerarquía completa para clasificación de transacciones.

export interface ConceptOption {
    name: string;
    details: string[]; // Sugerencias de detalle
}

export interface CategoryOption {
    name: string;
    concepts: ConceptOption[];
}

export interface UnitConfig {
    name: 'HOGAR' | 'PROFESIONAL' | 'BRASIL';
    categories: CategoryOption[];
}

export const CLASSIFICATION_MAP: UnitConfig[] = [
    {
        name: 'HOGAR',
        categories: [
            {
                name: 'Vivienda y Vida Diaria',
                concepts: [
                    { name: 'Alquiler', details: ['Balbuena Guillermo Ariel', 'Sanchez Facundo'] },
                    { name: 'Impuestos', details: ['Cooperativa Horizonte', 'Banco Roela'] },
                    { name: 'Servicios', details: ['EPEC', 'Ecogas', 'Personal'] },
                    { name: 'Abastecimiento', details: ['Carnicería', 'Verdulería', 'Pescadería', 'Panadería', 'Supermercado'] },
                    { name: 'Mascotas', details: ['Bocantino', 'Veterinaria'] },
                    { name: 'Equipamiento', details: ['Electrodomésticos', 'Arreglos', 'Muebles'] },
                ]
            },
            {
                name: 'Auto',
                concepts: [
                    { name: 'Seguros', details: ['Sancor Seguros'] },
                    { name: 'Transporte', details: ['Nafta', 'Peajes'] },
                ]
            },
            {
                name: 'Personal',
                concepts: [
                    { name: 'Social y Salidas', details: ['Comidas/Salidas', 'Cine', 'Teatro', 'Juntada con amigos'] },
                    { name: 'Cuidado y Salud', details: ['Peluquería', 'Farmacia', 'Consulta médica'] },
                    { name: 'Compras personales', details: ['Ropa', 'Calzado', 'Tecnología'] },
                    { name: 'Viajes y Escapadas', details: ['Hoteles', 'Pasajes', 'Peajes de viaje', 'Gastos vacaciones'] },
                    { name: 'Ahorros e Inversión', details: ['Transferencias a cuentas de inversión', 'Compra de dólares', 'Plazo fijo'] },
                ]
            },
            {
                name: 'Pasivos',
                concepts: [
                    { name: 'Cuota Préstamo', details: ['Préstamo BNA', 'Préstamo ANSES', 'Préstamo BBVA'] },
                    { name: 'Pago Tarjeta', details: ['Visa BNA', 'Mastercard BNA', 'Visa BBVA'] },
                ]
            }
        ]
    },
    {
        name: 'PROFESIONAL',
        categories: [
            {
                name: 'Infraestructura y Difusión',
                concepts: [
                    { name: 'Digital', details: ['Hetzner', 'Google Workspace', 'Porkbun'] },
                    { name: 'Marketing', details: ['Red de Salud Mental Argentina', 'Google Ads', 'Meta'] },
                ]
            },
            {
                name: 'Cargas Profesionales',
                concepts: [
                    { name: 'Cargas profesionales', details: ['Monotributo', 'Caja de Psicólogos', 'Mala Praxis'] },
                ]
            },
            {
                name: 'Espacio Físico',
                concepts: [
                    { name: 'Alquiler Consultorio', details: ['(Nombre propietario/inmobiliaria)'] },
                ]
            }
        ]
    },
    {
        name: 'BRASIL',
        categories: [
            {
                name: 'Gestión de Inmueble',
                concepts: [
                    { name: 'Tributario', details: ['IPTU', 'Tasas Ambientales'] },
                    { name: 'Operativo', details: ['Condominio', 'Mantenimiento', 'CELESC'] },
                ]
            }
        ]
    }
];

// Helper functions
export const getUnitConfig = (unitName: string) => CLASSIFICATION_MAP.find(u => u.name === unitName);
export const getCategoriesForUnit = (unitName: string) => getUnitConfig(unitName)?.categories || [];
export const getConceptsForCategory = (unitName: string, categoryName: string) => {
    const unit = getUnitConfig(unitName);
    const category = unit?.categories.find(c => c.name === categoryName);
    return category?.concepts || [];
};
export const getDetailsForConcept = (unitName: string, categoryName: string, conceptName: string) => {
    const concepts = getConceptsForCategory(unitName, categoryName);
    const concept = concepts.find(c => c.name === conceptName);
    return concept?.details || [];
};
