import React, { useState, useRef } from 'react';
import { useInventoryAI } from '../../hooks/useInventoryAI';
import type { InventarioConDetalles } from '../../types';
import styles from './InventoryAgent.module.css';

interface InventoryAgentProps {
    recentMovements: string[];
    inventario: InventarioConDetalles[];
    userEmail?: string;
    userName?: string;
}

/**
 * AI Inventory Agent Component.
 * 
 * Displays a "terminal-like" interface that serves two purposes:
 * 1. History Mode: Cycles through recent inventory movements when idle.
 * 2. Chat Mode: Allows the user to type natural language queries to check stock/status.
 * 
 * It uses the `useInventoryAI` hook to process queries locally.
 * 
 * ---
 * 
 * Componente del Agente de Inventario AI.
 * 
 * Muestra una interfaz tipo "terminal" que sirve dos propósitos:
 * 1. Modo Historial: Cicla a través de movimientos recientes del inventario cuando está inactivo.
 * 2. Modo Chat: Permite al usuario escribir consultas en lenguaje natural para revisar stock/estado.
 * 
 * Utiliza el hook `useInventoryAI` para procesar consultas localmente.
 */
export const InventoryAgent: React.FC<InventoryAgentProps> = ({
    recentMovements,
    inventario,
    userEmail,
    userName
}) => {
    // Hook that contains the NLP logic
    const { processQuery } = useInventoryAI();
    const [mode, setMode] = useState<'history' | 'chat'>('history');
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [displayText, setDisplayText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // History Marquee Content
    const displayUserName = userName || (userEmail ? userEmail.split('@')[0].split('.')[0] : 'Usuario');
    const greeting = `¡HOLA ${displayUserName.toUpperCase()}!`;

    // --- Interaction Handlers ---

    const handleContainerClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setMode('chat');
            setDisplayText(''); // Clear history text to show input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
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
        <div className={styles.agentContainer}>
            <div
                className={`${styles.terminalWindow} ${isExpanded ? styles.expanded : ''}`}
                onClick={handleContainerClick}
            >
                {(isExpanded || mode === 'chat') && (
                    <div className={styles.statusLine}>
                        <span className={styles.prompt}>
                            <span className={styles.promptIcon}>{isExpanded ? '💬' : '🤖'}</span>
                            {isExpanded ? 'Asistente' : 'IA_Agent'}
                        </span>
                        {isExpanded && (
                            <span
                                style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.5, fontSize: '0.8rem' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                    setMode('history');
                                }}
                            >
                                ✕
                            </span>
                        )}
                    </div>
                )}

                <div className={styles.interactionArea}>
                    <div className={styles.textDisplay}>
                        {mode === 'history' ? (
                            <div className={styles.doubleLineContainer}>
                                <div className={styles.staticLine}>
                                    <span className={styles.promptIcon}>👋</span> {greeting}
                                </div>
                                <div className={styles.marqueeContainer}>
                                    <div className={styles.marqueeText}>
                                        {recentMovements.length > 0 ? recentMovements.join('   •   ') : 'Esperando movimientos...'}
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
                        disabled={!isExpanded}
                    />
                </div>
            </div>
        </div>
    );
};
