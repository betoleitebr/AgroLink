
import React, { useState } from 'react';
import { 
  Users2, Plus, Search, Trash2, Edit3, X, Check, ShieldCheck, 
  UserCircle, Lock, LayoutGrid, Map as MapIcon, FileText, 
  User as UserIcon, Briefcase, ShoppingBag, Settings, ChevronRight,
  Mail, Phone, BarChart3
} from 'lucide-react';
import { authStore } from '../services/authStore';
import { User as UserType, UserRole, UserPermissions } from '../types';

const UserManagement: React.FC = () => {
  const users = authStore.getUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const [formState, setFormState] = useState<Partial<UserType>>({
    name: '',
    email: '',
    whatsapp: '',
    role: 'operator',
    permissions: {
      // Added missing 'reports' property to match UserPermissions type
      dashboard: true, map: true, visits: true, producers: true, proposals: true, catalog: true, reports: true, users: false
    }
  });

  const handleOpenForm = (user?: UserType) => {
    if (user) {
      setSelectedUser(user);
      setFormState({ ...user });
    } else {
      setSelectedUser(null);
      setFormState({
        name: '', email: '', whatsapp: '', role: 'operator',
        // Added missing 'reports' property to match UserPermissions type
        permissions: { dashboard: true, map: true, visits: true, producers: true, proposals: true, catalog: true, reports: true, users: false }
      });
    }
    setShowForm(true);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setFormState(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [key]: !prev.permissions![key]
      }
    }));
  };

  const handleSave = () => {
    if (selectedUser) {
      authStore.updateUser(formState as UserType);
    } else {
      const newUser: UserType = {
        ...formState as UserType,
        id: `u-${Date.now()}`,
        isVerified: true, // Adicionado pelo admin já vem verificado
        createdAt: new Date().toISOString(),
        password: 'User@Agrolink2025' // Senha padrão para novo usuário
      };
      authStore.addUser(newUser);
    }
    setShowForm(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
          <p className="text-sm text-gray-500">Controle de acessos e usuários do sistema</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Novo Membro
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar usuário por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${user.role === 'admin' ? 'bg-gray-900' : 'bg-emerald-500'}`}>
                    <UserCircle size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{user.name}</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                 </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenForm(user)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                {user.id !== 'admin-1' && (
                  <button onClick={() => { if(confirm('Excluir este usuário?')) authStore.deleteUser(user.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Mail size={14} className="text-gray-300" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Phone size={14} className="text-gray-300" /> {user.whatsapp}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Acessos Habilitados</p>
               <div className="flex flex-wrap gap-1.5">
                  {Object.entries(user.permissions).map(([key, enabled]) => enabled && (
                    <span key={key} className="bg-gray-50 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded border border-gray-100 uppercase">{key}</span>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg"><UserIcon size={20} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser ? 'Editar Usuário' : 'Novo Membro da Equipe'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controle de Privilégios</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={24} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input type="tel" value={formState.whatsapp} onChange={e => setFormState({...formState, whatsapp: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                  <select value={formState.role} onChange={e => setFormState({...formState, role: e.target.value as UserRole})} className="w-full bg-gray-900 text-white rounded-2xl px-5 py-3 text-sm font-bold outline-none">
                    <option value="operator">Operador (Acesso Limitado)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>
              </div>

              {formState.role === 'operator' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" /> Módulos Disponíveis para este Operador
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'dashboard', label: 'Dashboard Inicial', icon: LayoutGrid },
                      { key: 'map', label: 'Mapa Geográfico', icon: MapIcon },
                      { key: 'visits', label: 'Agenda de Visitas', icon: FileText },
                      { key: 'producers', label: 'Gestão de Clientes', icon: UserCircle },
                      { key: 'proposals', label: 'Pipeline Comercial', icon: Briefcase },
                      { key: 'catalog', label: 'Catálogo Estratégico', icon: ShoppingBag },
                      { key: 'reports', label: 'BI & Relatórios', icon: BarChart3 },
                    ].map(mod => (
                      <label key={mod.key} className={`flex items-center justify-between p-4 rounded-3xl border-2 cursor-pointer transition-all ${formState.permissions![mod.key as keyof UserPermissions] ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
                        <div className="flex items-center gap-3">
                           <mod.icon size={18} className={formState.permissions![mod.key as keyof UserPermissions] ? 'text-emerald-600' : 'text-gray-400'} />
                           <span className="text-xs font-bold text-gray-900">{mod.label}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={!!formState.permissions![mod.key as keyof UserPermissions]} 
                          onChange={() => handleTogglePermission(mod.key as keyof UserPermissions)}
                          className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[24px] font-bold text-sm uppercase">Cancelar</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-gray-900 text-white rounded-[24px] font-bold text-sm uppercase shadow-xl flex items-center justify-center gap-2">
                <Check size={18} /> {selectedUser ? 'Atualizar Usuário' : 'Confirmar e Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
