import React, { useEffect, useState } from 'react';
import { useMovimientos } from '../../hooks/useMovimientos';
import { supabase } from '../../lib/supabase'; // Import supabase
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
        // Fetch last 100 movements for the log view
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
                setMovements([]); // Clear local state
            } else {
                alert('Error: ' + result.error);
            }
        } else {
            alert('Error: No se pudo identificar al usuario.');
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
                        {loading && <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '1rem' }}>Cargando...</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={handleClearHistory}
                            className={styles.closeButton}
                            style={{ color: '#f87171', fontSize: '1rem', border: '1px solid #ef4444', height: '32px', display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: '6px' }}
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
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Detalle</th>
                                <th>Cantidad</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // 1. Group movements by batch logic
                                // Logic: Group by exact date/time (or created_at) AND description being 'Mov. Lote: ...'
                                const groupedMovements: any[] = [];
                                let currentBatch: any[] = [];

                                movements.forEach((m, index) => {
                                    const prev = movements[index - 1];
                                    const isBatch = m.descripcion && m.descripcion.startsWith('Mov. Lote:');

                                    // Check if current matches previous to continue batch
                                    // Using created_at or just proximity in the list since we fetch ordered
                                    // If exact timestamp match is too strict, we can rely on order + description + type
                                    const isSameBatch = prev &&
                                        prev.descripcion === m.descripcion &&
                                        prev.tipo === m.tipo &&
                                        prev.fecha === m.fecha &&
                                        // Fallback for created_at if available to be precise, otherwise just grouping sequential same-type logs
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
                                // Push remaining
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
                                    <td colSpan={5} className={styles.emptyState}>
                                        No hay movimientos registrados.
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
    <tr style={isChild ? { background: '#1e293b50', marginTop: 0, borderRadius: 0, borderTop: 'none' } : {}}>
        <td style={{ whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '0.75rem', paddingLeft: isChild ? '1rem' : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{isChild ? '↳ ' : ''}{new Date(m.fecha).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    👤 {m.usuario ? m.usuario.split('@')[0] : 'Sistema / Antiguo'}
                </div>
            </div>
        </td>
        <td>
            <span className={`${styles.badge} ${styles[m.tipo]}`}>
                {m.tipo === 'entrada' ? 'INGRESO' :
                    m.tipo === 'salida' ? 'EGRESO' :
                        m.tipo === 'venta' ? 'VENTA' :
                            m.tipo === 'a_muestra' ? 'MUESTRA' : m.tipo.toUpperCase()}
            </span>
        </td>
        <td>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {m.camisolas?.equipo}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {m.camisolas?.color}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Talla: <strong>{m.talla}</strong>
            </div>
        </td>
        <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {m.cantidad} un.
                </span>
                {m.precio_venta && (
                    <span style={{ fontSize: '0.85rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Q{m.precio_venta}
                    </span>
                )}
            </div>
        </td>
        <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {m.descripcion && <div>📝 {m.descripcion}</div>}
            {m.fecha_entrega && (
                <div style={{ color: '#fbbf24', marginTop: '2px' }}>
                    📅 Entregar: {m.fecha_entrega}
                </div>
            )}
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
            <tr
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: 'pointer', background: expanded ? '#1e293b' : 'transparent', borderLeft: '4px solid #3b82f6', marginBottom: expanded ? 0 : '0.5rem' }}
            >
                <td style={{ whiteSpace: 'nowrap', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', marginRight: '0.5rem', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            {expanded ? '[-]' : '[+]'}
                        </button>
                        <span>{new Date(first.fecha).toLocaleDateString()}</span>
                    </div>
                </td>
                <td>
                    <span className={`${styles.badge} ${styles[first.tipo]}`}>
                        LOTE {first.tipo === 'entrada' ? 'INGRESO' : first.tipo.toUpperCase()}
                    </span>
                </td>
                <td colSpan={2}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                        📦 {items.length} ítems procesados
                    </div>
                    {totalVenta > 0 && <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginTop: '2px' }}>Total Venta: Q{totalVenta}</div>}
                </td>
                <td>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total: {totalQty} un.</div>
                </td>
            </tr>
            {expanded && items.map(m => <SingleRow key={m.id} m={m} isChild />)}
        </>
    );
};
