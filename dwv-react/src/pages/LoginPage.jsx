import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const PRIMARY_COLOR = '#115e67';
    const BG_COLOR = '#f4f7f9';
    const CARD_BG = 'white';
    const BORDER_COLOR = '#e0e0e0';
    const TEXT_PRIMARY = '#333';
    const TEXT_MUTED = '#666';
    const INPUT_BORDER = '#ccc';
    const ERROR_BG = '#f8d7da';
    const ERROR_TEXT = '#721c24';
    const ERROR_BORDER = '#f5c6cb';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email || !password) {
            setError('Por favor, ingresa correo y contraseña.');
            setLoading(false);
            return;
        }

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                throw authError;
            }

            const { data: sessionData } = await supabase.auth.getSession();
            onLoginSuccess(sessionData.session);

        } catch (err) {
            console.error('Error de autenticación:', err);
            setError('Credenciales incorrectas o el usuario no existe.');
        } finally {
            setLoading(false);
        }
    };

    // --- Estilos CSS Inlines para simular un diseño profesional basado en la imagen ---
    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: BG_COLOR,
            fontFamily: 'Arial, sans-serif', // Aseguramos una fuente genérica
        },
        card: {
            padding: '35px', // Ajustado un poco para el padding interior
            maxWidth: '400px', // Ajustado al ancho de la imagen
            width: '100%',
            background: CARD_BG,
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)', // Sombra más suave
            border: `1px solid ${BORDER_COLOR}`,
        },
        headerSection: {
            textAlign: 'center',
            marginBottom: '30px', // Espaciado entre header y form
        },
        logoContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px', // Espacio entre el logo D y el texto
            marginBottom: '20px',
        },
        logoIcon: {
            width: '32px', // Tamaño del icono 'D'
            height: '32px',
            backgroundColor: PRIMARY_COLOR,
            borderRadius: '6px', // Bordes más suaves para el icono
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
        },
        logoText: {
            fontSize: '20px', // Tamaño del texto "DICOM Viewer"
            fontWeight: 'bold',
            color: TEXT_PRIMARY,
        },
        title: {
            fontSize: '20px', // "Iniciar Sesión"
            color: TEXT_PRIMARY,
            marginBottom: '8px',
            fontWeight: '600',
        },
        subtitle: {
            fontSize: '14px', // "Accede a tu cuenta..."
            color: TEXT_MUTED,
            lineHeight: '1.4',
        },
        inputContainer: {
            marginBottom: '20px', // Espacio entre campos
        },
        input: {
            width: 'calc(100% - 24px)', // Ancho total menos padding horizontal
            padding: '12px',
            border: `1px solid ${INPUT_BORDER}`,
            borderRadius: '6px',
            fontSize: '15px',
            color: TEXT_PRIMARY,
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: TEXT_PRIMARY,
        },
        button: {
            width: '100%',
            padding: '14px',
            background: PRIMARY_COLOR,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background-color 0.3s, opacity 0.3s',
            opacity: loading ? 0.7 : 1,
        },
        errorBox: {
            padding: '10px',
            marginBottom: '20px',
            border: `1px solid ${ERROR_BORDER}`,
            borderRadius: '4px',
            color: ERROR_TEXT,
            backgroundColor: ERROR_BG,
            textAlign: 'center',
            fontSize: '14px',
        },
        demoCredentials: {
            marginTop: '30px', // Espacio después del botón
            paddingTop: '20px', // Padding interno superior
            borderTop: `1px solid ${BORDER_COLOR}`,
            textAlign: 'center',
            fontSize: '13px',
            color: TEXT_MUTED,
        },
        demoTitle: {
            marginBottom: '5px',
            fontWeight: '500',
        },
        demoDetail: {
            marginBottom: '3px',
            fontSize: '12px',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.headerSection}>
                    <div style={styles.logoContainer}>
                        <div style={styles.logoIcon}>D</div>
                        <h1 style={styles.logoText}>Visor DICOM</h1>
                    </div>
                    <p style={styles.title}>CSANANTORIO SAN ANTONIO</p>
                    <p style={styles.subtitle}>INGRESAR CUENTA</p>
                </div>

                <form onSubmit={handleLogin}>

                    {/* Campo Correo Electrónico */}
                    <div style={styles.inputContainer}>
                        <label htmlFor="email" style={styles.label}>Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            style={styles.input}
                            placeholder="doctor@hospital.com"
                        />
                    </div>

                    <div style={styles.inputContainer}>
                        <label htmlFor="password" style={styles.label}>Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            style={styles.input}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div style={styles.errorBox}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                        onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#0e4a52'; }} // Un tono más oscuro
                        onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = PRIMARY_COLOR; }}
                    >
                        {loading ? 'Cargando...' : 'Ingresar'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default LoginPage;