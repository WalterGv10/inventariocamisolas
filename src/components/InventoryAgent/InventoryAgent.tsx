import React, { useState, useRef } from 'react';
import { useInventoryAI } from '../../hooks/useInventoryAI';
import { useInventoryAgent } from '../../hooks/useInventoryAgent';
import { useInventario } from '../../hooks/useInventario';
import { useAuth } from '../../context/AuthContext';
import styles from './InventoryAgent.module.css';

/**
 * AI Inventory Agent Component.
 * 
 * Displays a "terminal-like" interface that serves two purposes:
 * 1. History Mode: Cycles through recent inventory movements when idle.
 * 2. Chat Mode: Allows the user to type natural language queries to check stock/status.
 */
export const InventoryAgent: React.FC = () => {
    // Hooks
    const { processQuery } = useInventoryAI();
    const { movementTexts: recentMovements } = useInventoryAgent();
    const { inventario } = useInventario();
    const { user } = useAuth();

    // State
    const [mode, setMode] = useState<'history' | 'chat'>('history');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [displayText, setDisplayText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Derived State
    const userEmail = user?.email;
    // const userName = ... (Removed unused)
    // const displayUserName = ... (Removed unused)

    // --- Interaction Handlers ---

    const handleContainerClick = () => {
        if (isMinimized) return; // Don't expand if minimized unless button clicked
        if (!isExpanded) {
            setIsExpanded(true);
            setMode('chat');
            setDisplayText(''); // Clear history text to show input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
        if (isExpanded) setIsExpanded(false);
    };

    const handleCollapse = () => {
        // Only collapse if clicking outside or explicitly blurring without value
        if (inputValue.trim() === '') {
            setIsExpanded(false);
            setMode('history');
            setDisplayText(''); // Will resume history loop
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            const query = inputValue;
            try {
                const result = await processQuery(query, inventario, userEmail);
                setDisplayText(result.answer);
            } catch (err) {
                setDisplayText("Error procesando solicitud.");
            }

            setInputValue('');
        } else if (e.key === 'Escape') {
            setIsExpanded(false);
            setMode('history');
        }
    };

    return (
        <div className={`${styles.agentContainer} ${isMinimized ? styles.minimizedContainer : ''}`}>
            <div
                className={`${styles.terminalWindow} ${isExpanded ? styles.expanded : ''} ${isMinimized ? styles.minimized : ''}`}
                onClick={handleContainerClick}
            >
                {isMinimized ? (
                    <div className={styles.minimizedTab} onClick={toggleMinimize}>
                        <span className={styles.minimizedTitle}>PANTALLA LED • ESTADO EN VIVO</span>
                        <span className={styles.expandIcon}>▲</span>
                    </div>
                ) : (
                    <>
                        <div className={styles.statusLine}>
                            <span className={styles.prompt}>
                                <span className={styles.promptIcon}>{isExpanded ? '💬' : '🤖'}</span>
                                {isExpanded ? 'Asistente' : 'IA_Agent'}
                            </span>
                            <div className={styles.windowControls}>
                                <button className={styles.minimizeBtn} onClick={toggleMinimize} title="Minimizar">
                                    —
                                </button>
                                {isExpanded && (
                                    <button
                                        className={styles.closeBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(false);
                                            setMode('history');
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.interactionArea}>
                            <div className={styles.textDisplay}>
                                {mode === 'history' ? (
                                    <div className={styles.ledPanel}>
                                        <div className={styles.welcomeLine}>
                                            <div className={styles.lineMarquee}>
                                                <div className={styles.lineMarqueeText} style={{ animationDuration: '25s' }}>
                                                    {recentMovements[0] || 'INICIANDO PANEL LED...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.statusGrid}>
                                            <div className={styles.ledLine} style={{ color: '#fbbf24' }}>
                                                <span className={styles.lineLabel}>VENTAS:</span>
                                                <div className={styles.lineMarquee}>
                                                    <div className={styles.lineMarqueeText} style={{ animationDuration: '15s', color: '#fbbf24' }}>
                                                        {recentMovements.filter(m => m.includes('VENTA')).join('  :::  ') || 'ESPERANDO ACCIÓN ⚽'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.ledLine} style={{ color: '#8b5cf6' }}>
                                                <span className={styles.lineLabel}>MUESTRAS:</span>
                                                <div className={styles.lineMarquee}>
                                                    <div className={styles.lineMarqueeText} style={{ animationDuration: '20s', color: '#8b5cf6' }}>
                                                        {recentMovements.filter(m => m.includes('MOSTRANDO') || m.includes('MUESTRAS')).join('  :::  ') || 'TODO EN ALMACÉN'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.ledLine} style={{ color: '#10b981' }}>
                                                <span className={styles.lineLabel}>ENTRADAS:</span>
                                                <div className={styles.lineMarquee}>
                                                    <div className={styles.lineMarqueeText} style={{ animationDuration: '18s', color: '#10b981' }}>
                                                        {recentMovements.filter(m => m.includes('INGRESO') || m.includes('DATA')).join('  :::  ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className={styles.prefix}>{"> "}</span>
                                        <span className={styles.output}>
                                            {displayText || (inputValue || '')}
                                        </span>
                                        {!displayText && (
                                            <span className={styles.blink}>|</span>
                                        )}
                                        {!displayText && inputValue === '' && (
                                            <span className={styles.placeholder}> Pregunta sobre stock...</span>
                                        )}
                                    </>
                                )}
                            </div>

                            <input
                                ref={inputRef}
                                type="text"
                                className={styles.hiddenInput}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleCollapse}
                                onKeyDown={handleKeyDown}
                                disabled={!isExpanded || isMinimized}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
