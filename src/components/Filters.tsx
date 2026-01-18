import type { FiltrosInventario } from '../types';
import styles from './Filters.module.css';

interface FiltersProps {
    filtros: FiltrosInventario;
    onFiltrosChange: (filtros: FiltrosInventario) => void;
    equiposDisponibles: string[];
    coloresDisponibles: string[];
}

const TALLAS = ['S', 'M', 'L', 'XL'];

/**
 * Filters Component.
 * 
 * UI for filtering inventory lists.
 * Supports filtering by:
 * - Team (dynamically populated).
 * - Color (dynamically populated).
 * - Size (Fixed list: S, M, L, XL).
 * 
 * ---
 * 
 * Componente de Filtros.
 * 
 * Interfaz de usuario para filtrar listas de inventario.
 * Soporta filtrado por:
 * - Equipo (poblado dinámicamente).
 * - Color (poblado dinámicamente).
 * - Talla (Lista fija: S, M, L, XL).
 */
export function Filters({
    filtros,
    onFiltrosChange,
    equiposDisponibles,
    coloresDisponibles,
}: FiltersProps) {
    const handleEquipoChange = (equipo: string) => {
        onFiltrosChange({ ...filtros, equipo, color: '' });
    };

    const handleColorChange = (color: string) => {
        onFiltrosChange({ ...filtros, color });
    };

    const handleTallaChange = (talla: string) => {
        onFiltrosChange({ ...filtros, talla });
    };

    const clearFilters = () => {
        onFiltrosChange({ equipo: '', color: '', talla: '' });
    };

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Equipo:</label>
                <div className={styles.buttonGroup}>
                    <button
                        className={`${styles.filterButton} ${filtros.equipo === '' ? styles.active : ''}`}
                        onClick={() => handleEquipoChange('')}
                    >
                        Todos
                    </button>
                    {equiposDisponibles.map((equipo) => (
                        <button
                            key={equipo}
                            className={`${styles.filterButton} ${filtros.equipo === equipo ? styles.active : ''}`}
                            onClick={() => handleEquipoChange(equipo)}
                        >
                            {equipo}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Color:</label>
                <div className={styles.buttonGroup}>
                    <button
                        className={`${styles.filterButton} ${filtros.color === '' ? styles.active : ''}`}
                        onClick={() => handleColorChange('')}
                    >
                        Todos
                    </button>
                    {coloresDisponibles.map((color) => (
                        <button
                            key={color}
                            className={`${styles.filterButton} ${filtros.color === color ? styles.active : ''}`}
                            onClick={() => handleColorChange(color)}
                        >
                            {color}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Talla:</label>
                <div className={styles.buttonGroup}>
                    <button
                        className={`${styles.filterButton} ${filtros.talla === '' ? styles.active : ''}`}
                        onClick={() => handleTallaChange('')}
                    >
                        Todas
                    </button>
                    {TALLAS.map((talla) => (
                        <button
                            key={talla}
                            className={`${styles.filterButton} ${filtros.talla === talla ? styles.active : ''}`}
                            onClick={() => handleTallaChange(talla)}
                        >
                            {talla}
                        </button>
                    ))}
                </div>
            </div>

            <button className={styles.clearButton} onClick={clearFilters}>
                Limpiar Filtros
            </button>
        </div>
    );
}
