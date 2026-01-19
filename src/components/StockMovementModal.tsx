import { useState, useMemo } from 'react';
import { useCamisolas } from '../hooks/useCamisolas';
import { useMovimientos } from '../hooks/useMovimientos';
import styles from './StockMovementModal.module.css';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TALLAS = ['S', 'M', 'L', 'XL'];
type MovementType = 'entrada' | 'salida' | 'a_muestra' | 'venta';

/**
 * Modal for adding/removing stock (In/Out/Samples/Sales).
 * 
 * REFACTORED FOR BATCH OPERATIONS:
 * This component now supports a 2-step flow:
 * 1. Product Selection: Grid view to select multiple products (highlighted with checkmarks).
 * 2. Batch Entry: A list of selected products with quantity inputs for all sizes (S, M, L, XL)
 *    and a single "Movement Type" selector for the entire batch.
 * 
 * ---
 * 
 * Modal para agregar/quitar inventario (Entrada/Salida/Muestras/Ventas).
 * 
 * REFACTORIZADO PARA OPERACIONES POR LOTE:
 * Este componente ahora soporta un flujo de 2 pasos:
 * 1. Selección de Producto: Vista de cuadrícula para seleccionar múltiples productos (resaltados con checkmarks).
 * 2. Detalles del Lote: Una lista de productos seleccionados con campos de cantidad para todas las tallas
 *    y un selector único de "Tipo de Movimiento" para todo el lote.
 * 
 * @param {boolean} isOpen - Controls visibility.
 * @param {function} onClose - Function to close the modal.
 */
