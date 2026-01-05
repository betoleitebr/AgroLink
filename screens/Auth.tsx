
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, ShieldCheck, ArrowRight, Loader2, 
  AlertCircle, Eye, EyeOff, User, Phone, Key, ChevronLeft
} from 'lucide-react';
import { authStore } from '../services/authStore';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    code: ''
  });

  const [generatedCode, setGeneratedCode] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = authStore.login(formData.email.trim(), formData.password);
        if (user) {
          navigate('/');
        } else {
          setError('Acesso recusado. Verifique suas credenciais.');
        }
      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas digitadas não conferem.');
          setIsLoading(false);
          return;
        }
        const result = authStore.register(formData);
        if (result.success) {
          setGeneratedCode(result.code!);
          setMode('verify');
        } else {
          setError(result.error || 'Erro ao realizar cadastro.');
        }
      } else if (mode === 'verify') {
        if (formData.code.trim() === generatedCode) {
          authStore.verifyEmail(formData.email.trim());
          alert("Conta ativada com sucesso!");
          setMode('login');
        } else {
          setError('Código de ativação incorreto.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro no sistema. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="p-10 pb-8 text-center bg-gray-50/50">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-100 mb-6 rotate-3">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">AgroLink</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Plataforma de Gestão Corporativa</p>
        </div>

        <div className="px-10 pb-12 pt-8 space-y-6">
          {mode !== 'verify' && (
            <div className="flex bg-gray-100 p-1.5 rounded-[24px]">
              <button 
                onClick={() => setMode('login')} 
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setMode('register')} 
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Cadastrar
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {mode === 'login' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="admin@agrolink.com.br" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'register' && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="text" placeholder="Nome Completo" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="email" placeholder="E-mail Corporativo" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="tel" placeholder="WhatsApp (ex: 55...)" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="password" placeholder="Definir Senha" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="password" placeholder="Confirmar Senha" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            )}

            {mode === 'verify' && (
              <div className="space-y-6 text-center animate-in fade-in">
                <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex flex-col items-center gap-2">
                   <Key size={32} className="text-emerald-500 mb-2" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código de Ativação (Simulado)</p>
                   <p className="text-3xl font-black text-emerald-700 tracking-tighter">{generatedCode}</p>
                </div>
                <input 
                  type="text" 
                  placeholder="Digitar Código" 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-5 py-5 text-center text-3xl font-black outline-none focus:ring-4 focus:ring-emerald-500/10" 
                />
                <button type="button" onClick={() => setMode('register')} className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mx-auto hover:text-gray-600 transition-colors">
                  <ChevronLeft size={14} /> Voltar para o cadastro
                </button>
              </div>
            )}

            <button 
              disabled={isLoading} 
              className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : mode === 'register' ? 'Criar minha conta' : 'Ativar Acesso'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="pt-6 text-center border-t border-gray-50">
             <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">AgroLink Core v4.2 • 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
