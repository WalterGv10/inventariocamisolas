import type { InventarioConDetalles } from '../types';
import { useMovimientos } from '../hooks/useMovimientos';
import styles from './InventarioTable.module.css';

interface InventarioTableProps {
    inventario: InventarioConDetalles[];
    loading: boolean;
}

export function InventarioTable({ inventario, loading }: InventarioTableProps) {
    const { updateInventarioDirect, moveInventory } = useMovimientos();

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando inventario...</p>
            </div>
        );
    }

    const handleUpdate = async (id: number, field: 'cantidad' | 'muestras' | 'vendidas', delta: number) => {
        await updateInventarioDirect(id, field, delta);
    };

    const handleMove = async (id: number, from: 'cantidad' | 'muestras' | 'vendidas', to: 'cantidad' | 'muestras' | 'vendidas', amount: number) => {
        const result = await moveInventory(id, from, to, amount);
        if (!result.success) {
            alert(result.error);
        }
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>EQUIPO</th>
                            <th>DETALLES</th>
                            <th className={styles.centerCol}>📦 STOCK (DISPONIBLE)</th>
                            <th className={styles.centerCol}>🔍 EN MUESTRA</th>
                            <th className={styles.centerCol}>💰 VENDIDAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventario.map((item) => (
                            <tr key={item.id}>
                                <td className={styles.teamCell}>
                                    <span className={styles.teamName}>{item.equipo}</span>
                                </td>
                                <td className={styles.detailsCell}>
                                    <div className={styles.detailsWrapper}>
                                        <span className={styles.colorBadge}>{item.color}</span>
                                        <span className={styles.tallaBadge}>{item.talla}</span>
                                    </div>
                                </td>

                                {/* COLUMNA STOCK */}
                                <td className={styles.controlCell}>
                                    <div className={styles.hubWrapper}>
                                        <div className={styles.mainControls}>
                                            <button onClick={() => handleUpdate(item.id, 'cantidad', -1)}>-</button>
                                            <div className={styles.stockDisplay}>
                                                <span className={styles.count}>{item.cantidad}</span>
                                            </div>
                                            <button onClick={() => handleUpdate(item.id, 'cantidad', 1)}>+</button>
                                        </div>
                                        <div className={styles.transferActions}>
                                            <button
                                                className={styles.xferBtn}
                                                onClick={() => handleMove(item.id, 'cantidad', 'muestras', 1)}
                                                title="Mover 1 a Muestra"
                                                disabled={item.cantidad <= 0}
                                            >
                                                Muestra →
                                            </button>
                                            <button
                                                className={styles.xferBtn}
                                                onClick={() => handleMove(item.id, 'cantidad', 'vendidas', 1)}
                                                title="Mover 1 a Vendidas"
                                                disabled={item.cantidad <= 0}
                                            >
                                                Vender →
                                            </button>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUMNA MUESTRAS */}
                                <td className={`${styles.controlCell} ${styles.muestraBg}`}>
                                    <div className={styles.hubWrapper}>
                                        <div className={styles.mainControls}>
                                            <button onClick={() => handleUpdate(item.id, 'muestras', -1)}>-</button>
                                            <div className={`${styles.stockDisplay} ${styles.blueGlow}`}>
                                                <span className={styles.count}>{item.muestras}</span>
                                            </div>
                                            <button onClick={() => handleUpdate(item.id, 'muestras', 1)}>+</button>
                                        </div>
                                        <div className={styles.transferActions}>
                                            <button
                                                className={styles.xferBtn}
                                                onClick={() => handleMove(item.id, 'muestras', 'cantidad', 1)}
                                                title="Regresar a Stock"
                                                disabled={item.muestras <= 0}
                                            >
                                                ← Stock
                                            </button>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUMNA VENDIDAS */}
                                <td className={`${styles.controlCell} ${styles.ventaBg}`}>
                                    <div className={styles.hubWrapper}>
                                        <div className={styles.mainControls}>
                                            <button onClick={() => handleUpdate(item.id, 'vendidas', -1)}>-</button>
                                            <div className={`${styles.stockDisplay} ${styles.goldGlow}`}>
                                                <span className={styles.count}>{item.vendidas}</span>
                                            </div>
                                            <button onClick={() => handleUpdate(item.id, 'vendidas', 1)}>+</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {inventario.length === 0 && (
                <div className={styles.emptyTable}>
                    <p>No se encontraron productos en el inventario.</p>
                </div>
            )}
        </div>
    );
}
