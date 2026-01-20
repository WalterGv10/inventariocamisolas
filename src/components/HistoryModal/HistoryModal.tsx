import React, { useEffect, useState } from 'react';
import { useMovimientos } from '../../hooks/useMovimientos';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import styles from './HistoryModal.module.css';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
    const { getRecentMovements, clearAllMovements } = useMovimientos();
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        setLoading(true);
        const { success, data } = await getRecentMovements(100);
        if (success && data) {
            setMovements(data);
        }
        setLoading(false);
    };

    const handleClearHistory = async () => {
        if (!window.confirm('⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará PERMANENTEMENTE todo el registro de movimientos.\nEsta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.email) {
            const result = await clearAllMovements(user.email);
            if (result.success) {
                setMovements([]);
                toast.success('Historial borrado correctamente');
            } else {
                toast.error('Error: ' + result.error);
            }
        } else {
            toast.error('Error: No se pudo identificar al usuario.');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        📜 Registro de Movimientos
                        {loading && <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '1rem' }}>Sincronizando...</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            onClick={handleClearHistory}
                            className={styles.closeButton}
                            style={{ width: 'auto', padding: '0 1rem', fontSize: '0.85rem' }}
                            title="Borrar Todo el Historial"
                        >
                            🗑️ Limpiar
                        </button>
                        <button className={styles.closeButton} onClick={onClose}>×</button>
                    </div>
                </div>

                <div className={styles.content}>
                    <table className={styles.tableContainer}>
                        <thead>
                            <tr>
                                <th>Fecha y Usuario</th>
                                <th>Operación</th>
                                <th>Artículo</th>
                                <th>Cantidad</th>
                                <th>Detalles / Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const groupedMovements: any[] = [];
                                let currentBatch: any[] = [];

                                movements.forEach((m, index) => {
                                    const prev = movements[index - 1];
                                    const isBatch = m.descripcion && m.descripcion.startsWith('Mov. Lote:');

                                    const isSameBatch = prev &&
                                        prev.descripcion === m.descripcion &&
                                        prev.tipo === m.tipo &&
                                        prev.fecha === m.fecha &&
                                        (Math.abs(new Date(prev.created_at || '').getTime() - new Date(m.created_at || '').getTime()) < 2000);

                                    if (isBatch) {
                                        if (isSameBatch) {
                                            currentBatch.push(m);
                                        } else {
                                            if (currentBatch.length > 0) {
                                                groupedMovements.push({ isGroup: true, items: currentBatch });
                                            }
                                            currentBatch = [m];
                                        }
                                    } else {
                                        if (currentBatch.length > 0) {
                                            groupedMovements.push({ isGroup: true, items: currentBatch });
                                            currentBatch = [];
                                        }
                                        groupedMovements.push(m);
                                    }
                                });
                                if (currentBatch.length > 0) groupedMovements.push({ isGroup: true, items: currentBatch });

                                return groupedMovements.map((item, idx) => {
                                    if (item.isGroup) {
                                        return <BatchRow key={`batch-${idx}`} items={item.items} />;
                                    }
                                    return <SingleRow key={item.id} m={item} />;
                                });
                            })()}
                            {movements.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>📂</div>
                                            No hay movimientos registrados.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SingleRow = ({ m, isChild = false }: { m: any, isChild?: boolean }) => (
    <tr className={isChild ? styles.childRow : ''}>
        <td data-label="Fecha/Usuario">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: isChild ? '#64748b' : '#94a3b8' }}>
                    {isChild ? '↳ ' : ''}{new Date(m.created_at || m.fecha).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                    👤 {m.usuario ? m.usuario.split('@')[0] : 'Sistema'}
                </span>
            </div>
        </td>
        <td data-label="Operación">
            <span className={`${styles.badge} ${styles[m.tipo]}`}>
                {m.tipo === 'entrada' ? 'INGRESO' :
                    m.tipo === 'salida' ? 'EGRESO' :
                        m.tipo === 'venta' ? 'VENTA' :
                            m.tipo === 'a_muestra' ? 'MUESTRA' : m.tipo.toUpperCase()}
            </span>
        </td>
        <td data-label="Artículo">
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {m.camisolas?.equipo}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {m.camisolas?.color} • Talla: <strong>{m.talla}</strong>
            </div>
        </td>
        <td data-label="Cantidad">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {m.cantidad} un.
                </span>
                {m.precio_venta && (
                    <span style={{ fontSize: '0.8rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Q{m.precio_venta}
                    </span>
                )}
            </div>
        </td>
        <td data-label="Detalles">
            <div style={{ maxWidth: '250px' }}>
                {m.descripcion && <div style={{ fontSize: '0.85rem' }}>{m.descripcion}</div>}
                {m.fecha_entrega && (
                    <div style={{ color: '#fbbf24', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>
                        📅 Entrega: {m.fecha_entrega}
                    </div>
                )}
            </div>
        </td>
    </tr>
);

const BatchRow = ({ items }: { items: any[] }) => {
    const [expanded, setExpanded] = useState(false);
    const first = items[0];
    const totalQty = items.reduce((acc, curr) => acc + curr.cantidad, 0);
    const totalVenta = items.reduce((acc, curr) => acc + (curr.precio_venta || 0), 0);

    return (
        <>
            <tr className={styles.batchRow} onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
                <td data-label="Fecha/Usuario">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={styles.toggleBtn} style={{ marginRight: '0.75rem' }}>
                            {expanded ? '−' : '+'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {new Date(first.created_at || first.fecha).toLocaleString()}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                📦 Operación por Lote
                            </span>
                        </div>
                    </div>
                </td>
                <td data-label="Operación">
                    <span className={`${styles.badge} ${styles[first.tipo]}`}>
                        LOTE {first.tipo === 'entrada' ? 'INGRESO' : first.tipo.toUpperCase()}
                    </span>
                </td>
                <td data-label="Artículo">
                    <div style={{ fontWeight: 600 }}>
                        {items.length} ítems procesados
                    </div>
                    {totalVenta > 0 && <div style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Total: Q{totalVenta}</div>}
                </td>
                <td data-label="Cantidad">
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
                        {totalQty} un.
                    </div>
                </td>
                <td data-label="Detalles">
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                        Click para {expanded ? 'contraer' : 'ver detalles'}
                    </div>
                </td>
            </tr>
            {expanded && items.map(m => <SingleRow key={m.id} m={m} isChild />)}
        </>
    );
};
