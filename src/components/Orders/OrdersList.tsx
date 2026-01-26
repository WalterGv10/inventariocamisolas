import React from 'react';
import { usePedidos } from '../../hooks/usePedidos';
import { useMovimientos } from '../../hooks/useMovimientos';
import { toast } from 'sonner';
import styles from './OrdersList.module.css';

interface OrdersListProps {
    onNewOrder: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ onNewOrder }) => {
    const { pedidos, loading, error, updateEstadoPedido, confirmarPedido } = usePedidos();
    const { createMovimiento } = useMovimientos();

    const handleStatusChange = async (id: number, status: any) => {
        if (!window.confirm(`¿Confirmar cambio de estado a ${status.toUpperCase()}?`)) return;
        await updateEstadoPedido(id, status);
    };

    const handleConfirmarAction = async (id: number, tipo: string) => {
        const verb = tipo === 'abastecimiento' ? 'recibido' :
            tipo === 'despacho' ? 'despachado' : 'entregado';

        const fecha = window.prompt(`¿En qué fecha se ${verb}? (YYYY-MM-DD)`, new Date().toISOString().split('T')[0]);
        if (!fecha) return;

        const res = await confirmarPedido(id, fecha, createMovimiento);
        if (res.success) {
            toast.success(`Pedido ${verb} correctamente`);
        } else {
            toast.error('Error: ' + res.error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando pedidos...</div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

    // Filter? currently showing all sorted by date desc from backend
    // Maybe grouped by status?

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>📦 Gestión de Pedidos</div>
                <button
                    className="primary-button"
                    style={{ backgroundColor: '#8b5cf6' }}
                    onClick={onNewOrder}
                >
                    + Nuevo Pedido
                </button>
            </div>

            {pedidos.length === 0 ? (
                <div className={styles.emptyState}>
                    <h3>No hay pedidos registrados</h3>
                    <p>Crea el primer pedido para comenzar.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {pedidos.map(pedido => (
                        <div key={pedido.id} className={styles.card}>
                            <div className={styles.statusInfo}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    #{pedido.id} • {new Date(pedido.fecha_pedido).toLocaleDateString()}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className={styles.typeBadge} data-type={pedido.tipo}>
                                        {pedido.tipo === 'abastecimiento' ? '📥 ABAST' :
                                            pedido.tipo === 'despacho' ? '📤 DESP' : '💰 VENTA'}
                                    </span>
                                    <span className={`${styles.badge} ${styles[pedido.estado]}`}>
                                        {pedido.estado.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.clientName}>{pedido.cliente_nombre}</div>
                            {pedido.cliente_contacto && (
                                <div className={styles.clientContact}>📞 {pedido.cliente_contacto}</div>
                            )}

                            <div className={styles.itemsList}>
                                {pedido.items?.map((item, idx) => (
                                    <div key={idx} className={styles.itemRow}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: '#f8fafc' }}>{item.cantidad}x</span> {item.descripcion}
                                        </div>
                                        <div style={{ color: '#94a3b8' }}>Q{item.cantidad * item.precio_unitario}</div>
                                    </div>
                                ))}
                            </div>

                            {pedido.notas && (
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '1rem' }}>
                                    "{pedido.notas}"
                                </div>
                            )}

                            <div className={styles.totalSection}>
                                <div className={styles.totalLabel}>Total del Pedido</div>
                                <div className={styles.totalValue}>Q{pedido.total}</div>
                            </div>

                            {pedido.estado.startsWith('pendiente') && (
                                <div className={styles.actions}>
                                    <button
                                        className={`${styles.actionButton} ${styles.complete}`}
                                        onClick={() => handleConfirmarAction(pedido.id, pedido.tipo)}
                                    >
                                        {pedido.tipo === 'abastecimiento' ? '✓ Recibir' :
                                            pedido.tipo === 'despacho' ? '✓ Despachar' : '✓ Entregar'}
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.cancel}`}
                                        onClick={() => handleStatusChange(pedido.id, 'cancelado')}
                                    >
                                        ✕ Cancelar
                                    </button>
                                </div>
                            )}

                            {pedido.fecha_confirmacion && (
                                <div className={styles.confirmationLog}>
                                    {pedido.estado === 'recibido' ? '📥 Recibido el: ' :
                                        pedido.estado === 'despachado' ? '📤 Despachado el: ' :
                                            '✅ Entregado el: '}
                                    {new Date(pedido.fecha_confirmacion).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
