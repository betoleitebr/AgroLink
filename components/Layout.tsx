
import React from 'react';
import { Home, Map as MapIcon, FileText, User, Bell, Briefcase, ShoppingBag, LogOut, Users2, BarChart3 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '../services/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authStore.getCurrentUser();

  if (!currentUser) return <>{children}</>;

  const allNavItems = [
    { id: 'dashboard', path: '/', icon: Home, label: 'Início' },
    { id: 'reports', path: '/reports', icon: BarChart3, label: 'BI & Relatórios' },
    { id: 'map', path: '/map', icon: MapIcon, label: 'Mapa' },
    { id: 'visits', path: '/visits', icon: FileText, label: 'Visitas' },
    { id: 'producers', path: '/producers', icon: User, label: 'Clientes' },
    { id: 'proposals', path: '/proposals', icon: Briefcase, label: 'Propostas' },
    { id: 'catalog', path: '/catalog', icon: ShoppingBag, label: 'Catálogo' },
    { id: 'users', path: '/users', icon: Users2, label: 'Equipe' },
  ];

  const allowedNavItems = allNavItems.filter(item => 
    currentUser.permissions[item.id as keyof typeof currentUser.permissions]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 lg:pb-0 lg:pl-64">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gray-50/80 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">AgroLink</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => authStore.logout()}
            className="p-2 bg-white rounded-full shadow-sm hover:text-red-500 transition-all"
            title="Sair do Sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">AgroLink</h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">Gestão de Campo</p>
        </div>
        <nav className="flex-1 space-y-2">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-lg' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentUser.role === 'admin' ? 'bg-gray-900' : 'bg-emerald-500'}`}>
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Navegação Flutuante Mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden w-full max-w-md px-4">
        <nav className="glass bg-white/80 border border-gray-100 shadow-2xl rounded-full px-4 py-3 flex items-center justify-around gap-2 overflow-x-auto scrollbar-hide">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3 rounded-full transition-all flex-shrink-0 ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-lg scale-110' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon size={22} />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
