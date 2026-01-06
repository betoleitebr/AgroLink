
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Ruler, Leaf, Activity, ChevronRight, AlertCircle, 
  Droplets, Thermometer, Wind, Beaker, ShieldCheck, TrendingUp, Info, 
  Map as MapIcon, HardDrive, Tractor, User, DollarSign, Camera, FileText,
  LayoutGrid, Cloud, History as HistoryIcon, Plus, X, Check, CalendarPlus,
  ArrowUpRight, ArrowRight, Bug, AlertTriangle, Send, Search, Eye, Sparkles, Save, Edit3,
  Clock, FlaskConical, Target, ListChecks, Mountain, Trash2, Loader2, BarChart3, TrendingDown, Gauge,
  Image as ImageIcon, ZoomIn, Maximize2
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Visit, Property, SoilFertility, CropHistory, Producer } from '../types';

const FieldDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'geral' | 'solo' | 'manejo' | 'clima' | 'economico' | 'ocorrencias'>('geral');
  const [monitoringSubTab, setMonitoringSubTab] = useState<'linha_tempo' | 'galeria'>('linha_tempo');
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [isAddingSoil, setIsAddingSoil] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [producers, setProducers] = useState<Producer[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newSoilData, setNewSoilData] = useState<SoilFertility>({
    analysisDate: new Date().toISOString().split('T')[0],
    ph: 6.0, organicMatter: 3.0, phosphorus: 10, potassium: 0.4,
    calcium: 4.0, magnesium: 1.0, sulfur: 5, ctc: 10, vPercentage: 60,
    micronutrients: '', recommendations: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [pData, vData, cropData] = await Promise.all([
        dataStore.getProducers(),
        dataStore.getVisits(),
        dataStore.getAvailableCrops()
      ]);
      setProducers(pData);
      setVisits(vData);
      setAvailableCrops(cropData);
      setLoading(false);
    };
    loadData();
  }, []);

  const property = producers.flatMap(p => p.properties).find(prop => prop.id === id);
  const producer = producers.find(p => p.properties.some(prop => prop.id === id));
  
  const [editProperty, setEditProperty] = useState<Property | null>(null);

  const propertyHistory = useMemo(() => {
    return visits
      .filter(v => v.propertyId === id && v.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [id, visits]);

  const allPhotos = useMemo(() => {
    return propertyHistory.flatMap(v => (v.photos || []).map(photo => ({
      url: photo,
      date: v.date,
      visitId: v.id
    })));
  }, [propertyHistory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Sincronizando dados...</div>;
  if (!property || !producer) return <div className="p-8 text-center"><h2 className="text-xl font-bold">Talhão não encontrado</h2></div>;

  const handleStartVisit = async () => {
    const existingPending = visits.find(v => v.propertyId === id && v.status === 'pending');
    if (existingPending) navigate(`/visit-session/${existingPending.id}`);
    else {
      const newVisitId = `v-now-${Date.now()}`;
      await dataStore.addVisit({ id: newVisitId, producerId: producer.id, propertyId: property.id, date: new Date().toISOString().split('T')[0], status: 'ongoing', notes: '' });
      navigate(`/visit-session/${newVisitId}`);
    }
  };

  const startTechEdit = () => {
    setEditProperty(JSON.parse(JSON.stringify(property)));
    setIsEditingTech(true);
  };

  const saveTechEdit = async () => {
    if (!editProperty) return;
    const updatedProperties = producer.properties.map(p => p.id === property.id ? editProperty : p);
    await dataStore.updateProducer({ ...producer, properties: updatedProperties });
    setProducers(await dataStore.getProducers());
    setIsEditingTech(false);
  };

  const handleAddSoilAnalysis = async () => {
    const updatedProperty = { ...property };
    const history = [...(property.soilHistory || []), newSoilData].sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
    updatedProperty.soilFertility = newSoilData;
    updatedProperty.soilHistory = history;
    
    const updatedProperties = producer.properties.map(p => p.id === property.id ? updatedProperty : p);
    await dataStore.updateProducer({ ...producer, properties: updatedProperties });
    setProducers(await dataStore.getProducers());
    setIsAddingSoil(false);
    alert("Nova análise de solo registrada!");
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
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-tighter">{producer.farmName} • {producer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowScheduleModal(true)} className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-2 rounded-xl" title="Agendar Visita"><CalendarPlus size={18} /></button>
           {!isEditingTech ? (
             <button onClick={startTechEdit} className="bg-white border border-gray-100 p-2 rounded-xl text-gray-400 hover:text-emerald-600"><Edit3 size={18} /></button>
           ) : (
             <button onClick={saveTechEdit} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><Save size={16} /> Salvar Alterações</button>
           )}
           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">{property.cropType}</span>
           <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full uppercase">{property.area} ha</span>
        </div>
      </header>

      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        <TabButton id="geral" label="Geral" icon={LayoutGrid} />
        <TabButton id="solo" label="Solo & Fertilidade" icon={Beaker} />
        <TabButton id="manejo" label="Manejo & Cultura" icon={ShieldCheck} />
        <TabButton id="clima" label="Clima" icon={Cloud} />
        <TabButton id="economico" label="Financeiro" icon={DollarSign} />
        <TabButton id="ocorrencias" label="Monitoramento" icon={Activity} />
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
              <Leaf size={100} className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <p className="text-xs font-bold uppercase opacity-80 mb-1 tracking-widest">Estado da Cultura</p>
              <h3 className="text-3xl font-black">{property.cropType}</h3>
              <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-2 gap-4">
                <div><p className="text-[10px] uppercase opacity-60 font-bold">Safra</p><p className="font-bold text-xs">{property.cropHistory?.safra || 'Pendente'}</p></div>
                <div><p className="text-[10px] uppercase opacity-60 font-bold">Variedade</p><p className="font-bold text-xs truncate">{property.cropHistory?.variety || '-'}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
               <div>
                 <h4 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Solo Atual</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><p className="text-[9px] font-bold text-gray-400 uppercase">pH</p><p className="text-lg font-black text-gray-900">{property.soilFertility?.ph || '-'}</p></div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100"><p className="text-[9px] font-bold text-emerald-600 uppercase">V%</p><p className="text-lg font-black text-emerald-900">{property.soilFertility?.vPercentage || '-'}%</p></div>
                 </div>
               </div>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                 <Calendar size={12} /> Última análise: {safeFormatDate(property.soilFertility?.analysisDate || '')}
               </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custo Insumos/ha</p>
                 <h4 className="text-2xl font-black text-gray-900">{formatCurrency(property.economic?.inputCost || 0)}</h4>
                 <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                 </div>
               </div>
               <button onClick={handleStartVisit} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-gray-200 mt-4 active:scale-95 transition-all">Iniciar Visita Técnica</button>
            </div>
          </div>
        )}

        {activeTab === 'solo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'pH (Água)', val: property.soilFertility?.ph, unit: '', color: 'text-emerald-600', icon: Beaker },
                { label: 'Mat. Orgânica', val: property.soilFertility?.organicMatter, unit: '%', color: 'text-emerald-600', icon: Mountain },
                { label: 'Fósforo (P)', val: property.soilFertility?.phosphorus, unit: 'mg/dm³', color: 'text-emerald-600', icon: FlaskConical },
                { label: 'Saturação Bases', val: property.soilFertility?.vPercentage, unit: '%', color: 'text-emerald-600', icon: Target }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:border-emerald-200 transition-all">
                   <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 mb-4 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors"><stat.icon size={20}/></div>
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">{stat.label}</p>
                   <p className={`text-2xl font-black ${stat.color}`}>{stat.val || '-'}<span className="text-xs ml-1 font-bold">{stat.unit}</span></p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tighter"><HistoryIcon className="text-emerald-500" /> Histórico de Fertilidade</h3>
                  <button onClick={() => setIsAddingSoil(true)} className="bg-gray-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={16}/> Nova Amostragem</button>
               </div>
               <div className="space-y-4">
                  {property.soilHistory?.length ? property.soilHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-100 transition-all group">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 font-bold group-hover:scale-110 transition-transform"><Beaker size={20}/></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Análise de Solo</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{safeFormatDate(h.analysisDate)}</p>
                          </div>
                       </div>
                       <div className="flex gap-8 text-center">
                          <div className="bg-white/50 px-4 py-2 rounded-xl"><p className="text-[8px] font-black text-gray-400 uppercase">pH</p><p className="text-xs font-black">{h.ph}</p></div>
                          <div className="bg-white/50 px-4 py-2 rounded-xl"><p className="text-[8px] font-black text-gray-400 uppercase">V%</p><p className="text-xs font-black">{h.vPercentage}%</p></div>
                          <div className="bg-white/50 px-4 py-2 rounded-xl"><p className="text-[8px] font-black text-gray-400 uppercase">P (mg)</p><p className="text-xs font-black">{h.phosphorus}</p></div>
                       </div>
                    </div>
                  )) : <div className="py-20 text-center text-gray-400 italic font-medium">Nenhum registro histórico de solo disponível.</div>}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'ocorrencias' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm overflow-hidden relative">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Activity size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Monitoramento Sanitário</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saúde da Lavoura e Solo</p>
                    </div>
                  </div>
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                    <button 
                      onClick={() => setMonitoringSubTab('linha_tempo')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${monitoringSubTab === 'linha_tempo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Relatórios
                    </button>
                    <button 
                      onClick={() => setMonitoringSubTab('galeria')}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${monitoringSubTab === 'galeria' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Galeria Evolutiva
                    </button>
                  </div>
               </div>

               {monitoringSubTab === 'linha_tempo' ? (
                 <div className="space-y-8 relative">
                    {/* Linha vertical decorativa */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-100 hidden md:block" />

                    {propertyHistory.length ? propertyHistory.map((v, i) => (
                      <div key={v.id} className="relative flex flex-col md:flex-row gap-8 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                         {/* Bullet da Timeline */}
                         <div className="hidden md:flex absolute left-0 w-12 h-12 bg-white rounded-2xl border border-gray-100 items-center justify-center z-10 shadow-sm group hover:border-emerald-500 transition-colors">
                            <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                         </div>

                         <div className="md:ml-20 flex-1 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100 hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                               <div>
                                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Visita Técnica #{propertyHistory.length - i}</p>
                                  <h4 className="text-lg font-black text-gray-900">{safeFormatDate(v.date)}</h4>
                               </div>
                               <button onClick={() => navigate(`/visit-session/${v.id}`)} className="bg-white text-gray-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-gray-200 hover:bg-gray-900 hover:text-white transition-all">Ver Detalhes</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2"><Bug size={14}/> Pragas</p>
                                  <p className="text-sm font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">{v.pests || 'Nenhuma Ocorrência'}</p>
                               </div>
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2"><AlertTriangle size={14}/> Doenças</p>
                                  <p className="text-sm font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">{v.diseases || 'Monitorado/Limpo'}</p>
                               </div>
                               <div className="space-y-2">
                                  <p className="text-[10px] font-black text-sky-500 uppercase flex items-center gap-2"><Sparkles size={14}/> Insights IA</p>
                                  <p className="text-xs italic text-gray-500 bg-white p-3 rounded-xl border border-gray-100 line-clamp-2">{v.reportSummary || 'Relatório de rotina sem observações críticas.'}</p>
                               </div>
                            </div>

                            {v.photos && v.photos.length > 0 && (
                              <div className="space-y-3">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Registros Fotográficos ({v.photos.length})</p>
                                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {v.photos.map((photo, idx) => (
                                      <div key={idx} onClick={() => setSelectedImage(photo)} className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm group/photo border border-gray-200">
                                         <img src={photo} alt="Evidência" className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn size={20} className="text-white" />
                                         </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                         </div>
                      </div>
                    )) : (
                      <div className="py-24 text-center">
                         <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6"><Activity size={40} /></div>
                         <p className="text-gray-400 font-bold italic">Sem registros de monitoramento para este talhão.</p>
                         <button onClick={handleStartVisit} className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-600 pb-1">Iniciar Primeiro Registro</button>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="animate-in fade-in duration-500">
                    {allPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                         {allPhotos.map((photo, i) => (
                           <div key={i} onClick={() => setSelectedImage(photo.url)} className="aspect-square bg-gray-100 rounded-[28px] overflow-hidden relative group cursor-pointer border border-gray-200 shadow-sm hover:shadow-xl hover:scale-[1.03] transition-all">
                              <img src={photo.url} alt="Crescimento" className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end h-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <p className="text-[8px] font-black text-white uppercase tracking-widest mb-1">{safeFormatDate(photo.date)}</p>
                                 <div className="flex items-center gap-1 text-[7px] font-bold text-emerald-400 uppercase"><Maximize2 size={8} /> Zoom Analítico</div>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                         <ImageIcon size={48} className="text-gray-200 mx-auto mb-4" />
                         <p className="text-gray-400 font-bold">Nenhuma imagem armazenada neste talhão.</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* OUTRAS ABAS (Manejo, Clima, Economico) - Manter lógica existente para brevidade */}
        {activeTab === 'manejo' && (
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 tracking-tighter"><ShieldCheck className="text-sky-500" /> Planejamento de Safra</h3>
               <button onClick={startTechEdit} className="text-[10px] font-black text-sky-600 uppercase border-b-2 border-sky-600 tracking-widest hover:text-sky-700 transition-colors">Editar Estratégia</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100"><p className="text-[10px] font-black text-sky-600 uppercase mb-2 tracking-widest">Safra Atual</p><p className="text-lg font-black text-sky-900">{property.cropHistory?.safra || 'Não Definida'}</p></div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Variedade / Germoplasma</p><p className="text-lg font-bold text-gray-900">{property.cropHistory?.variety || '-'}</p></div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Sistema de Cultivo</p><p className="text-lg font-bold text-gray-900">{property.cropHistory?.plantingSystem || '-'}</p></div>
               </div>
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Data Plantio</p><p className="text-sm font-black text-gray-900">{safeFormatDate(property.cropHistory?.plantingDate || '')}</p></div>
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Previsão Colheita</p><p className="text-sm font-black text-gray-900">{safeFormatDate(property.cropHistory?.harvestDate || '')}</p></div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">População Efetiva</p><p className="text-lg font-black text-gray-900">{property.cropHistory?.plantPopulation?.toLocaleString() || '-'} plantas/ha</p></div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Espaçamento Entre Linhas</p><p className="text-lg font-bold text-gray-900">{property.cropHistory?.spacing || '-'} m</p></div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'economico' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
                  <DollarSign className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" size={140} />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Custo Total Projetado (ha)</p>
                  <h4 className="text-4xl font-black tracking-tighter">{formatCurrency((property.economic?.inputCost || 0) + (property.economic?.operationalCost || 0))}</h4>
                  <div className="mt-8 grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                     <div><p className="text-[9px] font-bold text-gray-500 uppercase">Insumos Diretos</p><p className="text-xs font-bold">{formatCurrency(property.economic?.inputCost || 0)}</p></div>
                     <div><p className="text-[9px] font-bold text-gray-500 uppercase">Operacional</p><p className="text-xs font-bold">{formatCurrency(property.economic?.operationalCost || 0)}</p></div>
                  </div>
               </div>
               <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Receita Estimada (ha)</p>
                    <h4 className="text-3xl font-black text-gray-900">{formatCurrency(property.economic?.estimatedRevenue || 0)}</h4>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                    <TrendingUp size={16}/> ROI Projetado: {(((property.economic?.estimatedRevenue || 0) / ((property.economic?.inputCost || 1) + (property.economic?.operationalCost || 0))) * 100).toFixed(1)}%
                  </div>
               </div>
               <div className="bg-emerald-500 rounded-[40px] p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <BarChart3 className="absolute -right-4 -bottom-4 opacity-10" size={100} />
                  <div>
                    <p className="text-[10px] font-black text-emerald-100 uppercase mb-2 tracking-widest">Margem Líquida / ha</p>
                    <h4 className="text-4xl font-black tracking-tighter">{(property.economic?.grossMargin || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                  </div>
                  <div className="mt-4 bg-white/20 p-4 rounded-2xl flex justify-between items-center backdrop-blur-sm border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest">Eficiência BI</span>
                    <span className="text-lg font-black">{property.economic?.profitability || 0}%</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL PARA IMAGENS */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-2xl"><X size={32}/></button>
           <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center">
              <img src={selectedImage} alt="Visualização Ampliada" className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in duration-500" />
              <div className="mt-8 flex gap-4">
                 <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 flex items-center gap-2"><Maximize2 size={16}/> Análise de Detalhe</button>
                 <button className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2"><Send size={16}/> Compartilhar Registro</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL ADICIONAR ANÁLISE DE SOLO */}
      {isAddingSoil && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Registrar Nova Análise de Solo</h3>
                <button onClick={() => setIsAddingSoil(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="p-10 overflow-y-auto space-y-6 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data da Coleta</label><input type="date" value={newSoilData.analysisDate} onChange={e => setNewSoilData({...newSoilData, analysisDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">pH em Água</label><input type="number" step="0.1" value={newSoilData.ph} onChange={e => setNewSoilData({...newSoilData, ph: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Matéria Orgânica (%)</label><input type="number" step="0.1" value={newSoilData.organicMatter} onChange={e => setNewSoilData({...newSoilData, organicMatter: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fósforo (mg/dm³)</label><input type="number" value={newSoilData.phosphorus} onChange={e => setNewSoilData({...newSoilData, phosphorus: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Potássio (cmolc/dm³)</label><input type="number" step="0.01" value={newSoilData.potassium} onChange={e => setNewSoilData({...newSoilData, potassium: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Saturação Bases (V%)</label><input type="number" value={newSoilData.vPercentage} onChange={e => setNewSoilData({...newSoilData, vPercentage: Number(e.target.value)})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm font-black text-emerald-900" /></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Recomendações Técnicas</label><textarea value={newSoilData.recommendations} onChange={e => setNewSoilData({...newSoilData, recommendations: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-5 py-3 text-sm min-h-[100px] outline-none" placeholder="Ex: Calagem recomendada para atingir V% 70..." /></div>
                 <button onClick={handleAddSoilAnalysis} className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Salvar Análise e Atualizar Status</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL EDIÇÃO TÉCNICA/MANEJO/FINANCEIRO */}
      {isEditingTech && editProperty && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Atualizar Dados Técnicos e Financeiros</h3>
                 <button onClick={() => setIsEditingTech(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                 <section className="space-y-6">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">1. Planejamento da Cultura</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Safra</label><input type="text" value={editProperty.cropHistory?.safra || ''} onChange={e => setEditProperty({...editProperty, cropHistory: {...editProperty.cropHistory!, safra: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Variedade</label><input type="text" value={editProperty.cropHistory?.variety || ''} onChange={e => setEditProperty({...editProperty, cropHistory: {...editProperty.cropHistory!, variety: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">População (plantas/ha)</label><input type="number" value={editProperty.cropHistory?.plantPopulation || 0} onChange={e => setEditProperty({...editProperty, cropHistory: {...editProperty.cropHistory!, plantPopulation: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Espaçamento (m)</label><input type="text" value={editProperty.cropHistory?.spacing || ''} onChange={e => setEditProperty({...editProperty, cropHistory: {...editProperty.cropHistory!, spacing: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm" /></div>
                    </div>
                 </section>

                 <section className="space-y-6">
                    <h4 className="text-xs font-black text-sky-600 uppercase tracking-[0.2em] border-b border-sky-100 pb-2">2. Dados Financeiros por Hectare</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Custo Insumos (R$)</label><input type="number" value={editProperty.economic?.inputCost || 0} onChange={e => setEditProperty({...editProperty, economic: {...editProperty.economic!, inputCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Custo Operacional (R$)</label><input type="number" value={editProperty.economic?.operationalCost || 0} onChange={e => setEditProperty({...editProperty, economic: {...editProperty.economic!, operationalCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Receita Estimada (R$)</label><input type="number" value={editProperty.economic?.estimatedRevenue || 0} onChange={e => setEditProperty({...editProperty, economic: {...editProperty.economic!, estimatedRevenue: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 text-sm font-black text-emerald-900" /></div>
                    </div>
                    <div className="p-6 bg-gray-900 text-white rounded-[32px] flex justify-between items-center">
                       <div><p className="text-[10px] font-bold text-gray-400 uppercase">Lucratividade Projetada</p><p className="text-2xl font-black text-emerald-400">{((((editProperty.economic?.estimatedRevenue || 0) - ((editProperty.economic?.inputCost || 0) + (editProperty.economic?.operationalCost || 0))) / (editProperty.economic?.estimatedRevenue || 1)) * 100).toFixed(1)}%</p></div>
                       <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Margem Bruta (ha)</p><p className="text-2xl font-black">{formatCurrency((editProperty.economic?.estimatedRevenue || 0) - ((editProperty.economic?.inputCost || 0) + (editProperty.economic?.operationalCost || 0)))}</p></div>
                    </div>
                 </section>

                 <button onClick={saveTechEdit} className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Sincronizar Dados do Talhão</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetails;
