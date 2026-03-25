import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [empresa, setEmpresa] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // Tema claro/oscuro (por defecto oscuro si no hay nada guardado)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== null ? savedTheme === 'dark' : true;
    });

    useEffect(() => {
        // Aplicar el tema globalmente en el elemento HTML
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    useEffect(() => {
        // // Manejo de Token
        if (token) {
            setUser(JSON.parse(localStorage.getItem('user')) || null);
        }

        // Cargar datos globales de la empresa para toda la App (Logo, Nombres)
        const fetchEmpresa = async () => {
            try {
                const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);
                const res = await axios.get(`${apiBaseUrl}/api/empresa`);
                if (res.data) {
                    const logoFullUrl = res.data.logoUrl ? `${apiBaseUrl}${res.data.logoUrl}` : null;
                    setEmpresa({
                        ...res.data,
                        logoUrl: logoFullUrl
                    });

                    // Modificar dinámicamente el Favicon y Título de la Plataforma
                    if (res.data.nombre) {
                        document.title = `${res.data.nombre} - RPM`;
                    }
                    if (logoFullUrl) {
                        let link = document.querySelector("link[rel~='icon']");
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.head.appendChild(link);
                        }
                        link.href = logoFullUrl;
                    }
                }
            } catch (error) {
                console.error("Error cargando configuración de la empresa", error);
            }
        };

        fetchEmpresa();
        setLoading(false);
    }, [token]);

    const login = async (loginId, clave) => {
        try {
            // Utilizamos window.location.hostname para detectar la IP dinámica si se accede desde el móvil
            const endpoint = `http://${window.location.hostname}:5000/api/usuarios/login`;
            const res = await axios.post(endpoint, { login: loginId, clave });

            setToken(res.data.token);
            setUser(res.data.usuario);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.usuario));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Error al conectar con el servidor'
            };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, empresa, token, isAuthenticated: !!token, loading, login, logout, isDarkMode, toggleTheme }}>
            {children}
        </AuthContext.Provider>
    );
};
