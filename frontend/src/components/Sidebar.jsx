import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Usaremos iconos heroicons como placeholder, necesitamos instalar: npm i @heroicons/react
import {
    HomeIcon,
    ShoppingCartIcon,
    CurrencyDollarIcon,
    ArchiveBoxIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    ClipboardDocumentListIcon,
    Cog8ToothIcon,
    Bars3Icon,
    ChevronDownIcon,
    ArrowLeftOnRectangleIcon,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline';

const menuItems = [
    { title: 'Escritorio', icon: HomeIcon, id: 'dashboard' },
    {
        title: 'Ventas', icon: ShoppingCartIcon, id: 'ventas',
        subItems: ['Proformas', 'Facturas', { label: 'Devoluciones', id: 'DevolucionesVentas' }, 'Recibo oficial de caja']
    },
    {
        title: 'Gestión de Ventas', icon: CurrencyDollarIcon, id: 'gestion-ventas',
        subItems: ['Cierre de Caja', 'Clientes'] 
    },
    {
        title: 'Bodega', icon: ArchiveBoxIcon, id: 'bodega',
        subItems: ['Lista de inventario', 'Conteo de Bodega']
    },
    {
        title: 'Almacén', icon: BuildingStorefrontIcon, id: 'almacen',
        subItems: ['Repuestos', 'Categorías', 'Modelos']
    },
    {
        title: 'Compras', icon: TruckIcon, id: 'compras',
        subItems: ['Ingresos', { label: 'Devoluciones', id: 'DevolucionesCompras' }]
    },
    {
        title: 'Gestión de Compras', icon: ClipboardDocumentListIcon, id: 'gestion-compras',
        subItems: ['Compras por fecha', 'Proveedores', 'Demandas de Productos']
    },
    {
        title: 'Administración', icon: Cog8ToothIcon, id: 'admin',
        subItems: ['Usuarios', 'Datos de la Empresa', 'Formatos de Facturación', 'Gestionar Impuesto', 'Series del sistema', { label: '🌟 Limpiar BD (Pruebas)', id: 'LimpiarBD' }]
    }
];

const Sidebar = ({ currentView, setCurrentView }) => {
    const { user, logout, empresa, isDarkMode, toggleTheme } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSubMenu = (id) => {
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    return (
        <>
            {/* Botón flotante para móvil cuando el sidebar está cerrado */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-md border dark:border-slate-800 border-slate-200 text-slate-500 dark:text-slate-300 transition-colors"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
            )}

            {/* Overlay para móvil */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Principal */}
            <aside className={`dark:bg-slate-900 bg-white border-r dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-600 transition-all duration-300 flex flex-col h-screen fixed md:sticky top-0 z-50 
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
            `}>
                {/* Header Sidebar */}
                <div className="h-16 flex items-center justify-between px-4 border-b dark:border-slate-800 border-slate-100">
                    <div className={`flex items-center space-x-3 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        {empresa?.logoUrl ? (
                            <img src={empresa.logoUrl} alt="Logo" className="w-8 h-8 shrink-0 object-contain drop-shadow-md" />
                        ) : (
                            <div className="w-8 h-8 shrink-0 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg p-0.5 shadow-lg shadow-cyan-500/30">
                                <div className="w-full h-full dark:bg-slate-900 bg-white rounded-lg flex items-center justify-center">
                                    <span className="font-black text-sm bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">G</span>
                                </div>
                            </div>
                        )}
                        <span className="font-bold tracking-tight dark:text-white text-slate-800 whitespace-nowrap truncate max-w-[140px]">{empresa?.nombre || 'Gedsolution'}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                        {/* Botón Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-yellow-400 text-slate-500 transition-colors"
                            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        >
                            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </button>
                        {/* Botón Toggle Sidebar */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <nav className="space-y-1 px-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isExpanded = expandedMenu === item.id;
                            const hasSubmenus = item.subItems && item.subItems.length > 0;
                            const isActive = currentView === item.id;

                            return (
                                <div key={item.id}>
                                    <button
                                        onClick={() => {
                                            if (hasSubmenus) {
                                                toggleSubMenu(item.id);
                                            } else {
                                                setCurrentView(item.id);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group
                                        ${isActive ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400' : 'dark:hover:bg-slate-800/50 hover:bg-slate-100 hover:text-slate-900 dark:hover:text-white'}
                                    `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 group-hover:text-cyan-500 dark:group-hover:text-slate-300'}`} />
                                            {isSidebarOpen && (
                                                <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>
                                            )}
                                        </div>
                                        {isSidebarOpen && hasSubmenus && (
                                            <ChevronDownIcon
                                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`}
                                            />
                                        )}
                                    </button>

                                    {/* Submenus */}
                                    {isSidebarOpen && hasSubmenus && isExpanded && (
                                        <div className="mt-1 ml-4 pl-4 border-l dark:border-slate-800 border-slate-200 space-y-1">
                                            {item.subItems.map((sub, idx) => {
                                                const subLabel = typeof sub === 'string' ? sub : sub.label;
                                                const subId = typeof sub === 'string' ? sub : sub.id;
                                                const isSubActive = currentView === subId;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentView(subId)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSubActive ? 'text-cyan-600 dark:text-cyan-400 font-semibold dark:bg-slate-800/80 bg-cyan-50' : 'text-slate-500 dark:text-slate-400 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/50 hover:bg-slate-50'}`}
                                                    >
                                                        {subLabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile / Footer */}
                <div className={`p-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between ${isSidebarOpen ? '' : 'justify-center'}`}>
                    {isSidebarOpen && (
                        <div className="flex flex-col truncate pr-2">
                            <span className="text-sm font-semibold dark:text-white text-slate-800 truncate">{user?.nombre}</span>
                            <span className="text-xs text-slate-500 truncate">{user?.login}</span>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors group"
                        title="Cerrar Sesión"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
