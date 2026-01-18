import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Login.module.css';
import { TypingText } from '../common/TypingText';

const WELCOME_MESSAGES = [
    'Bienvenido al Inventario',
    'Control total sobre tus camisolas',
    'Cuidando el stock mejor que a mi ex',
    'Donde las camisolas nunca faltan',
    'Menos Excel, más gloria',
    '¿Ya contaste las de ayer?',
    'Stock Pro 2026 listo'
];

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Error con Google Auth');
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.spotlight}></div>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <svg className={styles.logoIcon} width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Stylish Tech Logo: Interlocking shapes representing stock/flow */}
                            <path d="M10 20C10 14.4772 14.4772 10 20 10H30L25 30H15C12.2386 30 10 27.7614 10 25V20Z" fill="url(#grad1)" />
                            <path d="M35 10H45C50.5228 10 55 14.4772 55 20V25C55 27.7614 52.7614 30 50 30H30L35 10Z" fill="url(#grad2)" />
                            <rect x="18" y="18" width="24" height="4" rx="2" fill="white" opacity="0.6" />
                            <defs>
                                <linearGradient id="grad1" x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#60A5FA" />
                                    <stop offset="1" stopColor="#3B82F6" />
                                </linearGradient>
                                <linearGradient id="grad2" x1="30" y1="10" x2="55" y2="30" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#A78BFA" />
                                    <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                            <text x="65" y="27" fill="white" fontSize="18" fontWeight="bold" fontFamily="system-ui" letterSpacing="-0.5">INV</text>
                        </svg>
                    </div>
                    <h1 className={styles.title}>Panel de Gestión</h1>
                    <div className={styles.welcomeWrapper}>
                        <TypingText
                            texts={WELCOME_MESSAGES}
                            showPrefix={false}
                            variant="login"
                            typingSpeed={80}
                            delayBetweenTexts={3000}
                        />
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.socialLogin}>
                    <button
                        onClick={handleGoogleLogin}
                        className={styles.googleButton}
                        disabled={loading}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                            <path d="M12 4.36c1.61 0 3.06.56 4.21 1.64l3.16-3.16C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 5.77l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? 'Entrando...' : 'Inicia sesión con Google'}
                    </button>
                </div>
            </div>
        </div>
    );
}
