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
import { InventoryAgent } from './components/InventoryAgent/InventoryAgent';
import { HistoryModal } from './components/HistoryModal/HistoryModal';

/**
 * Main Application Component.
 * 
 * Orchestrates:
 * - User Authentication (Supabase Auth & Session management).
 * - Global State (Inventory, Jerseys, Profile Role).
 * - Routing/View Switching (Topic-based: Dashboard vs Inventory Table).
 * - Layout Composition (TopNavbar, BottomNavbar, Main Content).
 * - AI Agent Integration.
 * 
 * ---
 * 
 * Componente Principal de la Aplicación.
 * 
 * Orquestra:
 * - Autenticación de Usuario (Supabase Auth y gestión de Sesión).
 * - Estado Global (Inventario, Camisolas, Rol de Perfil).
 * - Enrutamiento/Cambio de Vista (Basado en Tópicos: Tablero vs Tabla de Inventario).
 * - Composición de Diseño (Barra Superior, Barra Inferior, Contenido Principal).
 * - Integración del Agente AI.
 */
function App() {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<{ role: 'admin' | 'viewer' } | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const { inventario, loading: invLoading, error } = useInventario();
    const { camisolas } = useCamisolas();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
            const { success, data } = await getRecentMovements(10); // Fetch more to allow grouping
            if (success && data) {
                // Grouping by type + model (color) + date (to group batches)
                const groupedMap: Record<string, {
                    tipo: string;
                    modelo: string;
                    equipo: string;
                    usuario: string; // Add usuario to type
                    tallas: Record<string, number>;
                }> = {};

                data.forEach((m: any) => {
                    const tipoKey = m.tipo === 'entrada' ? 'INGRESO' :
                        m.tipo === 'salida' ? 'EGRESO' :
                            m.tipo === 'venta' ? 'VENTA' : 'MOVIMIENTO';
                    const modelo = m.camisolas?.color || 'Modelo';
                    const equipo = m.camisolas?.equipo || '';
                    const usuario = m.usuario ? m.usuario.split('@')[0].toUpperCase() : 'SISTEMA';

                    // Key to group by: Type + Model Name + User (so we don't merge different users' actions if they happen close)
                    const key = `${tipoKey}_${modelo}_${equipo}_${usuario}`;

                    if (!groupedMap[key]) {
                        groupedMap[key] = {
                            tipo: tipoKey,
                            modelo: modelo.toUpperCase(),
                            equipo: equipo.toUpperCase(),
                            usuario,
                            tallas: {}
                        };
                    }

                    groupedMap[key].tallas[m.talla] = (groupedMap[key].tallas[m.talla] || 0) + m.cantidad;
                });

                const texts = Object.values(groupedMap).map(g => {
                    const tallasStr = Object.entries(g.tallas)
                        .map(([talla, qty]) => `${talla}(${qty})`)
                        .join(', ');
                    return `[${g.usuario}] ${g.tipo}: ${g.modelo} (${g.equipo}) - [${tallasStr}]`;
                });

                // Show only the last 2 distinct movements
                setMovementTexts(texts.length > 0 ? texts.slice(0, 2) : ['SIN MOVIMIENTOS RECIENTES']);
            }
        };

        if (session) {
            fetchMovements();
        }
    }, [session, isModalOpen]);

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
            if (!session?.user?.email) return;
            const result = await resetAllInventario(session.user.email);
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
                        <InventoryAgent
                            recentMovements={movementTexts}
                            inventario={inventario}
                            userEmail={session?.user?.email}
                            userName={session?.user?.user_metadata?.full_name}
                        />

                        {/* Spacer for the agent when it's static/fixed?? No, it's fixed now so it floats over content. */}

                        <Dashboard inventario={inventario} camisolas={camisolas} />

                        <div className="footer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <PDFExport inventario={inventario} />
                            {isAdmin && (
                                <>
                                    <button
                                        className="secondary-button"
                                        onClick={() => setIsHistoryOpen(true)}
                                        title="Ver registro de movimientos"
                                    >
                                        📜 Ver Historial
                                    </button>
                                    <button
                                        className="danger-button"
                                        onClick={handleResetInventario}
                                        title="Poner todo el inventario en 0"
                                    >
                                        🗑️ Reiniciar Todo
                                    </button>
                                </>
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
                <>
                    <StockMovementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
                    <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
                </>
            )}
        </div>
    );
}

export default App;
