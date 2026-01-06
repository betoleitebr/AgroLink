
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, MapPin, Phone, Mail, 
  ChevronRight, Building2, User, Landmark, ShieldCheck, 
  BarChart3, Settings2, Users2, FileText, LayoutGrid, X, 
  Check, Info, CreditCard, Droplets, Map as MapIcon, Trash2,
  ChevronDown, ChevronUp, Edit3, ArrowUpRight, Leaf, 
  HardDrive, Tractor, Zap, Wifi, History, Paperclip, Camera, Cloud, Loader2,
  Target, Gauge, Star
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Producer, ContactItem } from '../types';
import { useNavigate } from 'react-router-dom';

type SectionKey = 
  | 'identificacao' 
  | 'localizacao' 
  | 'ambiental' 
  | 'producao' 
  | 'infraestrutura' 
  | 'pessoas' 
  | 'comercial' 
  | 'relacionamento' 
  | 'documentos';

const ROLES = [
  "Produtor rural / Proprietário",
  "Gerente geral da fazenda",
  "Administrador rural / gestor financeiro",
  "Engenheiro agrônomo responsável técnico (RT)",
  "Técnico agrícola / técnico de campo",
  "Encarregado de campo / supervisor agrícola",
  "Operador de máquinas agrícolas (tratorista / colhedor)",
  "Aplicador de defensivos",
  "Responsável por irrigação (quando houver)",
  "Almoxarife / responsável por insumos"
];

