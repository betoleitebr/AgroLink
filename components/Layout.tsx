import React from 'react';
import { Home, Map as MapIcon, FileText, User, Bell, Briefcase, ShoppingBag, LogOut, Users2, BarChart3, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '../services/authStore';
import { CLIENT_BRAND } from '../constants';

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
    { id: 'visits', path: '/visits', icon: FileText, label: 'Agenda' },
    { id: 'producers', path: '/producers', icon: User, label: 'Clientes' },
    { id: 'proposals', path: '/proposals', icon: Briefcase, label: 'Propostas' },
    { id: 'catalog', path: '/catalog', icon: ShoppingBag, label: 'Catálogo' },
    { id: 'users', path: '/users', icon: Users2, label: 'Equipe' },
  ];

  const allowedNavItems = allNavItems.filter(item => 
    currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions[item.id as keyof typeof currentUser.permissions])
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 lg:pb-0 lg:pl-64">
      {/* Cabeçalho Mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gray-50/80 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-emerald-600 rounded-lg text-white"><Sparkles size={18}/></div>
           <h1 className="text-xl font-black text-gray-900 tracking-tighter">{CLIENT_BRAND.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white rounded-full shadow-sm relative">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => authStore.logout()}
            className="p-2 bg-white rounded-full shadow-sm hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop Premium */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6 shadow-2xl shadow-gray-200/50">
        <div className="mb-10 group">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-gray-900 text-white rounded-2xl shadow-xl transition-transform group-hover:rotate-12 duration-500"><Sparkles size={24} /></div>
             <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter">{CLIENT_BRAND.name}</h1>
                <p className="text-[9px] text-emerald-600 font-black tracking-widest uppercase">{CLIENT_BRAND.slogan}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-xl scale-[1.02]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-emerald-400' : 'group-hover:text-emerald-500'} />
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 mt-6 border-t border-gray-100">
          <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${currentUser.role === 'admin' ? 'bg-gray-900' : 'bg-emerald-500'}`}>
              {currentUser.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tighter">{currentUser.name}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{currentUser.role === 'admin' ? 'Administrador' : 'Equipe Técnica'}</p>
            </div>
            <button 
              onClick={() => authStore.logout()}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full min-h-screen">
        {children}
      </main>

      {/* Navegação Flutuante Mobile Premium */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden w-full max-w-md px-6">
        <nav className="glass bg-white/90 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] px-2 py-2 flex items-center justify-around gap-1 overflow-x-auto scrollbar-hide ring-1 ring-black/5">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3.5 rounded-[24px] transition-all duration-500 flex-shrink-0 relative ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-2xl scale-110 -translate-y-1' 
                    : 'text-gray-400 hover:text-emerald-500'
                }`}
              >
                <Icon size={22} />
                {isActive && (
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;