import React, { useState, useMemo } from 'react';
import { useCamisolas } from '../../hooks/useCamisolas';
import { usePedidos } from '../../hooks/usePedidos';
import type { ItemPedido } from '../../types/orders';
import { toast } from 'sonner';
import styles from './OrderModal.module.css';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose }) => {
    const { camisolas } = useCamisolas();
    const { createPedido } = usePedidos();

    // Form State
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemPedido[]>([]);
    const [orderType, setOrderType] = useState<'venta' | 'abastecimiento' | 'despacho'>('venta');

    // Item Builder State
    const [mode, setMode] = useState<'inventario' | 'libre'>('inventario');
    const [selectedModelId, setSelectedModelId] = useState('');
    const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0 });

    // Custom Item State
    const [customDesc, setCustomDesc] = useState('');

    // Shared Item State
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);

    // Derived Lists
    const filteredProducts = camisolas.filter(c =>
        c.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.color.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedProducts = useMemo(() => {
        const groups: Record<string, typeof camisolas> = {};
        filteredProducts.forEach(c => {
            if (!groups[c.equipo]) groups[c.equipo] = [];
            groups[c.equipo].push(c);
        });
        return groups;
    }, [filteredProducts]);

    const getProductImage = (c: any) => {
        if (c.gallery_urls && c.gallery_urls.length > 0) {
            const oneImg = c.gallery_urls.find((u: string) => /\/1\.(jpeg|jpg|png|webp)(\?|$)/i.test(u));
            if (oneImg) return oneImg;
            return c.gallery_urls[0];
        }
        return c.image_url;
    };

    const handleAddItem = () => {
        if (mode === 'inventario') {
            if (!selectedModelId) return toast.error('Selecciona un modelo');

            const model = camisolas.find(c => c.id === selectedModelId);
            if (!model) return;

            const newItems: ItemPedido[] = [];
            Object.entries(sizeQuantities).forEach(([talla, qty]) => {
                if (qty > 0) {
                    newItems.push({
                        tipo: 'inventario',
                        camisola_id: model.id,
                        talla,
                        descripcion: `${model.equipo} - ${model.color} (${talla})`,
                        cantidad: qty,
                        precio_unitario: price
                    });
                }
            });

            if (newItems.length === 0) return toast.error('Ingresa al menos una cantidad');
            setItems([...items, ...newItems]);
        } else {
            if (!customDesc) return toast.error('Ingresa una descripción');

            const newItem: ItemPedido = {
                tipo: 'libre',
                descripcion: customDesc,
                cantidad: quantity,
                precio_unitario: price
            };
            setItems([...items, newItem]);
        }

        // Reset builder
        setQuantity(1);
        setCustomDesc('');
        setSearchTerm('');
        setSelectedModelId('');
        setSizeQuantities({ S: 0, M: 0, L: 0, XL: 0 });
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!clientName) return toast.error('Nombre del cliente requerido');
        if (items.length === 0) return toast.error('Agrega al menos un artículo');

        const result = await createPedido({
            cliente_nombre: clientName,
            cliente_contacto: clientContact,
            fecha_entrega: deliveryDate,
            notas: notes,
            items,
            tipo: orderType
        });

        if (result.success) {
            toast.success('Pedido creado correctamente');
            handleClose();
        } else {
            toast.error('Error al crear pedido: ' + result.error);
        }
    };

    const handleClose = () => {
        // Reset form
        setClientName('');
        setClientContact('');
        setDeliveryDate('');
        setNotes('');
        setItems([]);
        onClose();
    };

    const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        {orderType === 'venta' ? 'Nuevo Pedido de Venta' :
                            orderType === 'abastecimiento' ? 'Nuevo Pedido de Abastecimiento' :
                                'Nuevo Pedido de Despacho'}
                    </div>
                    <button className={styles.closeButton} onClick={handleClose}>×</button>
                </div>

                {/* Selection of Order Type */}
                <div className={styles.section} style={{ paddingBottom: 0 }}>
                    <div className={styles.typeSelector}>
                        {(['venta', 'abastecimiento', 'despacho'] as const).map(t => (
                            <button
                                key={t}
                                className={`${styles.typeBtn} ${orderType === t ? styles.active : ''}`}
                                onClick={() => setOrderType(t)}
                            >
                                {t === 'venta' ? '💰 Venta' : t === 'abastecimiento' ? '📥 Abastecer' : '📤 Despachar'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 1: Client Info */}
                <div className={styles.section}>
                    <div className={styles.row}>
                        <div className={styles.col}>
                            <label className={styles.label}>
                                {orderType === 'venta' ? 'Cliente *' :
                                    orderType === 'abastecimiento' ? 'Proveedor / Origen *' :
                                        'Destino / Cliente *'}
                            </label>
                            <input
                                className={styles.input}
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder={orderType === 'abastecimiento' ? "Nombre del proveedor o almacén" : "Nombre completo"}
                            />
                        </div>
                        <div className={styles.col}>
                            <label className={styles.label}>Contacto</label>
                            <input
                                className={styles.input}
                                value={clientContact}
                                onChange={e => setClientContact(e.target.value)}
                                placeholder="Teléfono / WhatsApp"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Item Builder */}
                <div className={styles.section}>
                    <label className={styles.label} style={{ marginBottom: '1rem' }}>Agregar Artículos</label>
                    <div className={styles.itemBuilder}>
                        <div className={styles.modeToggle}>
                            <button
                                className={`${styles.toggleBtn} ${mode === 'inventario' ? styles.active : ''}`}
                                onClick={() => setMode('inventario')}
                            >
                                📦 De Inventario
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${mode === 'libre' ? styles.active : ''}`}
                                onClick={() => setMode('libre')}
                            >
                                ✨ Artículo Libre
                            </button>
                        </div>

                        {mode === 'inventario' ? (
                            <div className={styles.searchSection}>
                                <div className={styles.searchContainer}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="🔍 Buscar equipo o color..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className={styles.productGrid}>
                                    {Object.entries(groupedProducts).map(([team, groupItems]) => (
                                        <div key={team} className={styles.teamContainer}>
                                            <div className={styles.teamHeader}>{team}</div>
                                            <div className={styles.miniGrid}>
                                                {(groupItems as any[]).map(camisola => {
                                                    const isSelected = selectedModelId === camisola.id;
                                                    const imgUrl = getProductImage(camisola);
                                                    return (
                                                        <div
                                                            key={camisola.id}
                                                            className={`${styles.productMiniCard} ${isSelected ? styles.selected : ''}`}
                                                            onClick={() => setSelectedModelId(camisola.id)}
                                                        >
                                                            <div className={styles.miniCardImageWrapper}>
                                                                {imgUrl ? (
                                                                    <img src={imgUrl} alt={camisola.equipo} className={styles.miniCardImage} />
                                                                ) : (
                                                                    <div className={styles.miniCardPlaceholder}>{camisola.equipo.charAt(0)}</div>
                                                                )}
                                                            </div>
                                                            <div className={styles.miniCardInfo}>
                                                                <div className={styles.miniCardColor}>{camisola.color}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedModelId && (
                                    <div className={styles.sizeSelection}>
                                        <label className={styles.label}>Cantidades por Talla</label>
                                        <div className={styles.sizeEntryGrid}>
                                            {['S', 'M', 'L', 'XL'].map(s => (
                                                <div key={s} className={styles.sizeEntryField}>
                                                    <span className={styles.sizeEntryLabel}>{s}</span>
                                                    <input
                                                        type="number"
                                                        className={styles.sizeInput}
                                                        min={0}
                                                        value={sizeQuantities[s] || ''}
                                                        onChange={e => setSizeQuantities({
                                                            ...sizeQuantities,
                                                            [s]: parseInt(e.target.value) || 0
                                                        })}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.section}>
                                <div className={styles.row}>
                                    <div className={styles.col} style={{ flex: 2 }}>
                                        <input
                                            className={styles.input}
                                            value={customDesc}
                                            onChange={e => setCustomDesc(e.target.value)}
                                            placeholder="Descripción del artículo (Ej: Gorra Nike Dril)"
                                        />
                                    </div>
                                    <div className={styles.col}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={quantity}
                                            min={1}
                                            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                            placeholder="Cant."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Price */}
                        <div className={styles.row} style={{ marginTop: '1rem' }}>
                            <div className={styles.col}>
                                <label className={styles.label}>Precio Unit. (Q)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={price}
                                    min={0}
                                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <button className={styles.addButton} onClick={handleAddItem}>
                            + Agregar al Pedido
                        </button>
                    </div>

                    {/* Item List */}
                    <div className={styles.itemList}>
                        {items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <div className={styles.itemInfo}>
                                    <div style={{ fontWeight: 600 }}>{item.descripcion}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        {item.cantidad} x Q{item.precio_unitario}
                                    </div>
                                </div>
                                <div className={styles.itemPrice}>
                                    Q{item.cantidad * item.precio_unitario}
                                </div>
                                <button className={styles.removeItem} onClick={() => handleRemoveItem(idx)}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Additional Info */}
                <div className={styles.section}>
                    <div className={styles.row}>
                        <div className={styles.col}>
                            <label className={styles.label}>Fecha de Entrega (Opcional)</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={deliveryDate}
                                onChange={e => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.totalDisplay}>
                        Total: Q{total}
                    </div>
                    <button className={styles.submitButton} onClick={handleSubmit} disabled={items.length === 0}>
                        Confirmar Pedido
                    </button>
                </div>

            </div>
        </div>
    );
};
