import { useMemo, useState } from 'react';
import type { InventarioConDetalles, Camisola } from '../types';
import styles from './Dashboard.module.css';

interface DashboardProps {
    inventario: InventarioConDetalles[];
    camisolas: Camisola[];
}

interface TeamStats {
    equipo: string;
    total: number;
    porTalla: Record<string, number>;
    porColor: Record<string, number>;
}

type DashboardMode = 'stock' | 'muestras' | 'vendidas';

export function Dashboard({ inventario, camisolas }: DashboardProps) {
    const [mode, setMode] = useState<DashboardMode>('stock');

    const teamStats = useMemo(() => {
        const stats: Record<string, TeamStats> = {};

        // 1. Initialize structure with ALL available teams and colors
        camisolas.forEach(c => {
            if (!stats[c.equipo]) {
                stats[c.equipo] = {
                    equipo: c.equipo,
                    total: 0,
                    porTalla: { S: 0, M: 0, L: 0, XL: 0 },
                    porColor: {},
                };
            }
            // Ensure color key exists even with 0
            if (!stats[c.equipo].porColor[c.color]) {
                stats[c.equipo].porColor[c.color] = 0;
            }
        });

        // 2. Fill with inventory data
        inventario.forEach((item) => {
            // Safety check in case inventory has a team not in camisolas (unlikely but safe)
            if (!stats[item.equipo]) {
                stats[item.equipo] = {
                    equipo: item.equipo,
                    total: 0,
                    porTalla: { S: 0, M: 0, L: 0, XL: 0 },
                    porColor: {},
                };
            }

            const team = stats[item.equipo];
            const count = mode === 'stock' ? item.cantidad : mode === 'muestras' ? item.muestras : item.vendidas;

            team.total += count;

            if (item.talla in team.porTalla) {
                team.porTalla[item.talla] += count;
            }

            if (item.color) {
                team.porColor[item.color] = (team.porColor[item.color] || 0) + count;
            }
        });

        return Object.values(stats).sort((a, b) => b.total - a.total);
    }, [inventario, camisolas, mode]);

    const modeLabels = {
        stock: '📦 DISPONIBLES',
        muestras: '🔍 EN MUESTRA',
        vendidas: '💰 VENDIDAS'
    };

    return (
        <div className={styles.dashboardWrapper}>
            <div className={styles.tabSelector}>
                {(['stock', 'muestras', 'vendidas'] as DashboardMode[]).map((m) => (
                    <button
                        key={m}
                        className={`${styles.tabButton} ${mode === m ? styles.activeTab : ''} ${styles[m]}`}
                        onClick={() => setMode(m)}
                    >
                        {modeLabels[m]}
                    </button>
                ))}
            </div>

            <div className={styles.dashboardGrid}>
                {teamStats.map((team) => (
                    <div key={team.equipo} className={`${styles.teamCard} ${styles[mode + 'Card']}`}>
                        <div className={styles.teamHeader}>
                            <h3 className={styles.teamTitle}>{team.equipo}</h3>
                            <span className={styles.teamTotalBadge}>{team.total} <small>unid.</small></span>
                        </div>

                        <div className={styles.statsLayout}>
                            {/* Tallas */}
                            <div className={styles.section}>
                                <span className={styles.sectionLabel}>Distribución por Talla</span>
                                <div className={styles.sizeRow}>
                                    {Object.entries(team.porTalla).map(([talla, cantidad]) => (
                                        <div key={talla} className={`${styles.sizeBox} ${cantidad > 0 ? styles.hasStock : ''}`}>
                                            <span className={styles.label}>{talla}</span>
                                            <span className={styles.value}>{cantidad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Colores */}
                            <div className={styles.section}>
                                <span className={styles.sectionLabel}>Distribución por Color</span>
                                <div className={styles.colorPillsSimple}>
                                    {Object.entries(team.porColor).map(([color, cantidad]) => (
                                        <div key={color} className={styles.colorPillMini}>
                                            <span className={styles.pillColorName}>{color}:</span>
                                            <span className={styles.pillColorValue}>{cantidad}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {teamStats.length === 0 && (
                    <div className={styles.emptyState}>No hay datos para mostrar en esta categoría</div>
                )}
            </div>
        </div>
    );
}
