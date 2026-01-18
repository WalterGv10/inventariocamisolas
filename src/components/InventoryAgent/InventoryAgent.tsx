import React, { useState, useEffect, useRef } from 'react';
import { useInventoryAI } from '../../hooks/useInventoryAI';
import type { InventarioConDetalles } from '../../types';
import styles from './InventoryAgent.module.css';

interface InventoryAgentProps {
    recentMovements: string[];
    inventario: InventarioConDetalles[];
    userEmail?: string;
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
    userEmail
}) => {
    // Hook that contains the NLP logic
    const { processQuery } = useInventoryAI();
    const [mode, setMode] = useState<'history' | 'chat'>('history');
    const [inputValue, setInputValue] = useState('');
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // History Animation State
    const [historyIndex, setHistoryIndex] = useState(0);
    const typingTimeoutRef = useRef<number | null>(null);

    // --- History Mode Animation ---
    useEffect(() => {
        if (mode === 'chat' || recentMovements.length === 0) return;

        const currentMsg = recentMovements[historyIndex];
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            // mode is captured in closure, so it won't change here if dependencies are right.
            // But effect cleanup handles stopping.

            const currentLength = isDeleting ? charIndex-- : charIndex++;
            setDisplayText(currentMsg.substring(0, currentLength));

            let speed = isDeleting ? 30 : 60;

            if (!isDeleting && charIndex === currentMsg.length + 1) {
                isDeleting = true;
                speed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                setHistoryIndex((prev) => (prev + 1) % recentMovements.length);
                speed = 500;
            }

            typingTimeoutRef.current = setTimeout(type, speed) as unknown as number;
        };

        type();

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [mode, historyIndex, recentMovements]);

    // --- Chat Logic ---
    const handleInputFocus = () => {
        setMode('chat');
        setDisplayText('');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleInputBlur = () => {
        if (inputValue.trim() === '') {
            setMode('history');
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            setIsTyping(true);
            setDisplayText("Analizando...");

            // Use the current input value
            const query = inputValue;

            // Artificial delay removed or minimal, waiting for real async process
            try {
                const result = await processQuery(query, inventario, userEmail);
                setDisplayText(result.answer);
            } catch (err) {
                setDisplayText("Error procesando solicitud.");
            } finally {
                setIsTyping(false);
            }

            setInputValue('');
        }
    };

    return (
        <div className={styles.agentContainer}>
            <div className={styles.terminalWindow}>
                <div className={styles.statusLine}>
                    <span className={styles.prompt}>
                        {mode === 'history' ? 'HISTORIAL' : 'AI_AGENT'}
                        <span className={styles.blink}>_</span>
                    </span>
                </div>

                <div className={styles.interactionArea}>
                    <div className={styles.textDisplay}>
                        {mode === 'history' && <span className={styles.prefix}>{"> "}</span>}

                        <span className={isTyping ? styles.typing : styles.output}>
                            {/* In chat mode, show input if no system message is displaying */}
                            {mode === 'chat' && !displayText ? inputValue : displayText}
                        </span>

                        {mode === 'chat' && !displayText && (
                            <span className={styles.blink}>_</span>
                        )}

                        {mode === 'chat' && !displayText && inputValue === '' && (
                            <span className={styles.placeholder}> Pregúntame sobre el inventario...</span>
                        )}
                    </div>

                    <input
                        type="text"
                        className={styles.hiddenInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe aquí..."
                    />
                </div>
            </div>
        </div>
    );
};
