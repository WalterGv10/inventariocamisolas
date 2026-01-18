import { useState } from 'react';
import { useCamisolas } from '../hooks/useCamisolas';
import { useMovimientos } from '../hooks/useMovimientos';
import styles from './StockMovementModal.module.css';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TALLAS = ['S', 'M', 'L', 'XL'];

export function StockMovementModal({ isOpen, onClose }: StockMovementModalProps) {
    const { camisolas } = useCamisolas();
    const { createMovimiento } = useMovimientos();

    const [camisolaId, setCamisolaId] = useState('');
    const [talla, setTalla] = useState('');
    const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
    const [cantidad, setCantidad] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!camisolaId || !talla || !cantidad) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        setIsSubmitting(true);

        const result = await createMovimiento({
            camisola_id: camisolaId,
            talla,
            tipo,
            cantidad: parseInt(cantidad),
            fecha: new Date().toISOString().split('T')[0],
            descripcion: descripcion || undefined,
        });

        setIsSubmitting(false);

        if (result.success) {
            // Reset form
            setCamisolaId('');
            setTalla('');
            setTipo('entrada');
            setCantidad('');
            setDescripcion('');
            onClose();
        } else {
            alert('Error al registrar movimiento: ' + result.error);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    return (
        <div className={styles.backdrop} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Registrar Movimiento de Inventario</h2>
                    <button className={styles.closeButton} onClick={handleClose} disabled={isSubmitting}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="camisola">Producto *</label>
                        <select
                            id="camisola"
                            value={camisolaId}
                            onChange={(e) => setCamisolaId(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Selecciona una camisola</option>
                            {camisolas.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.equipo} - {c.color}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="talla">Talla *</label>
                        <select
                            id="talla"
                            value={talla}
                            onChange={(e) => setTalla(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Selecciona una talla</option>
                            {TALLAS.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tipo de Movimiento *</label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    value="entrada"
                                    checked={tipo === 'entrada'}
                                    onChange={() => setTipo('entrada')}
                                    disabled={isSubmitting}
                                />
                                Entrada (Agregar Stock)
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    value="salida"
                                    checked={tipo === 'salida'}
                                    onChange={() => setTipo('salida')}
                                    disabled={isSubmitting}
                                />
                                Salida (Quitar Stock)
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="cantidad">Cantidad *</label>
                        <input
                            type="number"
                            id="cantidad"
                            min="1"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            required
                            disabled={isSubmitting}
                            placeholder="Ej: 10"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="descripcion">Descripción</label>
                        <textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Ej: Compra a proveedor, Venta, Devolución..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Registrar Movimiento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
