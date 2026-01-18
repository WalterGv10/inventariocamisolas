// Type definitions for the inventory management system

/**
 * Jersey Model Definition.
 * Represents the base product information (Team + Color + Media).
 * 
 * ---
 * 
 * Definición del Modelo de Camisola.
 * Representa la información base del producto (Equipo + Color + Multimedia).
 */
export interface Camisola {
    id: string;
    equipo: string;
    color: string;
    image_url?: string;
    gallery_urls?: string[];
    video_url?: string;
    created_at?: string;
}

/**
 * Inventory Item Definition.
 * Tracks quantities for a specific Size of a Jersey Model.
 * 
 * ---
 * 
 * Definición de Ítem de Inventario.
 * Rastrea cantidades para una Talla específica de un Modelo de Camisola.
 */
export interface InventarioItem {
    id: number;
    camisola_id: string;
    talla: 'S' | 'M' | 'L' | 'XL';
    cantidad: number; // Stock disponible
    muestras: number; // En muestra
    vendidas: number; // Unidades vendidas
    updated_at?: string;
}

/**
 * Inventory Movement Record.
 * Logs historical changes to inventory counts.
 * 
 * ---
 * 
 * Registro de Movimiento de Inventario.
 * Registra cambios históricos en los conteos de inventario.
 */
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

/**
 * Combined view interface for displaying inventory with product details.
 * 
 * ---
 * 
 * Interfaz de vista combinada para mostrar inventario con detalles del producto.
 */
export interface InventarioConDetalles extends InventarioItem {
    equipo: string;
    color: string;
    image_url?: string;
    gallery_urls?: string[];
    video_url?: string;
}

/**
 * Filter state interface.
 * 
 * ---
 * 
 * Interfaz de estado de filtros.
 */
export interface FiltrosInventario {
    equipo: string;
    color: string;
    talla: string;
}
