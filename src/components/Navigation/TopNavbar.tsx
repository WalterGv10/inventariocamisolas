import styles from './Navigation.module.css';

interface TopNavbarProps {
    currentView: 'dashboard' | 'orders';
    onViewChange: (view: 'dashboard' | 'orders') => void;
    onAddClick: () => void;
    isAdmin: boolean;
    userEmail?: string;
}

export function TopNavbar({
    currentView,
    onViewChange,
    onAddClick,
    isAdmin,
    userEmail,
}: TopNavbarProps) {
    return (
        <nav className={styles.topNavbar}>
            <div className={styles.container}>
                <div className={styles.brand} onClick={() => onViewChange('dashboard')}>
                    <svg className={styles.logo} viewBox="0 0 65 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 20C10 14.4772 14.4772 10 20 10H30L25 30H15C12.2386 30 10 27.7614 10 25V20Z" fill="url(#navGrad1)" />
                        <path d="M35 10H45C50.5228 10 55 14.4772 55 20V25C55 27.7614 52.7614 30 50 30H30L35 10Z" fill="url(#navGrad2)" />
                        <rect x="18" y="18" width="24" height="4" rx="2" fill="white" opacity="0.6" />
                        <defs>
                            <linearGradient id="navGrad1" x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#60A5FA" />
                                <stop offset="1" stopColor="#3B82F6" />
                            </linearGradient>
                            <linearGradient id="navGrad2" x1="30" y1="10" x2="55" y2="30" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#A78BFA" />
                                <stop offset="1" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                    </svg>
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
                        className={`${styles.navButton} ${currentView === 'orders' ? styles.active : ''}`}
                        onClick={() => onViewChange('orders')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                        Pedidos
                    </button>
                    {isAdmin && (
                        <button className={`${styles.navButton} ${styles.addButton}`} onClick={onAddClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Entrada
                        </button>
                    )}

                    {userEmail && (
                        <div className={styles.userProfile}>
                            <div className={styles.userInfo}>
                                <span className={styles.userEmail}>{userEmail}</span>
                                <span className={`${styles.roleBadge} ${isAdmin ? styles.admin : styles.viewer}`}>
                                    {isAdmin ? 'ADMIN' : 'VISOR'}
                                </span>
                            </div>
                            <div className={styles.avatar}>
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
