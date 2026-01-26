import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';

// Components
import { Login } from './components/Login/Login';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal/HistoryModal';
import { StockMovementModal } from './components/StockMovementModal';
import { OrderModal } from './components/Orders/OrderModal';
import { OrdersList } from './components/Orders/OrdersList';
import { Toaster } from 'sonner';

// Hooks
import { useInventario } from './hooks/useInventario';
import { useCamisolas } from './hooks/useCamisolas';

import './App.css';

/**
 * Main Application Wrapper
 */
function AppContent() {
    const { session, loading: authLoading } = useAuth();
    const { inventario } = useInventario();
    const { camisolas } = useCamisolas();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Global Modals State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOrderOpen, setIsOrderOpen] = useState(false);

    if (authLoading) return <div className="loading-screen">Cargando Sistema...</div>;

    if (!session) {
        return <Login />;
    }

    return (
        <MainLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddClick={() => setIsModalOpen(true)}
        >
            {/* View Switching Logic */}
            {activeTab === 'dashboard' && (
                <Dashboard
                    inventario={inventario}
                    camisolas={camisolas}
                    onOpenHistory={() => setIsHistoryOpen(true)}
                />
            )}

            {activeTab === 'orders' && (
                <OrdersList onNewOrder={() => setIsOrderOpen(true)} />
            )}

            {/* Global Modals */}
            <StockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
            <OrderModal isOpen={isOrderOpen} onClose={() => setIsOrderOpen(false)} />

            <Toaster
                position="top-center"
                richColors
                theme="dark"
                closeButton
                toastOptions={{
                    style: {
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#f8fafc',
                        fontFamily: 'inherit'
                    }
                }}
            />
        </MainLayout>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
