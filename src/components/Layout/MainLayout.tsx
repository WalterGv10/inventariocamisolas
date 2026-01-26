import { ReactNode } from 'react';
import { TopNavbar } from '../Navigation/TopNavbar';
import { BottomNavbar } from '../Navigation/BottomNavbar';
import { InventoryAgent } from '../InventoryAgent/InventoryAgent';
import { useAuth } from '../../context/AuthContext';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onAddClick: () => void;
}

export function MainLayout({ children, activeTab, setActiveTab, onAddClick }: MainLayoutProps) {
    const { session, isAdmin, user } = useAuth();

    if (!session) {
        return <>{children}</>;
    }

    const currentView = activeTab as 'dashboard' | 'orders';
    const userEmail = user?.email;

    return (
        <div className={styles.layoutContainer}>
            {/* Inventory Agent at the very top */}
            <div className={styles.agentWrapper}>
                <InventoryAgent />
            </div>

            <div className={styles.topNavWrapper}>
                <TopNavbar
                    currentView={currentView}
                    onViewChange={(view) => setActiveTab(view)}
                    onAddClick={onAddClick}
                    isAdmin={isAdmin}
                    userEmail={userEmail}
                />
            </div>

            <main className={styles.mainContent}>
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <div className={styles.bottomNavWrapper}>
                <BottomNavbar
                    currentView={currentView}
                    onViewChange={(view) => setActiveTab(view)}
                    onAddClick={onAddClick}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    );
}
