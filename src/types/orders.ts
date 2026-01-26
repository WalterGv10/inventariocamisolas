export interface Pedido {
    id: number;
    cliente_nombre: string;
    cliente_contacto?: string;
    fecha_pedido: string;
    fecha_entrega?: string;
    fecha_confirmacion?: string;
    tipo: 'venta' | 'abastecimiento' | 'despacho';
    estado: 'pendiente' | 'entregado' | 'cancelado' | 'pendiente_recibir' | 'recibido' | 'pendiente_despacho' | 'despachado';
    total: number;
    notas?: string;
    created_at?: string;
    items?: ItemPedido[];
}

export interface ItemPedido {
    id?: number;
    pedido_id?: number;
    tipo: 'inventario' | 'libre';
    camisola_id?: string | null;
    talla?: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
}
