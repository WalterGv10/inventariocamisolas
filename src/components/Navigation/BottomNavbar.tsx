import styles from './Navigation.module.css';

interface BottomNavbarProps {
    currentView: 'dashboard' | 'orders';
    onViewChange: (view: 'dashboard' | 'orders') => void;
    onAddClick: () => void;
    isAdmin: boolean;
}

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
                className={`${styles.mobileNavItem} ${currentView === 'orders' ? styles.active : ''}`}
                onClick={() => onViewChange('orders')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                <span>Pedidos</span>
            </button>
        </nav>
    );
}
