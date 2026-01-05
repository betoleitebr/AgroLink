
import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Ruler, Leaf, Activity, ChevronRight, AlertCircle, 
  Droplets, Thermometer, Wind, Beaker, ShieldCheck, TrendingUp, Info, 
  Map as MapIcon, HardDrive, Tractor, User, DollarSign, Camera, FileText,
  LayoutGrid, Cloud, History as HistoryIcon, Plus, X, Check, CalendarPlus,
  ArrowUpRight, ArrowRight, Bug, AlertTriangle, Send, Search, Eye, Sparkles, Save, Edit3,
  Clock, FlaskConical, Target, ListChecks, Mountain, Trash2
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Visit, Property, SoilFertility, CropHistory } from '../types';

const FieldDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'geral' | 'solo' | 'manejo' | 'clima' | 'economico' | 'ocorrencias'>('geral');
  
  // Estados de UI e Edição
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<Visit | null>(null);
  const [selectedSoilHistory, setSelectedSoilHistory] = useState<SoilFertility | null>(null);
  const [selectedCropHistory, setSelectedCropHistory] = useState<CropHistory | null>(null);
  const [isEditingTech, setIsEditingTech] = useState(false);
  
  // Estados para Agendamento
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Buscar dados do talhão e produtor
  const producers = dataStore.getProducers();
  const property = producers.flatMap(p => p.properties).find(prop => prop.id === id);
  const producer = producers.find(p => p.properties.some(prop => prop.id === id));
  
  // Estado local para edição dos dados do talhão
  const [editProperty, setEditProperty] = useState<Property | null>(null);

  // Histórico de Visitas Concluídas para este Talhão
  const propertyHistory = useMemo(() => {
    return dataStore.getVisits()
      .filter(v => v.propertyId === id && v.status === 'completed')
      .sort((a, b) => new Date(b.checkOutTime || b.date).getTime() - new Date(a.checkOutTime || a.date).getTime());
  }, [id, dataStore.getVisits()]);

  if (!property || !producer) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Talhão não encontrado</h2>
        <button onClick={() => navigate(-1)} className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-full font-bold">Voltar</button>
      </div>
    );
  }

  const handleStartVisit = () => {
    const existingPending = dataStore.getVisits().find(v => v.propertyId === id && v.status === 'pending');
    if (existingPending) {
      navigate(`/visit-session/${existingPending.id}`);
    } else {
      const newVisitId = `v-now-${Date.now()}`;
      const newVisit: Visit = {
        id: newVisitId,
        producerId: producer.id,
        propertyId: property.id,
        date: new Date().toISOString().split('T')[0],
        status: 'ongoing',
        notes: ''
      };
      dataStore.addVisit(newVisit);
      navigate(`/visit-session/${newVisitId}`);
    }
  };

  const handleScheduleVisit = () => {
    if (!scheduleDate) return alert("Selecione uma data para o agendamento.");
    
    const newVisit: Visit = {
      id: `v-sch-${Date.now()}`,
      producerId: producer.id,
      propertyId: property.id,
      date: scheduleDate,
      status: 'pending',
      notes: scheduleNotes
    };
    
    dataStore.addVisit(newVisit);
    setShowScheduleModal(false);
    setScheduleDate('');
    setScheduleNotes('');
    alert("Visita agendada com sucesso!");
  };

  const handleDeleteProperty = () => {
    dataStore.deleteProperty(producer.id, property.id);
    navigate('/map');
  };

  const startTechEdit = () => {
    // Garantir que a estrutura física exista no clone para evitar erros de undefined no formulário
    const clone = JSON.parse(JSON.stringify(property));
    if (!clone.physical) {
      clone.physical = {
        soilType: '',
        texture: 'Média',
        declivity: 'Suave Ondulado',
        altitude: 0,
        drainage: 'Boa'
      };
    }
    setEditProperty(clone); 
    setIsEditingTech(true);
  };

  const saveTechEdit = () => {
    if (!editProperty) return;
    
    let updatedProperty = { ...editProperty };
    
    // 1. Lógica especial para histórico de SOLO
    if (activeTab === 'solo' && editProperty.soilFertility) {
      const currentFertility = editProperty.soilFertility;
      const originalFertility = property.soilFertility;
      if (!originalFertility || originalFertility.analysisDate !== currentFertility.analysisDate) {
        const newHistory = [currentFertility, ...(property.soilHistory || [])]
          .filter((item, index, self) => index === self.findIndex((t) => t.analysisDate === item.analysisDate))
          .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
        updatedProperty.soilHistory = newHistory;
      }
    }

    // 2. Lógica especial para histórico de PLANEJAMENTO (Manejo)
    if (activeTab === 'manejo' && editProperty.cropHistory) {
      const currentPlan = editProperty.cropHistory;
      const originalPlan = property.cropHistory;
      
      if (!originalPlan || originalPlan.plantingDate !== currentPlan.plantingDate || originalPlan.safra !== currentPlan.safra) {
        const newCropHistory = [currentPlan, ...(property.cropHistoryHistory || [])]
          .filter((item, index, self) => index === self.findIndex((t) => t.plantingDate === item.plantingDate && t.safra === item.safra))
          .sort((a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime());
        updatedProperty.cropHistoryHistory = newCropHistory;
      }
    }
    
    const updatedProperties = producer.properties.map(p => 
      p.id === property.id ? updatedProperty : p
    );
    
    dataStore.updateProducer({
      ...producer,
      properties: updatedProperties
    });
    
    setIsEditingTech(false);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsEditingTech(false); }}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border-2 flex-shrink-0 ${
        activeTab === id ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{producer.name} • {producer.farmName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            title="Agendar Visita"
           >
             <CalendarPlus size={18} />
           </button>
           
           {!isEditingTech ? (
             <button 
              onClick={startTechEdit}
              className="bg-white border border-gray-100 p-2 rounded-xl text-gray-400 hover:text-emerald-600 transition-colors shadow-sm"
              title="Editar Dados Técnicos"
             >
               <Edit3 size={18} />
             </button>
           ) : (
             <button 
              onClick={saveTechEdit}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"
             >
               <Save size={16} /> Salvar Alterações
             </button>
           )}

           <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-white border border-gray-100 p-2 rounded-xl text-gray-400 hover:text-red-600 transition-colors shadow-sm"
            title="Excluir Talhão"
           >
             <Trash2 size={18} />
           </button>

           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{property.cropType}</span>
           <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full uppercase">{property.area} ha</span>
        </div>
      </header>

      {/* Navegação Técnica */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        <TabButton id="geral" label="Visão Geral" icon={LayoutGrid} />
        <TabButton id="solo" label="Solo & Fertilidade" icon={Beaker} />
        <TabButton id="manejo" label="Planejamento" icon={ShieldCheck} />
        <TabButton id="clima" label="Clima" icon={Cloud} />
        <TabButton id="economico" label="Financeiro" icon={TrendingUp} />
        <TabButton id="ocorrencias" label="Monitoramento" icon={Activity} />
      </div>

      <div className="animate-in fade-in duration-500">
        
        {/* ABA GERAL */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <Leaf size={120} className="absolute -bottom-8 -right-8 opacity-10" />
                <p className="text-xs font-bold uppercase opacity-80 mb-1">Cultura Ativa</p>
                <h3 className="text-3xl font-bold">{property.cropType}</h3>
                <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-60">Variedade</p>
                    <p className="font-bold text-xs truncate">{property.cropHistory?.variety || 'Pendente'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-60">Área</p>
                    <p className="font-bold text-xs">{property.area} ha</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><MapIcon size={14}/> Características Físicas</h4>
                  
                  {isEditingTech ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-gray-400 uppercase">Classificação do Solo</label>
                        <input type="text" value={editProperty?.physical?.soilType || ''} onChange={e => setEditProperty({...editProperty!, physical: {...editProperty!.physical!, soilType: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs" placeholder="Ex: Latossolo Vermelho" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Textura</label>
                          <select value={editProperty?.physical?.texture || ''} onChange={e => setEditProperty({...editProperty!, physical: {...editProperty!.physical!, texture: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs">
                             <option value="Argilosa">Argilosa</option>
                             <option value="Arenosa">Arenosa</option>
                             <option value="Média">Média</option>
                             <option value="Siltosa">Siltosa</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-400 uppercase">Drenagem</label>
                          <select value={editProperty?.physical?.drainage || ''} onChange={e => setEditProperty({...editProperty!, physical: {...editProperty!.physical!, drainage: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs">
                             <option value="Boa">Boa</option>
                             <option value="Média">Média</option>
                             <option value="Ruim">Ruim</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">Tipo de Solo</span>
                        <span className="text-xs font-bold text-gray-900">{property.physical?.soilType || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">Textura</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{property.physical?.texture || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">Declividade</span>
                        <span className="text-xs font-bold text-gray-900">{property.physical?.declivity || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">Altitude</span>
                        <span className="text-xs font-bold text-gray-900">{property.physical?.altitude || '-'} m</span>
                      </div>
                    </div>
                  )}
                </div>
                {!isEditingTech && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-2xl flex items-center gap-3">
                    <Droplets className="text-emerald-500" size={18} />
                    <p className="text-[10px] font-bold text-emerald-900 uppercase">Drenagem: <span className="font-black text-emerald-600">{property.physical?.drainage || 'Normal'}</span></p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><TrendingUp size={14}/> Produtividade</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-sky-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-sky-600 uppercase">V% Base</p>
                      <p className="text-lg font-bold text-sky-900">{property.soilFertility?.vPercentage || '0'}%</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Status</p>
                      <p className="text-lg font-bold text-emerald-900">Bom</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleStartVisit} className="flex-1 bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-bold shadow-lg uppercase">Iniciar Visita</button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><HistoryIcon size={20} className="text-emerald-500" /> Atividades Recentes</h3>
                <button onClick={() => setActiveTab('ocorrencias')} className="text-xs font-bold text-emerald-600 uppercase underline">Ver Histórico Completo</button>
              </div>
              <div className="space-y-6">
                {propertyHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText size={40} className="text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-400 italic text-sm">Aguardando primeira visita de campo.</p>
                  </div>
                ) : (
                  propertyHistory.slice(0, 3).map((visit, i) => (
                    <div 
                      key={visit.id} 
                      onClick={() => setSelectedVisitDetail(visit)}
                      className="flex gap-5 group cursor-pointer hover:bg-gray-50/80 p-4 -m-4 rounded-3xl transition-all"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                        {i < 2 && <div className="w-0.5 h-full bg-gray-100 mt-2" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-gray-900 text-sm">Relatório Técnico - Visita #{propertyHistory.length - i}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(visit.checkOutTime || visit.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{visit.notes || 'Monitoramento de rotina e saúde vegetal.'}</p>
                        {visit.photos && visit.photos.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-hidden">
                            {visit.photos.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                <img src={img} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ABA SOLO */}
        {activeTab === 'solo' && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2"><Beaker size={18} className="text-purple-500"/> Laudo de Fertilidade Atual</h4>
                    <div className="flex items-center gap-2">
                       <Clock size={12} className="text-gray-400" />
                       <span className="text-[10px] font-black text-gray-400 uppercase">Laudo de {new Date(property.soilFertility?.analysisDate || Date.now()).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                {isEditingTech ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Data da Análise</label>
                        <input type="date" value={editProperty?.soilFertility?.analysisDate || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, analysisDate: e.target.value}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">pH (H2O)</label>
                        <input type="number" step="0.1" value={editProperty?.soilFertility?.ph || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, ph: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">M.O. (%)</label>
                        <input type="number" step="0.1" value={editProperty?.soilFertility?.organicMatter || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, organicMatter: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Fósforo (P)</label>
                        <input type="number" value={editProperty?.soilFertility?.phosphorus || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, phosphorus: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Potássio (K)</label>
                        <input type="number" step="0.01" value={editProperty?.soilFertility?.potassium || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, potassium: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">V% (Bases)</label>
                        <input type="number" value={editProperty?.soilFertility?.vPercentage || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, vPercentage: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-sm font-bold text-emerald-700" />
                      </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">pH (H2O)</p>
                        <p className="text-xl font-bold text-gray-900">{property.soilFertility?.ph || '6.2'}</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">M.O. (%)</p>
                        <p className="text-xl font-bold text-gray-900">{property.soilFertility?.organicMatter || '3.5'}</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">P (Fósforo)</p>
                        <p className="text-xl font-bold text-gray-900">{property.soilFertility?.phosphorus || '18'}</p>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">V% Bases</p>
                        <p className="text-xl font-bold text-gray-900">{property.soilFertility?.vPercentage || '65'}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center justify-between">Macronutrientes</h4>
                <div className="space-y-4">
                    {isEditingTech ? (
                       <div className="space-y-3">
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">Cálcio (Ca)</span>
                             <input type="number" step="0.1" value={editProperty?.soilFertility?.calcium || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, calcium: Number(e.target.value)}})} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-black" />
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">Magnésio (Mg)</span>
                             <input type="number" step="0.1" value={editProperty?.soilFertility?.magnesium || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, magnesium: Number(e.target.value)}})} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-black" />
                          </div>
                          <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-xl">
                             <span className="text-[10px] font-bold text-emerald-600 uppercase">CTC Efetiva</span>
                             <input type="number" step="0.1" value={editProperty?.soilFertility?.ctc || ''} onChange={e => setEditProperty({...editProperty!, soilFertility: {...editProperty!.soilFertility!, ctc: Number(e.target.value)}})} className="w-16 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-black" />
                          </div>
                       </div>
                    ) : (
                      <>
                        {[
                          { label: 'Cálcio (Ca)', value: property.soilFertility?.calcium || '4.5' },
                          { label: 'Magnésio (Mg)', value: property.soilFertility?.magnesium || '1.2' },
                          { label: 'Potássio (K)', value: property.soilFertility?.potassium || '0.45' },
                          { label: 'CTC Efetiva', value: property.soilFertility?.ctc || '12.8' }
                        ].map((nut, nIdx) => (
                          <div key={nIdx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-xs text-gray-500">{nut.label}</span>
                            <span className="text-xs font-black text-gray-900">{nut.value}</span>
                          </div>
                        ))}
                      </>
                    )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2"><HistoryIcon size={18} className="text-emerald-500" /> Evolução de Solo</h4>
               <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                  {property.soilHistory && property.soilHistory.length > 0 ? (
                    property.soilHistory.map((item, idx) => (
                      <div key={idx} onClick={() => setSelectedSoilHistory(item)} className="flex-shrink-0 w-64 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                         <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">{new Date(item.analysisDate).toLocaleDateString('pt-BR')}</span>
                         <div className="grid grid-cols-2 gap-3 mt-4">
                            <div><p className="text-[8px] font-bold text-gray-400 uppercase">pH</p><p className="text-xs font-black">{item.ph}</p></div>
                            <div><p className="text-[8px] font-bold text-gray-400 uppercase">V%</p><p className="text-xs font-black">{item.vPercentage}%</p></div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 font-bold italic p-8 bg-gray-50 w-full rounded-3xl text-center border-2 border-dashed">Sem histórico anterior.</p>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* ABA MANEJO (PLANEJAMENTO) - EDITÁVEL E COM HISTÓRICO */}
        {activeTab === 'manejo' && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 flex flex-col justify-between min-h-[450px]">
                <div>
                   <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-8"><Tractor size={20} className="text-orange-500"/> Definição de Plantio</h4>
                   
                   {isEditingTech ? (
                    <div className="space-y-6">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Safra Correspondente</label>
                          <input type="text" value={editProperty?.cropHistory?.safra || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, safra: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold" placeholder="Ex: 2025/26" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Sistema Adotado</label>
                          <select value={editProperty?.cropHistory?.plantingSystem || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, plantingSystem: e.target.value}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm font-bold text-emerald-900">
                             <option value="Plantio Direto">Plantio Direto</option>
                             <option value="Convencional">Convencional</option>
                             <option value="Mínimo">Cultivo Mínimo</option>
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-gray-400 uppercase">Variedade / Híbrido</label>
                             <input type="text" value={editProperty?.cropHistory?.variety || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, variety: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-gray-400 uppercase">População (pl/ha)</label>
                             <input type="number" value={editProperty?.cropHistory?.plantPopulation || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, plantPopulation: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" />
                          </div>
                       </div>
                    </div>
                   ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-orange-50/50 rounded-[32px] border border-orange-100 flex items-start gap-4">
                         <HardDrive className="text-orange-600 mt-1" size={24} />
                         <div>
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Sistema Adotado</p>
                            <p className="text-lg font-black text-orange-900">{property.cropHistory?.plantingSystem || 'Plantio Direto'}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Safra Atual</p>
                            <p className="text-sm font-black">{property.cropHistory?.safra || '2025/26'}</p>
                         </div>
                         <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Variedade</p>
                            <p className="text-sm font-black truncate">{property.cropHistory?.variety || 'P9280 - M6.2'}</p>
                         </div>
                      </div>
                    </div>
                   )}
                </div>
              </div>

              <div className="bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[450px]">
                <ShieldCheck size={180} className="absolute -right-16 -bottom-16 opacity-5" />
                <div className="relative z-10">
                   <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-10 flex items-center gap-2"><Calendar size={16}/> Cronograma Técnico Operacional</h4>
                   
                   {isEditingTech ? (
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 ml-1"><ArrowRight size={12} className="text-emerald-500" /> Data de Plantio</label>
                            <input type="date" value={editProperty?.cropHistory?.plantingDate || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, plantingDate: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-xl font-bold text-white outline-none focus:border-emerald-500 transition-colors" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 ml-1"><Target size={12} className="text-orange-500" /> Data de Colheita Prevista</label>
                            <input type="date" value={editProperty?.cropHistory?.harvestDate || ''} onChange={e => setEditProperty({...editProperty!, cropHistory: {...editProperty!.cropHistory!, harvestDate: e.target.value}})} className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-xl font-bold text-white outline-none focus:border-orange-500 transition-colors" />
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-10">
                         <div className="flex gap-6 items-center group">
                            <div className="p-4 bg-white/10 rounded-3xl transition-transform group-hover:scale-110"><Calendar size={28} className="text-emerald-400" /></div>
                            <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Data Efetiva de Plantio</p>
                               <p className="text-2xl font-black">{property.cropHistory?.plantingDate ? new Date(property.cropHistory.plantingDate).toLocaleDateString('pt-BR') : '12 Out 2025'}</p>
                            </div>
                         </div>
                         <div className="flex gap-6 items-center group">
                            <div className="p-4 bg-white/10 rounded-3xl transition-transform group-hover:scale-110"><Tractor size={28} className="text-orange-400" /></div>
                            <div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Colheita Prevista</p>
                               <p className="text-2xl font-black">{property.cropHistory?.harvestDate ? new Date(property.cropHistory.harvestDate).toLocaleDateString('pt-BR') : '25 Fev 2026'}</p>
                            </div>
                         </div>
                         <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-2 text-center">Status do Ciclo</p>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
              </div>
            </div>

            {/* SEÇÃO DE HISTÓRICO DE PLANEJAMENTO */}
            <div className="space-y-4">
               <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2"><ListChecks size={18} className="text-emerald-500" /> Histórico de Safras & Planejamento</h4>
               <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                  {property.cropHistoryHistory && property.cropHistoryHistory.length > 0 ? (
                    property.cropHistoryHistory.map((plan, idx) => (
                      <div key={idx} onClick={() => setSelectedCropHistory(plan)} className="flex-shrink-0 w-72 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Tractor size={60} /></div>
                         <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Safra {plan.safra}</span>
                            <FlaskConical size={14} className="text-gray-200" />
                         </div>
                         <h5 className="font-black text-gray-900 mb-4">{plan.variety}</h5>
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-bold uppercase tracking-tight">Plantio</span><span className="font-bold text-gray-700">{new Date(plan.plantingDate).toLocaleDateString('pt-BR')}</span></div>
                            <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-bold uppercase tracking-tight">Sistema</span><span className="font-bold text-gray-700">{plan.plantingSystem}</span></div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                            <Eye size={12} /> Ver Detalhes do Plano
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full bg-gray-50 p-12 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                       <p className="text-sm text-gray-400 font-bold italic">Ainda não há registros de safras anteriores para este talhão.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* ABA MONITORAMENTO */}
        {activeTab === 'ocorrencias' && (
           <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between">
                <div>
                   <h4 className="text-xl font-black text-gray-900 tracking-tighter">Diário de Bordo</h4>
                   <p className="text-xs text-gray-500 font-medium">Linha do tempo de todas as visitas técnicas</p>
                </div>
                <button onClick={handleStartVisit} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                  <Plus size={18} /> Nova Visita
                </button>
              </div>

              {propertyHistory.length === 0 ? (
                <div className="bg-white p-24 rounded-[48px] text-center border border-gray-100 shadow-inner">
                   <Activity size={56} className="text-gray-100 mx-auto mb-6 animate-pulse" />
                   <h5 className="text-lg font-bold text-gray-400">Nenhum registro encontrado</h5>
                   <p className="text-sm text-gray-300 max-w-xs mx-auto mt-2">Inicie uma visita agora para registrar os primeiros dados de monitoramento deste talhão.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {propertyHistory.map((v, vIdx) => (
                      <div key={v.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Leaf size={120} /></div>
                         <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100"><FileText size={24} /></div>
                               <div>
                                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{new Date(v.checkOutTime || v.date).toLocaleDateString('pt-BR')}</p>
                                  <h5 className="text-lg font-black text-gray-900 tracking-tight">Visita Técnica #{propertyHistory.length - vIdx}</h5>
                               </div>
                            </div>
                            <button onClick={() => setSelectedVisitDetail(v)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all"><Eye size={20} /></button>
                         </div>
                         <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-red-50 p-3 rounded-2xl border border-red-100"><p className="text-[8px] font-black text-red-600 uppercase">Pragas</p><p className="text-[10px] font-bold text-red-900 truncate">{v.pests || 'Nenhuma'}</p></div>
                            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100"><p className="text-[8px] font-black text-orange-600 uppercase">Doenças</p><p className="text-[10px] font-bold text-orange-900 truncate">{v.diseases || 'Nenhuma'}</p></div>
                            <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100"><p className="text-[8px] font-black text-yellow-600 uppercase">Daninhas</p><p className="text-[10px] font-bold text-yellow-900 truncate">{v.weeds || 'Área Limpa'}</p></div>
                         </div>
                         <p className="text-sm text-gray-600 font-medium italic mb-8 leading-relaxed line-clamp-3">"{v.notes || 'Monitoramento preventivo realizado.'}"</p>
                         {v.photos && v.photos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                               {v.photos.map((photo, pIdx) => (
                                  <div key={pIdx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                                     <img src={photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
              )}
           </div>
        )}

        {/* CLIMA & FINANCEIRO - DINÂMICOS */}
        {activeTab === 'clima' && (
           <div className="space-y-8 animate-in slide-in-from-right">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
                    <Cloud className="text-sky-400 mx-auto mb-4" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risco da Safra</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{property.climate?.climateRisk || 'Baixo'}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
                    <Droplets className="text-sky-500 mx-auto mb-4" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chuva Acumulada</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{property.climate?.accumulatedRain || '450'} <span className="text-xs text-gray-400">mm</span></p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
                    <Thermometer className="text-orange-400 mx-auto mb-4" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temp. Média</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{property.climate?.avgTemp || '26'}°C</p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
                    <Wind className="text-gray-400 mx-auto mb-4" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vento Predom.</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">14 <span className="text-xs text-gray-400">km/h</span></p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'economico' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right">
              <div className="bg-gray-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-[400px]">
                 <DollarSign size={200} className="absolute -right-16 -bottom-16 opacity-5" />
                 <div>
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Investimento Total Estimado</p>
                    <h3 className="text-7xl font-black tracking-tighter">R$ {((property.economic?.inputCost || 4500) + (property.economic?.operationalCost || 1200)).toLocaleString('pt-BR')}</h3>
                    <p className="text-sm text-gray-500 mt-2">Valor Total por Hectare (R$/ha)</p>
                 </div>
                 <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                    <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Insumos</p><p className="text-2xl font-black">R$ {property.economic?.inputCost?.toLocaleString('pt-BR') || '4.500'}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Operacional</p><p className="text-2xl font-black">R$ {property.economic?.operationalCost?.toLocaleString('pt-BR') || '1.200'}</p></div>
                 </div>
              </div>
              <div className="bg-white p-12 rounded-[56px] shadow-sm border border-gray-100 flex flex-col justify-between h-[400px]">
                 <div className="space-y-10">
                    <div className="flex justify-between items-start">
                       <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Margem de Lucro Projetada</p><h4 className="text-5xl font-black text-gray-900 tracking-tighter">R$ {property.economic?.grossMargin?.toLocaleString('pt-BR') || '5.800'}</h4></div>
                       <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[28px] shadow-sm"><TrendingUp size={32} /></div>
                    </div>
                    <div>
                       <div className="flex justify-between items-center mb-4"><p className="text-sm font-bold text-gray-500">Eficiência de Produção</p><p className="text-sm font-black text-emerald-600">{property.economic?.profitability || '54'}%</p></div>
                       <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-emerald-500 rounded-full shadow-lg" style={{ width: `${property.economic?.profitability || 54}%` }}></div></div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* MODAL EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 text-center space-y-6">
                 <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={40} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Excluir Talhão?</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">Esta ação é irreversível e removerá todos os dados técnicos, histórico de análises e visitas vinculadas a este talhão.</p>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleDeleteProperty} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">Confirmar Exclusão</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><CalendarPlus size={20} /></div>
                    <h3 className="text-lg font-bold text-gray-900">Agendar Visita Técnica</h3>
                 </div>
                 <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Visita</label>
                    <input 
                      type="date" 
                      value={scheduleDate} 
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas / Objetivo</label>
                    <textarea 
                      value={scheduleNotes} 
                      onChange={e => setScheduleNotes(e.target.value)}
                      placeholder="Ex: Monitoramento de pragas, recomendação de adubação..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
                    />
                 </div>
                 <button 
                  onClick={handleScheduleVisit}
                  className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Confirmar Agendamento
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHES VISITA */}
      {selectedVisitDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-gray-900 text-white rounded-[24px] shadow-xl"><FileText size={28} /></div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Laudo da Visita Técnica</h3>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(selectedVisitDetail.checkOutTime || selectedVisitDetail.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedVisitDetail(null)} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"><X size={32} className="text-gray-300" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="bg-red-50 p-6 rounded-[32px] border border-red-100"><p className="text-[10px] font-black text-red-600 uppercase mb-2">Pragas</p><p className="text-sm font-black text-red-900">{selectedVisitDetail.pests || 'Nenhuma'}</p></div>
                    <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100"><p className="text-[10px] font-black text-orange-600 uppercase mb-2">Doenças</p><p className="text-sm font-black text-orange-900">{selectedVisitDetail.diseases || 'Nenhuma'}</p></div>
                    <div className="bg-yellow-50 p-6 rounded-[32px] border border-yellow-100"><p className="text-[10px] font-black text-yellow-600 uppercase mb-2">Daninhas</p><p className="text-sm font-black text-yellow-900">{selectedVisitDetail.weeds || 'Nenhuma'}</p></div>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 shadow-inner"><p className="text-gray-700 leading-relaxed font-bold italic">"{selectedVisitDetail.notes || 'Monitoramento preventivo realizado.'}"</p></div>
                 {selectedVisitDetail.photos && selectedVisitDetail.photos.length > 0 && (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedVisitDetail.photos.map((img, i) => (
                        <div key={i} className="aspect-square rounded-[32px] overflow-hidden shadow-lg border border-gray-100 group">
                           <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              <div className="p-8 bg-white border-t border-gray-100">
                 <button onClick={() => {
                    const text = `*RELATÓRIO DE VISITA*\n*Talhão:* ${property.name}\n*Data:* ${new Date(selectedVisitDetail.checkOutTime || selectedVisitDetail.date).toLocaleDateString('pt-BR')}\n\n*NOTAS:* ${selectedVisitDetail.notes}`;
                    window.open(`https://wa.me/${producer.contacts.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                  }} className="w-full bg-emerald-500 text-white py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all"><Send size={24} /> Compartilhar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHES HISTÓRICO DE SOLO */}
      {selectedSoilHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 text-white rounded-2xl"><FlaskConical size={24} /></div>
                    <div>
                       <h3 className="text-xl font-bold text-gray-900 tracking-tighter">Análise de Solo Histórica</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(selectedSoilHistory.analysisDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSoilHistory(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">pH</p><p className="font-black">{selectedSoilHistory.ph}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">V%</p><p className="font-black">{selectedSoilHistory.vPercentage}%</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">P (Fósforo)</p><p className="font-black">{selectedSoilHistory.phosphorus}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">M.O.</p><p className="font-black">{selectedSoilHistory.organicMatter}%</p></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DETALHES HISTÓRICO DE PLANEJAMENTO */}
      {selectedCropHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl"><Tractor size={24} /></div>
                    <div>
                       <h3 className="text-xl font-bold text-gray-900 tracking-tighter">Histórico de Safra {selectedCropHistory.safra}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Plantio em {new Date(selectedCropHistory.plantingDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCropHistory(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">Variedade</p><p className="font-black">{selectedCropHistory.variety}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">Sistema</p><p className="font-black">{selectedCropHistory.plantingSystem}</p></div>
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">População</p><p className="font-black">{selectedCropHistory.plantPopulation.toLocaleString('pt-BR')} pl/ha</p></div>
                    <div className="bg-emerald-50 p-4 rounded-2xl"><p className="text-[8px] font-bold text-emerald-600 uppercase">Colheita</p><p className="font-black text-emerald-900">{new Date(selectedCropHistory.harvestDate).toLocaleDateString('pt-BR')}</p></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetails;
