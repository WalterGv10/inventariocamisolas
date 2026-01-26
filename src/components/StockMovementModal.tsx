import { useState, useMemo } from 'react';
import { useCamisolas } from '../hooks/useCamisolas';
import { useMovimientos } from '../hooks/useMovimientos';
import { toast } from 'sonner';
import styles from './StockMovementModal.module.css';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TALLAS = ['S', 'M', 'L', 'XL'];
type MovementType = 'entrada' | 'salida' | 'a_muestra' | 'venta';

export function StockMovementModal({ isOpen, onClose }: StockMovementModalProps) {
    const { camisolas } = useCamisolas();
    const { createMovimiento } = useMovimientos();
    const [step, setStep] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [batchData, setBatchData] = useState<Record<string, Record<string, number>>>({});
    const [tipo, setTipo] = useState<MovementType>('entrada');
    const [precioVenta, setPrecioVenta] = useState<string>('');
    const [fechaEntrega, setFechaEntrega] = useState<string>('');
    const [referencia, setReferencia] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const displayCamisolas = useMemo(() => {
        return camisolas.filter(c =>
            c.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.color.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [camisolas, searchTerm]);
    const groupedCamisolas = useMemo(() => {
        const groups: Record<string, typeof camisolas> = {};
        displayCamisolas.forEach(c => {
            if (!groups[c.equipo]) groups[c.equipo] = [];
            groups[c.equipo].push(c);
        });
        return groups;
    }, [displayCamisolas]);

    const selectedCamisolas = useMemo(() => {
        return camisolas.filter(c => selectedIds.includes(c.id));
    }, [camisolas, selectedIds]);

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newIds = prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id];

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
        if (selectedIds.length > 0) setStep(2);
    };

    const handleBack = () => setStep(1);

    const handleSubmit = async () => {
        const moves: any[] = [];
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
                        descripcion: referencia
                            ? `Mov. Lote (${tipo}): ${referencia}`
                            : `Mov. Lote: ${tipo}`,
                        precio_venta: tipo === 'venta' && precioVenta ? parseFloat(precioVenta) : undefined,
                        fecha_entrega: tipo === 'a_muestra' && fechaEntrega ? fechaEntrega : undefined
                    });
                }
            });
        });

        if (moves.length === 0) {
            toast.error('No has ingresado ninguna cantidad mayor a 0.');
            return;
        }

        setIsSubmitting(true);
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
            setIsSuccess(true);
            toast.success('¡Inventario actualizado con éxito!');
            setTimeout(() => {
                handleClose();
                setTimeout(() => setIsSuccess(false), 300);
            }, 2000);
        } else {
            toast.error(`Atención: ${lastError}${errorCount > 1 ? ` (y ${errorCount - 1} errores más)` : ''}`);
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
            setReferencia('');
            onClose();
        }
    };

    const getProductImage = (c: any) => {
        if (c.gallery_urls && c.gallery_urls.length > 0) {
            const oneImg = c.gallery_urls.find((u: string) => /\/1\.(jpeg|jpg|png|webp)(\?|$)/i.test(u));
            if (oneImg) return oneImg;
            return c.gallery_urls[0];
        }
        return c.image_url;
    };

    return (
        <div className={styles.backdrop} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {isSuccess && (
                    <div className={styles.successOverlay}>
                        <div className={styles.successContent}>
                            <div className={styles.checkmarkCircle}>
                                <span className={styles.checkmark}>✓</span>
                            </div>
                            <div className={styles.successTitle}>¡Movimiento Completado!</div>
                            <div className={styles.successSubtitle}>El inventario ha sido actualizado correctamente.</div>
                        </div>
                    </div>
                )}

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

                <div className={`${styles.content} ${step === 1 ? styles.stepOne : ''}`}>
                    {step === 1 && (
                        <>
                            <input
                                type="text"
                                className={styles.searchBar}
                                placeholder="🔍 Buscar por equipo o color..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <div className={styles.groupedGrid}>
                                {Object.entries(groupedCamisolas).map(([team, items]) => (
                                    <div key={team} className={styles.teamSection}>
                                        <h3 className={styles.teamTitle}>{team}</h3>
                                        <div className={styles.productsGrid}>
                                            {items.map(camisola => {
                                                const isSelected = selectedIds.includes(camisola.id);
                                                const imgUrl = getProductImage(camisola);
                                                return (
                                                    <div
                                                        key={camisola.id}
                                                        className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}
                                                        onClick={() => toggleSelection(camisola.id)}
                                                        title={`${camisola.equipo} - ${camisola.color}`}
                                                    >
                                                        {isSelected && <div className={styles.selectionBadge}>✓</div>}
                                                        <div className={styles.cardImageWrapper}>
                                                            {imgUrl ? (
                                                                <img src={imgUrl} alt={`${camisola.equipo}`} className={styles.cardImage} />
                                                            ) : (
                                                                <div className={styles.cardImagePlaceholder}>{camisola.equipo.charAt(0)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className={styles.batchContainer}>
                            <div className={styles.globalControls}>
                                <label className={styles.sectionLabel}>Tipo de Movimiento</label>
                                <div className={styles.typeGrid}>
                                    {(['entrada', 'salida', 'venta', 'a_muestra'] as const).map((t) => {
                                        let label = '';
                                        let icon = '';
                                        switch (t) {
                                            case 'entrada': label = 'Abastecer (Entrada)'; icon = '📥'; break;
                                            case 'salida': label = 'Despachar (Salida)'; icon = '📤'; break;
                                            case 'venta': label = 'Venta Directa'; icon = '💰'; break;
                                            case 'a_muestra': label = 'Mover a Muestra'; icon = '👁️'; break;
                                        }
                                        return (
                                            <button
                                                key={t}
                                                className={`${styles.typeBtn} ${tipo === t ? styles.active : ''}`}
                                                onClick={() => setTipo(t)}
                                                data-type={t}
                                            >
                                                <span className={styles.typeIcon}>{icon}</span>
                                                <span>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {(tipo === 'entrada' || tipo === 'salida') && (
                                <div className={styles.extraInputSection}>
                                    <label>Referencia / No. Pedido (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder={tipo === 'entrada' ? "Ej. Factura #123" : "Ej. Envío #456"}
                                        value={referencia}
                                        onChange={e => setReferencia(e.target.value)}
                                        className={styles.mainInput}
                                    />
                                </div>
                            )}

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
                                                            <div className={styles.counterWrapper}>
                                                                <button
                                                                    className={styles.counterBtn}
                                                                    onClick={() => handleQuantityChange(camisola.id, t, (qty - 1).toString())}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    placeholder="0"
                                                                    className={styles.qtyCompactInput}
                                                                    value={qty === 0 ? '' : qty}
                                                                    onChange={(e) => handleQuantityChange(camisola.id, t, e.target.value)}
                                                                />
                                                                <button
                                                                    className={styles.counterBtn}
                                                                    onClick={() => handleQuantityChange(camisola.id, t, (qty + 1).toString())}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Footers outside scroll area */}
                {step === 1 && selectedIds.length > 0 && (
                    <div className={styles.floatingFooter}>
                        <button className={styles.continueButton} onClick={handleContinue}>
                            Continuar ({selectedIds.length}) →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.actions}>
                        <button className={styles.backButton} onClick={handleBack}>← Volver</button>
                        <button
                            className={styles.submitButton}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Procesando...' : 'Confirmar Todo'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