const Producers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('identificacao');
  const [expandedProducerId, setExpandedProducerId] = useState<string | null>(null);

  const [allProducers, setAllProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await dataStore.getProducers();
      setAllProducers(data);
      setLoading(false);
    };
    load();
  }, []);

  const [formState, setFormState] = useState<any>(null);
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (showForm) {
      if (selectedProducer) {
        setFormState({ 
          ...selectedProducer,
          legal: selectedProducer.legal || {},
          structure: selectedProducer.structure || { activities: [], infrastructure: [] },
          commercial: selectedProducer.commercial || {},
          contacts: selectedProducer.contacts || { list: [] },
          history: selectedProducer.history || { observations: '', origin: '', registrationDate: '' }
        });
      } else {
        setFormState({
          id: `p-${Date.now()}`,
          name: '', farmName: '', taxId: '', clientType: 'produtor', status: 'prospect',
          location: { address: '', city: '', state: '', region: '', totalArea: 0, productiveArea: 0, coordinates: { lat: 0, lng: 0 } },
          legal: { stateRegistration: '', car: '', ccir: '', environmentalStatus: 'Em análise' },
          structure: { activities: [], system: 'sequeiro', techLevel: 'medio', infrastructure: [] },
          contacts: { phone: '', email: '', whatsapp: '', list: [] },
          commercial: { creditLimit: 0, classification: 'C', paymentTerms: '', origin: '' },
          history: { registrationDate: new Date().toISOString().split('T')[0], origin: '', observations: '' },
          properties: []
        });
      }
    }
  }, [showForm, selectedProducer]);

  const handleUpdateField = (section: string, field: string, value: any) => {
    setFormState((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveProducer = async () => {
    await dataStore.updateProducer(formState);
    const updated = await dataStore.getProducers();
    setAllProducers(updated);
    setShowForm(false);
  };

  const filteredProducers = allProducers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.farmName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SectionTab = ({ id, label, icon: Icon }: { id: SectionKey, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveSection(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap flex-shrink-0 ${
        activeSection === id 
        ? 'bg-emerald-600 text-white shadow-lg' 
        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'
      }`}
    >
      <Icon size={18} />
      <span className="text-xs font-bold uppercase">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carteira de Clientes</h1>
          <p className="text-sm text-gray-500">Gestão integrada de produtores e fazendas</p>
        </div>
        <button 
          onClick={() => { setSelectedProducer(null); setShowForm(true); }}
          className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou fazenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm outline-none transition-all"
          />
        </div>
        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-gray-900 shadow-sm"><Filter size={20} /></button>
      </div>

      {loading ? (
        <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" /> Sincronizando dados...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProducers.map((producer) => {
            const isExpanded = expandedProducerId === producer.id;
            const attendedArea = producer.properties.reduce((sum, prop) => sum + (Number(prop.area) || 0), 0);
            const productiveAreaNum = Number(producer.location.productiveArea) || 0;
            const coveragePercent = productiveAreaNum > 0 ? Math.min(100, Math.round((attendedArea / productiveAreaNum) * 100)) : 0;

            return (
              <div key={producer.id} className={`bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-emerald-500/20 shadow-xl' : 'hover:shadow-md'}`}>
                <div onClick={() => setExpandedProducerId(isExpanded ? null : producer.id)} className="p-8 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className={`p-5 rounded-3xl transition-all duration-500 ${isExpanded ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><Building2 size={32} /></div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-gray-900 tracking-tighter">{producer.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${producer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{producer.status}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{producer.farmName} • {producer.location.city}, {producer.location.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProducer(producer); setShowForm(true); }} className="p-3 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"><Edit3 size={20} /></button>
                    {isExpanded ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50/50 border-t border-gray-100 p-8 animate-in slide-in-from-top duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><MapIcon size={14} className="text-emerald-500" /> Talhões</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {producer.properties.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                              <div><p className="text-xs font-bold">{p.name}</p><p className="text-[9px] text-gray-400 uppercase">{p.cropType} • {p.area} ha</p></div>
                              <button onClick={() => navigate(`/field/${p.id}`)} className="text-emerald-500"><ArrowUpRight size={16}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Users2 size={14} className="text-sky-500" /> Equipe do Produtor</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {producer.contacts.list.map(c => (
                            <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                              <div className={`p-2 rounded-xl ${c.isPrimary ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-400'}`}><User size={14}/></div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">{c.name} {c.isPrimary && <Star size={10} className="fill-emerald-500 text-emerald-500" />}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{c.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && formState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Edit3 size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProducer ? 'Editar Cadastro' : 'Novo Cliente'}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formState.farmName || 'Ficha Cadastral'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={24} className="text-gray-400" /></button>
            </div>

            <div className="flex overflow-x-auto p-4 gap-2 bg-white border-b border-gray-50 scrollbar-hide">
              <SectionTab id="identificacao" label="Identificação" icon={User} />
              <SectionTab id="localizacao" label="Localização" icon={MapIcon} />
              <SectionTab id="ambiental" label="Ambiental" icon={ShieldCheck} />
              <SectionTab id="producao" label="Produção" icon={Leaf} />
              <SectionTab id="infraestrutura" label="Infraestrutura" icon={HardDrive} />
              <SectionTab id="pessoas" label="Pessoas" icon={Users2} />
              <SectionTab id="comercial" label="Comercial" icon={CreditCard} />
              <SectionTab id="relacionamento" label="Relacionamento" icon={History} />
              <SectionTab id="documentos" label="Anexos" icon={Paperclip} />
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="animate-in slide-in-from-right duration-300">
                {activeSection === 'identificacao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Razão Social</label><input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome da Fazenda</label><input type="text" value={formState.farmName} onChange={e => setFormState({...formState, farmName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CNPJ / CPF</label><input type="text" value={formState.taxId} onChange={e => setFormState({...formState, taxId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tipo</label>
                      <select value={formState.clientType} onChange={e => setFormState({...formState, clientType: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                        <option value="produtor">Produtor</option><option value="grupo">Grupo</option><option value="cooperativa">Cooperativa</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSection === 'localizacao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Endereço</label><input type="text" value={formState.location.address} onChange={e => handleUpdateField('location', 'address', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cidade</label><input type="text" value={formState.location.city} onChange={e => handleUpdateField('location', 'city', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">UF</label><input type="text" value={formState.location.state} onChange={e => handleUpdateField('location', 'state', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Área Total (ha)</label><input type="number" value={formState.location.totalArea} onChange={e => handleUpdateField('location', 'totalArea', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Área Produtiva (ha)</label><input type="number" value={formState.location.productiveArea} onChange={e => handleUpdateField('location', 'productiveArea', e.target.value)} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-bold" /></div>
                  </div>
                )}

                {activeSection === 'ambiental' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Status Ambiental</label><select value={formState.legal.environmentalStatus} onChange={e => handleUpdateField('legal', 'environmentalStatus', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm"><option value="Regularizado">Regularizado</option><option value="Em análise">Em análise</option><option value="Pendente">Pendente</option></select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Inscrição Estadual</label><input type="text" value={formState.legal.stateRegistration} onChange={e => handleUpdateField('legal', 'stateRegistration', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Número do CAR</label><input type="text" value={formState.legal.car} onChange={e => handleUpdateField('legal', 'car', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Número do CCIR</label><input type="text" value={formState.legal.ccir} onChange={e => handleUpdateField('legal', 'ccir', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                  </div>
                )}

                {activeSection === 'producao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sistema Produtivo</label>
                      <select value={formState.structure.system} onChange={e => handleUpdateField('structure', 'system', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                        <option value="sequeiro">Sequeiro</option><option value="irrigado">Irrigado</option><option value="misto">Misto</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nível Tecnológico</label>
                      <select value={formState.structure.techLevel} onChange={e => handleUpdateField('structure', 'techLevel', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                        <option value="baixo">Baixo</option><option value="medio">Médio</option><option value="alto">Alto</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Atividades Principais (Enter para adicionar)</label>
                       <div className="flex gap-2">
                          <input type="text" value={newActivity} onChange={e => setNewActivity(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(newActivity.trim()) { handleUpdateField('structure', 'activities', [...formState.structure.activities, newActivity.trim()]); setNewActivity(''); } } }} className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {formState.structure.activities.map((act: string, idx: number) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                              {act} <button onClick={() => handleUpdateField('structure', 'activities', formState.structure.activities.filter((_:any, i:number) => i !== idx))}><X size={12}/></button>
                            </span>
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {activeSection === 'infraestrutura' && (
                   <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">Lista de Infraestruturas e Recursos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Silos', 'Armazéns', 'Oficina', 'Dormitórios', 'Energia Solar', 'Gerador', 'Internet Starlink', 'Conectividade 4G', 'Pista de Pouso'].map(item => (
                          <label key={item} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${formState.structure.infrastructure.includes(item) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                             <input type="checkbox" className="hidden" checked={formState.structure.infrastructure.includes(item)} onChange={() => {
                               const list = formState.structure.infrastructure.includes(item) ? formState.structure.infrastructure.filter((i:string) => i !== item) : [...formState.structure.infrastructure, item];
                               handleUpdateField('structure', 'infrastructure', list);
                             }} />
                             <span className="text-xs font-bold">{item}</span>
                          </label>
                        ))}
                      </div>
                   </div>
                )}

                {activeSection === 'pessoas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Pessoas e Responsáveis</h4>
                      <button onClick={() => {
                        const newList = [...(formState.contacts.list || []), { 
                          id: `c-${Date.now()}`, name: '', role: ROLES[0], phone: '', email: '', isPrimary: formState.contacts.list?.length === 0 
                        }];
                        handleUpdateField('contacts', 'list', newList);
                      }} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Plus size={16} /> Adicionar Pessoa
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(formState.contacts.list || []).map((contact: ContactItem, idx: number) => (
                        <div key={contact.id} className={`bg-gray-50 p-6 rounded-[32px] border transition-all relative ${contact.isPrimary ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-gray-100'}`}>
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                             <button onClick={() => {
                               const newList = formState.contacts.list.map((c: any) => ({ ...c, isPrimary: c.id === contact.id }));
                               handleUpdateField('contacts', 'list', newList);
                             }} title="Contato Principal" className={`p-2 rounded-xl transition-all ${contact.isPrimary ? 'text-emerald-600 bg-emerald-50' : 'text-gray-300 hover:text-emerald-600'}`}>
                               <Star size={18} className={contact.isPrimary ? 'fill-emerald-500' : ''} />
                             </button>
                             <button onClick={() => handleUpdateField('contacts', 'list', formState.contacts.list.filter((_: any, i: number) => i !== idx))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nome</label><input type="text" value={contact.name} onChange={e => { const list = [...formState.contacts.list]; list[idx].name = e.target.value; handleUpdateField('contacts', 'list', list); }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Cargo</label><select value={contact.role} onChange={e => { const list = [...formState.contacts.list]; list[idx].role = e.target.value; handleUpdateField('contacts', 'list', list); }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Fone</label><input type="text" value={contact.phone} onChange={e => { const list = [...formState.contacts.list]; list[idx].phone = e.target.value; handleUpdateField('contacts', 'list', list); }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">E-mail</label><input type="text" value={contact.email} onChange={e => { const list = [...formState.contacts.list]; list[idx].email = e.target.value; handleUpdateField('contacts', 'list', list); }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'comercial' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Limite de Crédito (R$)</label><input type="number" value={formState.commercial.creditLimit} onChange={e => handleUpdateField('commercial', 'creditLimit', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold" /></div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Classificação</label>
                        <select value={formState.commercial.classification} onChange={e => handleUpdateField('commercial', 'classification', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                           <option value="A">Classificação A (Premium)</option><option value="B">Classificação B (Médio)</option><option value="C">Classificação C (Potencial)</option>
                        </select>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Condição de Pagamento Padrão</label><input type="text" value={formState.commercial.paymentTerms} onChange={e => handleUpdateField('commercial', 'paymentTerms', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Origem do Cliente</label><input type="text" value={formState.commercial.origin} onChange={e => handleUpdateField('commercial', 'origin', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                   </div>
                )}

                {activeSection === 'relacionamento' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data de Cadastro</label><input type="date" value={formState.history.registrationDate} onChange={e => handleUpdateField('history', 'registrationDate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Canal de Aquisição</label><input type="text" value={formState.history.origin} onChange={e => handleUpdateField('history', 'origin', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Observações Estratégicas</label><textarea value={formState.history.observations} onChange={e => handleUpdateField('history', 'observations', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 text-sm min-h-[150px] resize-none" /></div>
                  </div>
                )}

                {activeSection === 'documentos' && (
                  <div className="py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] text-center space-y-4">
                     <Paperclip size={48} className="text-gray-200 mx-auto" />
                     <p className="text-sm font-bold text-gray-400">Arraste arquivos ou anexe documentos do produtor aqui.</p>
                     <button className="bg-white border border-gray-200 px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all">Explorar Arquivos</button>
                  </div>
                )}

              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-3xl font-bold text-sm">Descartar</button>
              <button onClick={handleSaveProducer} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"><Check size={18} /> Salvar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Producers;
