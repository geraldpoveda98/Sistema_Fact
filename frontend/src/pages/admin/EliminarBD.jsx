import { API_BASE_URL } from '../../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Database, Trash2, ShieldAlert } from 'lucide-react';

const EliminarBD = () => {
    const [colecciones, setColecciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [coleccionSeleccionada, setColeccionSeleccionada] = useState(null);
    const [palabraClave, setPalabraClave] = useState('');
    const [eliminando, setEliminando] = useState(false);

    

    const cargarConteos = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/limpiar-datos/conteo`);
            setColecciones(response.data);
        } catch (error) {
            console.error("Error cargando BD", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarConteos();
    }, []);

    const handleOpenModal = (coleccion) => {
        setColeccionSeleccionada(coleccion);
        setPalabraClave('');
        setShowModal(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (palabraClave !== 'ELIMINAR') {
            alert('Debes escribir la palabra exacta "ELIMINAR" en mayúsculas.');
            return;
        }

        try {
            setEliminando(true);
            await axios.delete(`${API_BASE_URL}/api/limpiar-datos/${coleccionSeleccionada.modelo}`);
            setShowModal(false);
            await cargarConteos(); // refrescar
            alert(`¡Base de datos ${coleccionSeleccionada.coleccion} vaciada con éxito!`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Ocurrió un error al intentar vaciar la base de datos.");
        } finally {
            setEliminando(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Peligro Top */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 text-red-500/10 dark:text-red-500/5">
                    <ShieldAlert size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="p-3 bg-red-500/20 rounded-xl text-red-600 dark:text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-500">Danger Zone (Entorno de Pruebas)</h2>
                        <p className="text-red-700/80 dark:text-red-400/80 text-sm mt-1 max-w-2xl">
                            Esta sección es exclusiva para la fase de pruebas del sistema. Eliminar los datos aquí purgará físicamente la información de la Base de Datos. Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid Colecciones */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {colecciones.map((col, ix) => (
                        <div key={ix} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400">
                                    <Database size={24} />
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${col.cantidad > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/50 dark:text-slate-500 dark:border-slate-800'}`}>
                                    {col.cantidad} registros
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                                {col.coleccion}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 truncate">
                                Modelo Interno: {col.modelo}
                            </p>

                            <button
                                onClick={() => handleOpenModal(col)}
                                disabled={col.cantidad === 0}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${col.cantidad > 0
                                        ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20'
                                        : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-800/50'
                                    }`}
                            >
                                <Trash2 size={16} />
                                Vaciar Datos
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Confirmación Destrucción */}
            {showModal && coleccionSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-red-500/30 overflow-hidden">

                        <div className="bg-red-500 p-6 text-center">
                            <AlertTriangle className="mx-auto text-white mb-2" size={48} />
                            <h3 className="text-xl font-bold text-white">¡Advertencia de Borrado!</h3>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6">
                                Estás a punto de borrar <strong>todos</strong> los datos ({coleccionSeleccionada.cantidad} registros) de la colección <span className="font-bold text-red-500">{coleccionSeleccionada.coleccion}</span>.
                                Esta acción es irreversible.
                            </p>

                            <div className="space-y-2 mb-6">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Para confirmar, escribe <span className="text-red-500 select-all tracking-wider">ELIMINAR</span>
                                </label>
                                <input
                                    type="text"
                                    value={palabraClave}
                                    onChange={(e) => setPalabraClave(e.target.value)}
                                    placeholder="Escribe ELIMINAR para continuar"
                                    className="w-full px-4 py-3 bg-red-50/50 dark:bg-slate-950 border border-red-200 dark:border-red-500/30 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-600 dark:text-red-400 font-mono text-center outline-none transition-all placeholder:text-slate-400/50"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarEliminacion}
                                    disabled={palabraClave !== 'ELIMINAR' || eliminando}
                                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {eliminando ? 'Vaciando...' : 'Confirmar Borrado'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EliminarBD;
