import { supabase } from './lib/supabase';
import { Login } from './components/Login/Login';
import './App.css';

import { useEffect, useState } from 'react';
import { useInventario } from './hooks/useInventario';
import { useCamisolas } from './hooks/useCamisolas';
import { InventarioTable } from './components/InventarioTable';
import { StockMovementModal } from './components/StockMovementModal';
import { PDFExport } from './components/PDFExport';
import { Dashboard } from './components/Dashboard';
import { TopNavbar } from './components/Navigation/TopNavbar';
import { BottomNavbar } from './components/Navigation/BottomNavbar';
import { useMovimientos } from './hooks/useMovimientos';
import { TypingText } from './components/common/TypingText';

function App() {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<{ role: 'admin' | 'viewer' } | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const { inventario, loading: invLoading, error } = useInventario();
    const { camisolas } = useCamisolas();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { resetAllInventario, getRecentMovements } = useMovimientos();
    const [movementTexts, setMovementTexts] = useState<string[]>([]);

    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession) fetchProfile(currentSession.user.id);
            else setAuthLoading(false);
        });

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) fetchProfile(currentSession.user.id);
            else {
                setProfile(null);
                setAuthLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchMovements = async () => {
            const { success, data } = await getRecentMovements(5);
            if (success && data) {
                const texts = data.map((m: any) => {
                    const equipo = m.camisolas?.equipo || 'Camisola';
                    const color = m.camisolas?.color || '';
                    const tipoTexto = m.tipo === 'entrada' ? 'Ingresaron' : 'Salieron';
                    return `${tipoTexto} ${m.cantidad} unidades de ${equipo} ${color} (Talla ${m.talla})`;
                });
                setMovementTexts(texts.length > 0 ? texts : ['No hay movimientos recientes']);
            }
        };

        if (session) {
            fetchMovements();
        }
    }, [session, isModalOpen]); // Reload when session starts or when a new movement is added (modal close)

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (data) setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

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

    if (authLoading) {
        return <div className="app-loading">Cargando acceso...</div>;
    }

    if (!session) {
        return <Login />;
    }

    const isAdmin = profile?.role === 'admin';

    return (
        <div className="app">
            {/* Desktop Navigation */}
            <TopNavbar
                currentView={view}
                onViewChange={setView}
                onAddClick={() => setIsModalOpen(true)}
                isAdmin={isAdmin}
                userEmail={session?.user?.email}
            />

            <main className="app-main" style={{ paddingBottom: '80px' }}> {/* Add padding for bottom nav */}
                {view === 'dashboard' ? (
                    <>
                        <div className="actions-bar" style={{ marginTop: '1rem' }}>
                            <TypingText texts={movementTexts} />
                        </div>

                        <Dashboard inventario={inventario} camisolas={camisolas} />

                        <div className="footer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <PDFExport inventario={inventario} />
                            {isAdmin && (
                                <button
                                    className="danger-button"
                                    onClick={handleResetInventario}
                                    title="Poner todo el inventario en 0"
                                >
                                    🗑️ Reiniciar Todo
                                </button>
                            )}
                            <button className="secondary-button" onClick={handleLogout} style={{ opacity: 0.7 }}>
                                Salir
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ marginTop: '1.5rem' }}>
                        <InventarioTable
                            inventario={inventario}
                            loading={invLoading}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}
            </main>

            {/* Mobile Navigation */}
            <BottomNavbar
                currentView={view}
                onViewChange={setView}
                onAddClick={() => setIsModalOpen(true)}
                isAdmin={isAdmin}
            />

            {isAdmin && (
                <StockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}

export default App;
