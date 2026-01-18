import styles from './Navigation.module.css';

interface TopNavbarProps {
    currentView: 'dashboard' | 'inventory';
    onViewChange: (view: 'dashboard' | 'inventory') => void;
    onAddClick: () => void;
}

export function TopNavbar({ currentView, onViewChange, onAddClick }: TopNavbarProps) {
    return (
        <nav className={styles.topNavbar}>
            <div className={styles.container}>
                <div className={styles.brand}>
                    <img src="/logo.png" alt="Logo" className={styles.logo} />
                    <div className={styles.titleWrapper}>
                        <h1 className={styles.title}>Inventario</h1>
                        <span className={styles.subtitle}>Panel de Control</span>
                    </div>
                </div>

                <div className={styles.desktopNav}>
                    <button
                        className={`${styles.navButton} ${currentView === 'dashboard' ? styles.active : ''}`}
                        onClick={() => onViewChange('dashboard')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </button>
                    <button
                        className={`${styles.navButton} ${currentView === 'inventory' ? styles.active : ''}`}
                        onClick={() => onViewChange('inventory')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        Inventario
                    </button>
                    <button className={`${styles.navButton} ${styles.addButton}`} onClick={onAddClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Entrada
                    </button>
                </div>
            </div>
        </nav>
    );
}
