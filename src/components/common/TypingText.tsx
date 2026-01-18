import React, { useState, useEffect } from 'react';
import styles from './TypingText.module.css';

interface TypingTextProps {
    texts: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    delayBetweenTexts?: number;
    showPrefix?: boolean;
    variant?: 'default' | 'login';
}

/**
 * Typing Text Logic/Effect Component.
 * 
 * Renders text with a typewriter animation effect.
 * Features:
 * - Configurable typing/deleting speeds.
 * - Looping through an array of strings.
 * - Optional prefix (e.g., "Historial: ").
 * - Variants for different contexts (default vs login).
 * 
 * ---
 * 
 * Componente de Lógica/Efecto de Texto "Typing".
 * 
 * Renderiza texto con un efecto de animación de máquina de escribir.
 * Características:
 * - Velocidades de escritura/borrado configurables.
 * - Bucle a través de un array de textos.
 * - Prefijo opcional (ej. "Historial: ").
 * - Variantes para contextos diferentes (default vs login).
 */
export const TypingText: React.FC<TypingTextProps> = ({
    texts,
    typingSpeed = 100,
    deletingSpeed = 50,
    delayBetweenTexts = 2000,
    showPrefix = true,
    variant = 'default',
}) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (texts.length === 0) return;

        const handleTyping = () => {
            const fullText = texts[currentTextIndex];

            if (isDeleting) {
                setCurrentText(prev => prev.substring(0, prev.length - 1));
                if (currentText === '') {
                    setIsDeleting(false);
                    setCurrentTextIndex(prev => (prev + 1) % texts.length);
                }
            } else {
                setCurrentText(fullText.substring(0, currentText.length + 1));
                if (currentText === fullText) {
                    setTimeout(() => setIsDeleting(true), delayBetweenTexts);
                    return;
                }
            }
        };

        const timer = setTimeout(
            handleTyping,
            isDeleting ? deletingSpeed : typingSpeed
        );

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentTextIndex, texts, typingSpeed, deletingSpeed, delayBetweenTexts]);

    return (
        <div className={`${styles.container} ${variant === 'login' ? styles.loginVariant : ''}`}>
            {showPrefix && <span className={styles.prefix}>Historial: </span>}
            <span className={`${styles.text} ${variant === 'login' ? styles.loginText : ''}`}>{currentText}</span>
            <span className={styles.cursor}>|</span>
        </div>
    );
};
