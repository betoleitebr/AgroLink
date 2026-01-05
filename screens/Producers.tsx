
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, MapPin, Phone, Mail, 
  ChevronRight, Building2, User, Landmark, ShieldCheck, 
  BarChart3, Settings2, Users2, FileText, LayoutGrid, X, 
  Check, Info, CreditCard, Droplets, Map as MapIcon, Trash2,
  ChevronDown, ChevronUp, Edit3, ArrowUpRight, Leaf, 
  HardDrive, Tractor, Zap, Wifi, History, Paperclip, Camera, Cloud
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Producer } from '../types';
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

  const allProducers = dataStore.getProducers();
  const [formState, setFormState] = useState<any>(null);
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (showForm) {
      if (selectedProducer) {
        setFormState({ 
          ...selectedProducer,
          // Garantir sub-objetos para evitar erros de undefined
          legal: selectedProducer.legal || {},
          structure: selectedProducer.structure || { activities: [], infrastructure: [] },
          commercial: selectedProducer.commercial || {},
          contacts: selectedProducer.contacts || { list: [] },
          history: (selectedProducer as any).history || { observations: '', origin: '' }
        });
      } else {
        setFormState({
          id: `p-${Date.now()}`,
          name: '',
          farmName: '',
          taxId: '',
          clientType: 'produtor',
          status: 'prospect',
          location: { address: '', city: '', state: '', region: '', totalArea: 0, productiveArea: 0, coordinates: { lat: 0, lng: 0 } },
          legal: { stateRegistration: '', car: '', ccir: '', environmentalStatus: 'Em análise', appArea: 0, licenses: '' },
          structure: { activities: [], system: 'sequeiro', techLevel: 'medio', infrastructure: [], seasonsPerYear: 1, crops: [] },
          contacts: { owner: '', manager: '', techResponsible: '', phone: '', email: '', whatsapp: '', list: [] },
          commercial: { creditLimit: 0, classification: 'C', paymentTerms: '', origin: '', history: '' },
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

  const handleSaveProducer = () => {
    dataStore.updateProducer(formState);
    setShowForm(false);
  };

  const filteredProducers = allProducers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.farmName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: Producer['status'] }) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-gray-100 text-gray-600',
      prospect: 'bg-sky-100 text-sky-700'
    };
    const labels = { active: 'Ativo', inactive: 'Inativo', prospect: 'Prospect' };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>{labels[status]}</span>;
  };

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
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
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-gray-900 shadow-sm">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProducers.map((producer) => {
          const isExpanded = expandedProducerId === producer.id;
          return (
            <div 
              key={producer.id}
              className={`bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-emerald-500/20 shadow-lg' : 'hover:shadow-md'}`}
            >
              <div 
                onClick={() => setExpandedProducerId(isExpanded ? null : producer.id)}
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-2xl transition-colors ${isExpanded ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{producer.name}</h3>
                      <StatusBadge status={producer.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{producer.farmName} • {producer.location.city}, {producer.location.state}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Área Total</p>
                      <p className="text-sm font-bold text-gray-900">{producer.location.totalArea} ha</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Talhões</p>
                      <p className="text-sm font-bold text-gray-900">{producer.properties.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedProducer(producer); setShowForm(true); }}
                      className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <Edit3 size={20} />
                    </button>
                    <div className="w-px h-8 bg-gray-100 mx-1" />
                    {isExpanded ? <ChevronUp size={24} className="text-gray-300" /> : <ChevronDown size={24} className="text-gray-300" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <MapIcon size={16} className="text-emerald-500" /> Talhões Vinculados
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {producer.properties.map(property => (
                      <div 
                        key={property.id}
                        onClick={() => navigate(`/field/${property.id}`)}
                        className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Leaf size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600">{property.name}</p>
                            <p className="text-[10px] text-gray-500">{property.cropType} • {property.area} ha</p>
                          </div>
                        </div>
                        <ArrowUpRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
                      </div>
                    ))}
                    <button onClick={() => navigate('/map')} className="p-4 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm font-bold">
                      <Plus size={18} /> Novo Talhão no Mapa
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && formState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 shadow-2xl">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProducer ? 'Editar Cadastro' : 'Novo Cliente'}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formState.farmName || 'Ficha Cadastral'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200">
                <X size={24} className="text-gray-400" />
              </button>
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
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="animate-in slide-in-from-right duration-300">
                
                {activeSection === 'identificacao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Razão Social / Nome</label>
                      <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome da Fazenda</label>
                      <input type="text" value={formState.farmName} onChange={e => setFormState({...formState, farmName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CPF / CNPJ</label>
                      <input type="text" value={formState.taxId} onChange={e => setFormState({...formState, taxId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Cliente</label>
                      <select value={formState.clientType} onChange={e => setFormState({...formState, clientType: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option value="produtor">Produtor</option>
                        <option value="arrendatario">Arrendatário</option>
                        <option value="grupo">Grupo</option>
                        <option value="cooperativa">Cooperativa</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                      <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="prospect">Prospect</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeSection === 'localizacao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                      <input type="text" value={formState.location.address} onChange={e => handleUpdateField('location', 'address', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Município e Estado</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Cidade" value={formState.location.city} onChange={e => handleUpdateField('location', 'city', e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                        <input type="text" placeholder="UF" value={formState.location.state} onChange={e => handleUpdateField('location', 'state', e.target.value)} className="w-20 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Região Agrícola</label>
                      <input type="text" value={formState.location.region} onChange={e => handleUpdateField('location', 'region', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Área Total (ha)</label>
                      <input type="number" value={formState.location.totalArea} onChange={e => handleUpdateField('location', 'totalArea', Number(e.target.value))} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm font-bold text-emerald-900" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Área Produtiva (ha)</label>
                      <input type="number" value={formState.location.productiveArea} onChange={e => handleUpdateField('location', 'productiveArea', Number(e.target.value))} className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-5 py-3 text-sm font-bold text-sky-900" />
                    </div>
                  </div>
                )}

                {activeSection === 'ambiental' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Inscrição Estadual</label>
                      <input type="text" value={formState.legal.stateRegistration} onChange={e => handleUpdateField('legal', 'stateRegistration', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CAR (Cadastro Ambiental Rural)</label>
                      <input type="text" value={formState.legal.car} onChange={e => handleUpdateField('legal', 'car', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Número CCIR</label>
                      <input type="text" value={formState.legal.ccir} onChange={e => handleUpdateField('legal', 'ccir', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Situação Ambiental</label>
                      <select value={formState.legal.environmentalStatus} onChange={e => handleUpdateField('legal', 'environmentalStatus', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm">
                        <option>Regularizado</option>
                        <option>Em análise</option>
                        <option>Pendente de adequação</option>
                        <option>Embargado</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Licenças Ambientais / Notas</label>
                      <textarea value={formState.legal.licenses} onChange={e => handleUpdateField('legal', 'licenses', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[100px]" placeholder="Informações sobre APP, reserva legal e licenças..." />
                    </div>
                  </div>
                )}

                {activeSection === 'producao' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sistema Produtivo</label>
                        <select value={formState.structure.system} onChange={e => handleUpdateField('structure', 'system', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm">
                          <option value="sequeiro">Sequeiro</option>
                          <option value="irrigado">Irrigado</option>
                          <option value="misto">Misto</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nível Tecnológico</label>
                        <select value={formState.structure.techLevel} onChange={e => handleUpdateField('structure', 'techLevel', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm">
                          <option value="alto">Alto</option>
                          <option value="medio">Médio</option>
                          <option value="baixo">Baixo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Safras por Ano</label>
                        <input type="number" value={formState.structure.seasonsPerYear} onChange={e => handleUpdateField('structure', 'seasonsPerYear', Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Atividades Principais (Grãos, Pecuária, etc.)</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formState.structure.activities.map((act: string, idx: number) => (
                          <span key={idx} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            {act}
                            <button onClick={() => handleUpdateField('structure', 'activities', formState.structure.activities.filter((_: any, i: number) => i !== idx))}><X size={12}/></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={newActivity} onChange={e => setNewActivity(e.target.value)} placeholder="Nova atividade..." className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" />
                        <button onClick={() => { if(newActivity) { handleUpdateField('structure', 'activities', [...formState.structure.activities, newActivity]); setNewActivity(''); }}} className="bg-emerald-600 text-white px-6 rounded-2xl font-bold text-sm">Add</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'infraestrutura' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'Armazéns / Silos', icon: Landmark },
                      { key: 'Máquinas e Implementos', icon: Tractor },
                      { key: 'Sistemas de Irrigação', icon: Droplets },
                      { key: 'Energia Elétrica', icon: Zap },
                      { key: 'Conectividade (Internet)', icon: Wifi },
                    ].map(item => {
                      const isChecked = formState.structure.infrastructure.includes(item.key);
                      return (
                        <label key={item.key} className={`flex items-center gap-4 p-5 rounded-[24px] border-2 cursor-pointer transition-all ${isChecked ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              const newList = isChecked 
                                ? formState.structure.infrastructure.filter((i: string) => i !== item.key)
                                : [...formState.structure.infrastructure, item.key];
                              handleUpdateField('structure', 'infrastructure', newList);
                            }}
                            className="hidden"
                          />
                          <item.icon size={24} className={isChecked ? 'text-emerald-600' : 'text-gray-400'} />
                          <span className={`text-sm font-bold ${isChecked ? 'text-emerald-900' : 'text-gray-500'}`}>{item.key}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {activeSection === 'pessoas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Contatos e Responsáveis</h4>
                      <button onClick={() => {
                        const newList = [...(formState.contacts.list || []), { id: Date.now(), name: '', role: ROLES[0], phone: '', email: '' }];
                        handleUpdateField('contacts', 'list', newList);
                      }} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Plus size={16} /> Adicionar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(formState.contacts.list || []).map((contact: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 relative group animate-in slide-in-from-bottom-2">
                          <button onClick={() => handleUpdateField('contacts', 'list', formState.contacts.list.filter((_: any, i: number) => i !== idx))} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nome</label>
                              <input type="text" value={contact.name} onChange={e => {
                                const newList = [...formState.contacts.list];
                                newList[idx].name = e.target.value;
                                handleUpdateField('contacts', 'list', newList);
                              }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Cargo / Função</label>
                              <select value={contact.role} onChange={e => {
                                const newList = [...formState.contacts.list];
                                newList[idx].role = e.target.value;
                                handleUpdateField('contacts', 'list', newList);
                              }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm">
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</label>
                              <input type="text" value={contact.phone} onChange={e => {
                                const newList = [...formState.contacts.list];
                                newList[idx].phone = e.target.value;
                                handleUpdateField('contacts', 'list', newList);
                              }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">E-mail</label>
                              <input type="text" value={contact.email} onChange={e => {
                                const newList = [...formState.contacts.list];
                                newList[idx].email = e.target.value;
                                handleUpdateField('contacts', 'list', newList);
                              }} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-2 text-sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'comercial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-xl space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Limite de Crédito</p>
                        <input type="number" value={formState.commercial.creditLimit} onChange={e => handleUpdateField('commercial', 'creditLimit', Number(e.target.value))} className="text-3xl font-bold bg-transparent border-none text-white focus:ring-0 w-full p-0" />
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Classificação</p>
                          <select value={formState.commercial.classification} onChange={e => handleUpdateField('commercial', 'classification', e.target.value)} className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold border-none">
                            <option value="A">Premium (A)</option>
                            <option value="B">Padrão (B)</option>
                            <option value="C">Econômico (C)</option>
                          </select>
                        </div>
                        <CreditCard size={32} className="text-gray-700" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Condições de Pagamento</label>
                        <input type="text" value={formState.commercial.paymentTerms} onChange={e => handleUpdateField('commercial', 'paymentTerms', e.target.value)} placeholder="Ex: Safra + 30 dias" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Origem do Cliente</label>
                        <input type="text" value={formState.commercial.origin} onChange={e => handleUpdateField('commercial', 'origin', e.target.value)} placeholder="Ex: Indicação / Marketing" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'relacionamento' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Data de Cadastro</label>
                        <input type="date" value={formState.history.registrationDate} onChange={e => handleUpdateField('history', 'registrationDate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Observações Estratégicas</label>
                      <textarea value={formState.history.observations} onChange={e => handleUpdateField('history', 'observations', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[150px]" placeholder="Histórico de atendimento, demandas recorrentes e pontos de atenção..." />
                    </div>
                  </div>
                )}

                {activeSection === 'documentos' && (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <Cloud size={48} className="text-gray-200 mb-4" />
                    <p className="text-sm font-bold text-gray-400">Arraste seus documentos aqui</p>
                    <p className="text-xs text-gray-400 mt-1">Laudos, Mapas, Contratos e Fotos (PDF/JPG)</p>
                    <button className="mt-6 bg-white border border-gray-200 px-6 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100">Selecionar Arquivos</button>
                  </div>
                )}

              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-3xl font-bold text-sm hover:bg-gray-200 transition-colors">
                Descartar
              </button>
              <button onClick={handleSaveProducer} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-bold text-sm shadow-xl shadow-gray-200 flex items-center justify-center gap-2">
                <Check size={18} /> Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Producers;
