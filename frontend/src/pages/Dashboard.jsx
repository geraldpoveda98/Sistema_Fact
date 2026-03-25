import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatUtils';
import Sidebar from '../components/Sidebar';
import Catalogo from '../components/Catalogo';
import DatosEmpresa from '../pages/admin/DatosEmpresa';
import Usuarios from '../pages/admin/Usuarios';
import Impuestos from '../pages/admin/Impuestos';
import Series from '../pages/admin/Series';
import ComprasPorFecha from '../pages/admin/ComprasPorFecha';
import Proveedores from '../pages/admin/Proveedores';
import DemandasProductos from '../pages/admin/DemandasProductos';
import ComprasIngresos from '../pages/admin/ComprasIngresos';
import ComprasDevoluciones from '../pages/admin/ComprasDevoluciones';
import Categorias from '../pages/admin/Categorias';
import Modelos from '../pages/admin/Modelos';
import ListaInventario from '../pages/admin/ListaInventario';
import ConteoBodega from '../pages/admin/ConteoBodega';
import Clientes from '../pages/admin/Clientes';
import CierreCaja from '../pages/admin/CierreCaja';
import Proformas from '../pages/admin/Proformas';
import Facturas from '../pages/admin/Facturas';
import Devoluciones from '../pages/admin/Devoluciones';
import FormatosFacturacion from '../pages/admin/FormatosFacturacion';
import EliminarBD from '../pages/admin/EliminarBD';

const Dashboard = () => {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');

    // Función para renderizar el contenido dinámico del área principal
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-2 transition-colors">
                                Panel de Control
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 transition-colors">Bienvenido al panel central de su sistema.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: 'Ventas de Hoy', val: formatCurrency(0), color: 'cyan' },
                                { title: 'Repuestos en Stock', val: '0', color: 'blue' },
                                { title: 'Clientes Registrados', val: '0', color: 'indigo' },
                                { title: 'Órdenes Pendientes', val: '0', color: 'purple' },
                            ].map((stat, i) => (
                                <div key={i} className="dark:bg-slate-800/50 bg-white backdrop-blur-md rounded-2xl p-6 border dark:border-slate-700/50 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xl dark:shadow-black/10 shadow-slate-200/50">
                                    <h3 className="dark:text-slate-400 text-slate-500 text-sm font-medium mb-2">{stat.title}</h3>
                                    <p className={`text-3xl font-bold text-${stat.color}-500 dark:text-${stat.color}-400`}>{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'almacen':
            case 'Repuestos':
            case 'Productos': // Por ahora enlazaremos Productos y almacen al mismo componente
                return (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-2 transition-colors">
                                Gestión de Almacén
                            </h1>
                            <p className="dark:text-slate-400 text-slate-500 font-medium transition-colors">Controla tus productos, categorías y modelos.</p>
                        </div>
                        <div className="dark:bg-slate-900/50 bg-white rounded-2xl p-6 border dark:border-slate-800 border-slate-200 shadow-xl dark:shadow-black/20 shadow-slate-200/50 transition-colors">
                            <Catalogo />
                        </div>
                    </>
                );
            case 'Categorías':
                return <Categorias />;
            case 'Modelos':
                return <Modelos />;
            case 'Estadísticas':
                return <Estadisticas />;
            case 'Clientes':
                return <Clientes />;
            case 'Cierre de Caja':
                return <CierreCaja />;
            case 'Ingresos':
                return <ComprasIngresos />;
            case 'DevolucionesCompras':
                return <ComprasDevoluciones />;
            case 'Lista de inventario':
                return <ListaInventario />;
            case 'Conteo de Bodega':
                return <ConteoBodega />;
            case 'Cajas':
                return <Cajas />;
            case 'Usuarios':
                return <Usuarios />;
            case 'Datos de la Empresa':
                return <DatosEmpresa />;
            case 'Formatos de Facturación':
                return <FormatosFacturacion />;
            case 'Gestionar Impuesto':
                return <Impuestos />;
            case 'Series del sistema':
                return <Series />;
            case 'Compras por fecha':
                return <ComprasPorFecha />;
            case 'Proveedores':
                return <Proveedores />;
            case 'Demandas de Productos':
                return <DemandasProductos />;
            case 'Proformas':
                return <Proformas />;
            case 'Facturas':
                return <Facturas />;
            case 'DevolucionesVentas':
                return <Devoluciones />;
            case 'LimpiarBD':
                return <EliminarBD />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed dark:border-slate-700/50 border-slate-300 rounded-2xl bg-slate-50/50 dark:bg-transparent transition-colors">
                        <div className="p-4 dark:bg-slate-800/50 bg-slate-100 rounded-full mb-4 transition-colors">
                            <span className="text-4xl text-cyan-500/50 dark:text-cyan-400/50">🏗️</span>
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white text-slate-800 mb-2 transition-colors">Módulo en Construcción</h2>
                        <p className="dark:text-slate-400 text-slate-500 transition-colors">Esta sección del sistema está siendo migrada.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-800 overflow-hidden min-h-screen transition-colors duration-300">
            {/* Sidebar Lateral */}
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

            {/* Contenedor Principal */}
            <main className="flex-1 h-screen overflow-y-auto w-full relative">
                {/* Header decorativo oculto en escritorio si no hay navbar superior */}
                <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />

                <div className="relative p-6 pt-20 md:pt-6 lg:p-10 lg:pt-10 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
