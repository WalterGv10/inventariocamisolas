import { useState } from 'react';
import { useInventario } from './hooks/useInventario';
import { useCamisolas } from './hooks/useCamisolas';
import { InventarioTable } from './components/InventarioTable';
import { StockMovementModal } from './components/StockMovementModal';
import { PDFExport } from './components/PDFExport';
import { Dashboard } from './components/Dashboard';
import { TopNavbar } from './components/Navigation/TopNavbar';
import { BottomNavbar } from './components/Navigation/BottomNavbar';
import { useMovimientos } from './hooks/useMovimientos';
import './App.css';

function App() {
    const { inventario, loading, error } = useInventario();
    const { camisolas } = useCamisolas();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { resetAllInventario } = useMovimientos();

    const handleResetInventario = async () => {
        const confirmed = window.confirm(
            '⚠️ ¿Estás COMPLETAMENTE seguro de reiniciar el inventario? Esta acción pondrá todas las cantidades (Stock, Muestras y Ventas) en 0.'
        );

        if (confirmed) {
            const result = await resetAllInventario();
            if (result.success) {
                window.location.reload();
            } else {
                alert('Error al reiniciar el inventario: ' + result.error);
            }
        }
    };

    const [view, setView] = useState<'dashboard' | 'inventory'>('dashboard');

    if (error) {
        return (
            <div className="app">
                <div className="error-container">
                    <h1>⚠️ Error de Conexión</h1>
                    <p>{error}</p>
                    <p className="error-hint">
                        Asegúrate de haber configurado correctamente las credenciales de Supabase en el archivo .env.local
                        e ingresado las nuevas columnas (muestras, vendidas) en la base de datos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            {/* Desktop Navigation */}
            <TopNavbar
                currentView={view}
                onViewChange={setView}
                onAddClick={() => setIsModalOpen(true)}
            />

            <main className="app-main" style={{ paddingBottom: '80px' }}> {/* Add padding for bottom nav */}
                {view === 'dashboard' ? (
                    <>
                        <div className="actions-bar" style={{ marginTop: '1rem' }}>
                            <div className="stats">
                                <span className="stat-badge">
                                    Modelos: <strong>{camisolas.length}</strong>
                                </span>
                                <span className="stat-badge">
                                    Stock Total:{' '}
                                    <strong>
                                        {inventario.reduce((sum, item) => sum + item.cantidad, 0)}
                                    </strong>
                                </span>
                                <span className="stat-badge blue">
                                    Muestras:{' '}
                                    <strong>
                                        {inventario.reduce((sum, item) => sum + item.muestras, 0)}
                                    </strong>
                                </span>
                                <span className="stat-badge gold">
                                    Ventas:{' '}
                                    <strong>
                                        {inventario.reduce((sum, item) => sum + item.vendidas, 0)}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <Dashboard inventario={inventario} camisolas={camisolas} />

                        <div className="footer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <PDFExport inventario={inventario} />
                            <button
                                className="danger-button"
                                onClick={handleResetInventario}
                                title="Poner todo el inventario en 0"
                            >
                                🗑️ Reiniciar Todo
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ marginTop: '1.5rem' }}>
                        <InventarioTable inventario={inventario} loading={loading} />
                    </div>
                )}
            </main>

            {/* Mobile Navigation */}
            <BottomNavbar
                currentView={view}
                onViewChange={setView}
                onAddClick={() => setIsModalOpen(true)}
            />

            <StockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

export default App;
