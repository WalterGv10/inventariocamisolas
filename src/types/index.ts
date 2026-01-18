// Type definitions for the inventory management system

export interface Camisola {
    id: string;
    equipo: string;
    color: string;
    created_at?: string;
}

export interface InventarioItem {
    id: number;
    camisola_id: string;
    talla: 'S' | 'M' | 'L' | 'XL';
    cantidad: number; // Stock disponible
    muestras: number; // En muestra
    vendidas: number; // Unidades vendidas
    updated_at?: string;
}

export interface MovimientoInventario {
    id?: number;
    camisola_id: string;
    talla: string;
    tipo: 'entrada' | 'salida' | 'a_muestra' | 'venta';
    cantidad: number;
    fecha: string;
    descripcion?: string;
    created_at?: string;
}

// Combined view interface for displaying inventory with product details
export interface InventarioConDetalles extends InventarioItem {
    equipo: string;
    color: string;
}

// Filter state interface
export interface FiltrosInventario {
    equipo: string;
    color: string;
    talla: string;
}
