import styles from './Navigation.module.css';

interface BottomNavbarProps {
    currentView: 'dashboard' | 'inventory';
    onViewChange: (view: 'dashboard' | 'inventory') => void;
    onAddClick: () => void;
    isAdmin: boolean;
}

/**
 * Bottom Navigation Bar (Mobile Only).
 * 
 * Provides quick access to main views on small screens:
 * - Summary/Dashboard Tab.
 * - Floating Action Button (FAB) for adding entries (Admin only).
 * - Inventory Tab.
 * 
 * ---
 * 
 * Barra de Navegación Inferior (Solo Móvil).
 * 
 * Proporciona acceso rápido a las vistas principales en pantallas pequeñas:
 * - Pestaña Resumen/Tablero.
 * - Botón de Acción Flotante (FAB) para agregar entradas (Solo Admin).
 * - Pestaña Inventario.
 */
export function BottomNavbar({ currentView, onViewChange, onAddClick, isAdmin }: BottomNavbarProps) {
    return (
        <nav className={styles.bottomNavbar}>
            <button
                className={`${styles.mobileNavItem} ${currentView === 'dashboard' ? styles.active : ''}`}
                onClick={() => onViewChange('dashboard')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Resumen</span>
            </button>

            {isAdmin && (
                <div className={styles.fabItem}>
                    <button className={styles.fabButton} onClick={onAddClick} aria-label="Agregar Entrada">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            )}

            <button
                className={`${styles.mobileNavItem} ${currentView === 'inventory' ? styles.active : ''}`}
                onClick={() => onViewChange('inventory')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>Inventario</span>
            </button>
        </nav>
    );
}
