import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';

const Login = () => {
    const [loginId, setLoginId] = useState('');
    const [clave, setClave] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, empresa, isDarkMode, toggleTheme } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!loginId || !clave) {
            setError('Por favor, ingresa tu usuario y contraseña');
            return;
        }

        setIsLoading(true);
        const result = await login(loginId, clave);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-3 rounded-full dark:bg-slate-800 bg-white dark:text-yellow-400 text-slate-800 shadow-lg dark:hover:bg-slate-700 hover:bg-slate-100 transition-all z-20"
                title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* Background Decorations */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md p-8 m-4 dark:bg-slate-900/80 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:border-slate-800 border-white/50 z-10 transition-all duration-300 dark:hover:shadow-cyan-500/10 hover:shadow-cyan-500/5">
                <div className="text-center mb-8 mt-2">
                    {/* Renderización Dinámica de Logo y Nombre de Empresa (Ampliado) */}
                    {empresa?.logoUrl ? (
                        <div className="w-36 h-36 mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-3xl blur-xl"></div>
                            <img src={empresa.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain filter drop-shadow-2xl relative z-10" />
                        </div>
                    ) : (
                        <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl p-1 mb-6 shadow-xl shadow-cyan-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <div className="w-full h-full dark:bg-slate-900 bg-white rounded-[22px] flex items-center justify-center">
                                <span className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">G</span>
                            </div>
                        </div>
                    )}
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{empresa?.nombre || 'RPM'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Plataforma de Gestión</p>
                    <h1 className="text-3xl font-bold dark:text-white text-slate-800 mb-2 tracking-tight transition-colors">Bienvenido de nuevo</h1>
                    <p className="dark:text-slate-400 text-slate-500 transition-colors font-medium">{empresa?.nombre || 'RPM'} - Acceso Seguro</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center shadow-inner font-medium">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 transition-colors">Usuario</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 dark:bg-slate-950/50 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 dark:placeholder-slate-600 placeholder-slate-400 font-medium"
                                placeholder="Ingresa tu usuario"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2 transition-colors">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                className="block w-full pl-11 pr-12 py-3.5 dark:bg-slate-950/50 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 dark:placeholder-slate-600 placeholder-slate-400 font-medium"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:hover:text-white hover:text-slate-800 transition-colors focus:outline-none z-10"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-4 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-offset-white focus:ring-cyan-500 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            'Ingresar al Sistema'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t dark:border-slate-800 border-slate-200 pt-6 transition-colors">
                    <p className="text-xs dark:text-slate-500 text-slate-400 font-medium">
                        &copy; {new Date().getFullYear()} {empresa?.nombre || 'Servicios Informáticos'}. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