export function StockMovementModal({ isOpen, onClose }: StockMovementModalProps) {
    const { camisolas } = useCamisolas();
    const { createMovimiento } = useMovimientos();

    // Step Management: 1 = Grid Selection, 2 = Batch Details
    const [step, setStep] = useState(1);

    // State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    // Map: ProductID -> { Size -> Quantity }
    const [batchData, setBatchData] = useState<Record<string, Record<string, number>>>({});

    const [tipo, setTipo] = useState<MovementType>('entrada');
    const [precioVenta, setPrecioVenta] = useState<string>('');
    const [fechaEntrega, setFechaEntrega] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered Camisolas
    const displayCamisolas = camisolas;

    // Selected Camisolas for Step 2
    const selectedCamisolas = useMemo(() => {
        return camisolas.filter(c => selectedIds.includes(c.id));
    }, [camisolas, selectedIds]);

    if (!isOpen) return null;

    // --- HANDLERS ---

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newIds = prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id];

            // Initial batch data structure for new items
            if (!prev.includes(id)) {
                setBatchData(current => ({
                    ...current,
                    [id]: { S: 0, M: 0, L: 0, XL: 0 }
                }));
            }

            return newIds;
        });
    };

    const handleQuantityChange = (id: string, talla: string, val: string) => {
        const num = parseInt(val);
        const cleanVal = isNaN(num) ? 0 : num;

        setBatchData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [talla]: Math.max(0, cleanVal)
            }
        }));
    };

    const handleContinue = () => {
        if (selectedIds.length > 0) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        const moves: any[] = [];

        // Collect all non-zero movements
        selectedIds.forEach(id => {
            const quantities = batchData[id];
            if (!quantities) return;

            Object.entries(quantities).forEach(([talla, qty]) => {
                if (qty > 0) {
                    moves.push({
                        camisola_id: id,
                        talla,
                        tipo,
                        cantidad: qty,
                        fecha: new Date().toISOString().split('T')[0],
                        descripcion: `Mov. Lote: ${tipo}`,
                        precio_venta: tipo === 'venta' && precioVenta ? parseFloat(precioVenta) : undefined,
                        fecha_entrega: tipo === 'a_muestra' && fechaEntrega ? fechaEntrega : undefined
                    });
                }
            });
        });

        if (moves.length === 0) {
            alert('No has ingresado ninguna cantidad mayor a 0 wuu.');
            return;
        }

        setIsSubmitting(true);

        // Execute sequentially
        let lastError = '';
        let errorCount = 0;
        for (const move of moves) {
            const result = await createMovimiento(move);
            if (!result.success) {
                errorCount++;
                lastError = result.error || 'Error desconocido';
            }
        }

        setIsSubmitting(false);

        if (errorCount === 0) {
            handleClose();
        } else {
            alert(`Error: ${lastError}${errorCount > 1 ? ` (y ${errorCount - 1} errores más)` : ''}`);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setStep(1);
            setSelectedIds([]);
            setBatchData({});
            setTipo('entrada');
            setPrecioVenta('');
            setFechaEntrega('');
            onClose();
        }
    };

    // Helper to get best image
    const getProductImage = (c: any) => {
        if (c.gallery_urls && c.gallery_urls.length > 0) {
            // Prioritize image named "1" (1.jpg, 1.jpeg, etc.)
            const oneImg = c.gallery_urls.find((u: string) =>
                /\/1\.(jpeg|jpg|png|webp)(\?|$)/i.test(u)
            );
            if (oneImg) return oneImg;

            return c.gallery_urls[0];
        }
        return c.image_url;
    };

    return (
        <div className={styles.backdrop} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <div className={styles.header}>
                    <h2>
                        {step === 1
                            ? `Seleccionar Productos`
                            : `Ingresar Cantidades (${selectedIds.length})`}
                    </h2>
                    <button className={styles.closeButton} onClick={handleClose} disabled={isSubmitting}>
                        ✕
                    </button>
                </div>

                {/* CONTENT */}
                <div className={styles.content}>

                    {/* STEP 1: GRID MULTI-SELECT */}
                    {step === 1 && (
                        <>
                            <div className={styles.productsGrid}>
                                {displayCamisolas.map(camisola => {
                                    const isSelected = selectedIds.includes(camisola.id);
                                    const imgUrl = getProductImage(camisola);

                                    return (
                                        <div
                                            key={camisola.id}
                                            className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}
                                            onClick={() => toggleSelection(camisola.id)}
                                        >
                                            {isSelected && (
                                                <div className={styles.selectionBadge}>✓</div>
                                            )}

                                            <div className={styles.cardImageWrapper}>
                                                {imgUrl ? (
                                                    <img
                                                        src={imgUrl}
                                                        alt={`${camisola.equipo}`}
                                                        className={styles.cardImage}
                                                    />
                                                ) : (
                                                    <div className={styles.cardImagePlaceholder}>
                                                        {camisola.equipo.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <span className={styles.cardTeam}>{camisola.equipo}</span>
                                                <span className={styles.cardModel}>{camisola.color}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Floating Continue Button */}
                            {selectedIds.length > 0 && (
                                <div className={styles.floatingFooter}>
                                    <button className={styles.continueButton} onClick={handleContinue}>
                                        Continuar ({selectedIds.length}) →
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* STEP 2: BATCH LIST */}
                    {step === 2 && (
                        <div className={styles.batchContainer}>

                            {/* Global Controls */}
                            <div className={styles.globalControls}>
                                <label className={styles.sectionLabel}>Tipo de Movimiento</label>
                                <div className={styles.typeGrid}>
                                    <button
                                        className={`${styles.typeBtn} ${tipo === 'entrada' ? styles.active : ''}`}
                                        onClick={() => setTipo('entrada')}
                                        data-type="entrada"
                                    >
                                        <span className={styles.typeIcon}>📥</span>
                                        <span>Entrada</span>
                                    </button>
                                    <button
                                        className={`${styles.typeBtn} ${tipo === 'venta' ? styles.active : ''}`}
                                        onClick={() => setTipo('venta')}
                                        data-type="venta"
                                    >
                                        <span className={styles.typeIcon}>💰</span>
                                        <span>Venta</span>
                                    </button>
                                    <button
                                        className={`${styles.typeBtn} ${tipo === 'salida' ? styles.active : ''}`}
                                        onClick={() => setTipo('salida')}
                                        data-type="salida"
                                    >
                                        <span className={styles.typeIcon}>📤</span>
                                        <span>Salida</span>
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Inputs based on Type */}
                            {tipo === 'venta' && (
                                <div className={styles.extraInputSection}>
                                    <label>Precio Total Venta (Q)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 150.00"
                                        value={precioVenta}
                                        onChange={e => setPrecioVenta(e.target.value)}
                                        className={styles.mainInput}
                                    />
                                </div>
                            )}

                            {tipo === 'a_muestra' && (
                                <div className={styles.extraInputSection}>
                                    <label>Fecha de Entrega / Devolución</label>
                                    <input
                                        type="date"
                                        value={fechaEntrega}
                                        onChange={e => setFechaEntrega(e.target.value)}
                                        className={styles.mainInput}
                                    />
                                </div>
                            )}

                            {/* Scrollable Product List */}
                            <div className={styles.batchList}>
                                {selectedCamisolas.map(camisola => {
                                    const imgUrl = getProductImage(camisola);
                                    return (
                                        <div key={camisola.id} className={styles.batchItem}>
                                            <div className={styles.itemHeader}>
                                                <div className={styles.miniThumbWrapper}>
                                                    {imgUrl && <img src={imgUrl} className={styles.miniThumb} alt="mini" />}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <h4>{camisola.equipo}</h4>
                                                    <h3>{camisola.color}</h3>
                                                </div>
                                            </div>

                                            <div className={styles.sizesRow}>
                                                {TALLAS.map(t => {
                                                    const qty = batchData[camisola.id]?.[t] || 0;
                                                    return (
                                                        <div key={t} className={`${styles.sizeCompactInput} ${qty > 0 ? styles.hasQty : ''}`}>
                                                            <span className={styles.sizeLabel}>{t}</span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                placeholder="-"
                                                                className={styles.qtyCompactInput}
                                                                value={qty === 0 ? '' : qty}
                                                                onChange={(e) => handleQuantityChange(camisola.id, t, e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className={styles.actions}>
                                <button className={styles.backButton} onClick={handleBack}>
                                    ← Volver
                                </button>
                                <button
                                    className={styles.submitButton}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Procesando...' : 'Confirmar Todo'}
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
