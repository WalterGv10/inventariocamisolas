import { useMemo, useState } from 'react';
import type { InventarioConDetalles, Camisola } from '../types';
import styles from './Dashboard.module.css';
import { MediaModal } from './MediaModal/MediaModal';

interface DashboardProps {
    inventario: InventarioConDetalles[];
    camisolas: Camisola[];
    profile?: { role: 'admin' | 'viewer' } | null;
    onOpenHistory: () => void;
}

interface TeamStats {
    equipo: string;
    total: number;
    porTalla: Record<string, number>;
    porColor: Record<string, number>;
    detallesPorModelo: Record<string, {
        color: string;
        total: number;
        porTalla: Record<string, number>;
        imageUrl?: string;
        videoUrl?: string;
        galleryUrls?: string[];
    }>;
}

type DashboardMode = 'stock' | 'muestras' | 'vendidas';

const TEAM_LOGOS: Record<string, string> = {
    'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
};

/**
 * Dashboard Component.
 */
export function Dashboard({ inventario, camisolas, onOpenHistory }: DashboardProps) {
    const [mode, setMode] = useState<DashboardMode>('stock');
    const [selectedMedia, setSelectedMedia] = useState<{
        isOpen: boolean;
        title: string;
        imageUrl?: string;
        videoUrl?: string;
        galleryUrls?: string[];
    }>({ isOpen: false, title: '' });

    const teamStats = useMemo(() => {
        const stats: Record<string, TeamStats> = {};

        // 1. Initialize structure
        camisolas.forEach(c => {
            if (!stats[c.equipo]) {
                stats[c.equipo] = {
                    equipo: c.equipo,
                    total: 0,
                    porTalla: { S: 0, M: 0, L: 0, XL: 0 },
                    porColor: {},
                    detallesPorModelo: {}
                };
            }
            if (!stats[c.equipo].porColor[c.color]) {
                stats[c.equipo].porColor[c.color] = 0;
            }
            if (!stats[c.equipo].detallesPorModelo[c.color]) {
                let bestImage = c.image_url;
                if (c.gallery_urls && c.gallery_urls.length > 0) {
                    const oneImg = c.gallery_urls.find((u: string) => /\/1\.(jpeg|jpg|png|webp)(\?|$)/i.test(u));
                    bestImage = oneImg || c.gallery_urls[0];
                }

                stats[c.equipo].detallesPorModelo[c.color] = {
                    color: c.color,
                    total: 0,
                    porTalla: { S: 0, M: 0, L: 0, XL: 0 },
                    imageUrl: bestImage,
                    videoUrl: c.video_url,
                    galleryUrls: c.gallery_urls
                };
            }
        });

        // 2. Fill with inventory data
        inventario.forEach((item) => {
            if (!stats[item.equipo]) {
                stats[item.equipo] = {
                    equipo: item.equipo,
                    total: 0,
                    porTalla: { S: 0, M: 0, L: 0, XL: 0 },
                    porColor: {},
                    detallesPorModelo: {}
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

                if (!team.detallesPorModelo[item.color]) {
                    team.detallesPorModelo[item.color] = {
                        color: item.color,
                        total: 0,
                        porTalla: { S: 0, M: 0, L: 0, XL: 0 }
                    };
                }
                const modelStats = team.detallesPorModelo[item.color];
                modelStats.total += count;
                if (item.talla in modelStats.porTalla) {
                    modelStats.porTalla[item.talla] += count;
                }
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
            <div className={styles.controlsRow}>
                <div className={styles.tabSelector}>
                    {(['stock', 'muestras', 'vendidas'] as DashboardMode[]).map((m) => (
                        <button
                            key={m}
                            className={`${styles.tabButton} ${mode === m ? `${styles.activeTab} ${styles[m]}` : ''}`}
                            onClick={() => setMode(m)}
                        >
                            <span className={styles.tabIcon}>
                                {m === 'stock' ? '📦' : m === 'muestras' ? '🔍' : '💰'}
                            </span>
                            {modeLabels[m].replace(/📦|🔍|💰/g, '').trim()}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                {teamStats.map((team) => (
                    <div key={team.equipo} className={`${styles.teamCard} ${styles[mode + 'Card']}`}>
                        <div className={styles.teamHeader}>
                            <div className={styles.teamTitleWrapper}>
                                {TEAM_LOGOS[team.equipo] && (
                                    <img src={TEAM_LOGOS[team.equipo]} alt={team.equipo} className={styles.teamLogo} />
                                )}
                                <h3 className={styles.teamTitle}>{team.equipo}</h3>
                            </div>
                            <span className={styles.teamTotalBadge}>{team.total} <small>unid.</small></span>
                        </div>

                        <div className={styles.statsLayout}>
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

                            <div className={styles.section}>
                                <span className={styles.sectionLabel}>Detalle por Modelo</span>
                                <div className={styles.modelList}>
                                    {Object.values(team.detallesPorModelo)
                                        .sort((a, b) => b.total - a.total)
                                        .map((model) => (
                                            <div
                                                key={model.color}
                                                className={styles.modelRow}
                                                onClick={() => setSelectedMedia({
                                                    isOpen: true,
                                                    title: `${team.equipo} - ${model.color}`,
                                                    imageUrl: model.imageUrl,
                                                    videoUrl: model.videoUrl,
                                                    galleryUrls: model.galleryUrls
                                                })}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className={styles.modelInfo}>
                                                    <div className={styles.modelNameWrapper}>
                                                        {model.imageUrl && (
                                                            <div className={styles.thumbnailWrapper}>
                                                                <img src={model.imageUrl} alt={model.color} className={styles.avatar} />
                                                            </div>
                                                        )}
                                                        <span className={styles.modelName}>{model.color}</span>
                                                    </div>
                                                    {model.total > 0 && <span className={styles.modelTotal}>{model.total}</span>}
                                                </div>
                                                <div className={styles.modelSizes}>
                                                    {Object.entries(model.porTalla).map(([talla, cantidad]) => (
                                                        cantidad > 0 && (
                                                            <span key={talla} className={styles.miniSizeBadge}>
                                                                {talla}: <strong>{cantidad}</strong>
                                                            </span>
                                                        )
                                                    ))}
                                                    {model.total === 0 && <span className={styles.miniSizeBadge} style={{ opacity: 0.5 }}>Sin stock</span>}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.bottomActions}>
                <button
                    className={styles.historyBtn}
                    onClick={onOpenHistory}
                >
                    📜 Ver Historial Completo
                </button>
            </div>

            <MediaModal
                isOpen={selectedMedia.isOpen}
                onClose={() => setSelectedMedia({ ...selectedMedia, isOpen: false })}
                title={selectedMedia.title}
                imageUrl={selectedMedia.imageUrl}
                videoUrl={selectedMedia.videoUrl}
                galleryUrls={selectedMedia.galleryUrls}
            />
        </div>
    );
}
