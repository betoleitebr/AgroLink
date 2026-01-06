
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Calendar, MapPin, CheckCircle2, Clock, 
  ArrowRight, MoreVertical, Plus, Trash2, Edit3, ChevronRight,
  Camera, FileText, User, Building2, LayoutGrid, List, Navigation,
  CalendarPlus, X, Loader2, AlertCircle
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Visit, Producer, Property } from '../types';
import { useNavigate } from 'react-router-dom';

const Visits: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showGlobalSchedule, setShowGlobalSchedule] = useState(false);
  const [selectedProducerId, setSelectedProducerId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const [visits, setVisits] = useState<Visit[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);

  const isLate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visitDate = new Date(dateStr);
    visitDate.setHours(0, 0, 0, 0);
    return visitDate < today;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [vData, pData] = await Promise.all([
        dataStore.getVisits(),
        dataStore.getProducers()
      ]);
      setVisits(vData || []);
      setProducers(pData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const producer = producers.find(p => p.id === v.producerId);
      const property = producer?.properties.find(prop => prop.id === v.propertyId);
      const matchesSearch = 
        producer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'pending') {
        return v.status !== 'completed' && matchesSearch;
      }
      return v.status === 'completed' && matchesSearch;
    }).sort((a, b) => {
      if (activeTab === 'pending') {
        const aLate = isLate(a.date);
        const bLate = isLate(b.date);
        if (aLate && !bLate) return -1;
        if (!aLate && bLate) return 1;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [visits, activeTab, searchTerm, producers]);

  const selectedProducer = producers.find(p => p.id === selectedProducerId);

  const handleCreateSchedule = async () => {
    if (!selectedProducerId || !selectedPropertyId || !scheduleDate) {
      return alert("Por favor, preencha todos os campos obrigatórios.");
    }

    const newVisit: Visit = {
      id: `v-sch-global-${Date.now()}`,
      producerId: selectedProducerId,
      propertyId: selectedPropertyId,
      date: scheduleDate,
      status: 'pending',
      notes: scheduleNotes
    };

    await dataStore.addVisit(newVisit);
    const updated = await dataStore.getVisits();
    setVisits(updated);
    
    setShowGlobalSchedule(false);
    setSelectedProducerId('');
    setSelectedPropertyId('');
    setScheduleDate('');
    setScheduleNotes('');
    alert("Agendamento realizado com sucesso!");
  };

  const safeFormatDate = (isoString: string) => {
    if (!isoString) return 'Data não definida';
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" /> Carregando agenda...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda Técnica</h1>
          <p className="text-sm text-gray-500">Gestão de visitas e histórico de campo</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowGlobalSchedule(true)}
            className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            <CalendarPlus size={18} className="text-emerald-500" /> Agendar Visita
          </button>
          <button 
            onClick={() => navigate('/map')}
            className="flex-1 sm:flex-none bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus size={20} /> Nova Visita (Mapa)
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 self-start">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Clock size={18} /> Próximas Visitas
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CheckCircle2 size={18} /> Histórico RTV
          </button>
        </div>
        
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou fazenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVisits.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center flex flex-col items-center gap-4 border border-gray-100 shadow-sm opacity-60">
             <Calendar size={48} className="text-gray-200" />
             <p className="font-bold text-gray-400">Nenhuma visita encontrada para este filtro.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => {
            const producer = producers.find(p => p.id === visit.producerId);
            const property = producer?.properties.find(prop => prop.id === visit.propertyId);
            const visitLate = activeTab === 'pending' && isLate(visit.date);
            
            return (
              <div 
                key={visit.id}
                onClick={() => navigate(`/visit-session/${visit.id}`)}
                className={`bg-white rounded-[28px] p-6 shadow-sm border transition-all cursor-pointer group ${
                  visitLate ? 'border-red-200 bg-red-50 hover:bg-red-100/50 hover:border-red-300' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl ${
                      visitLate ? 'bg-red-100 text-red-600' : 
                      activeTab === 'pending' ? 'bg-emerald-50 text-emerald-600' : 
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {visitLate ? <AlertCircle size={24} className="animate-pulse" /> : activeTab === 'pending' ? <Calendar size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-bold group-hover:text-emerald-600 transition-colors ${visitLate ? 'text-red-900' : 'text-gray-900'}`}>{producer?.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${visitLate ? 'bg-red-200 text-red-800' : 'bg-emerald-50 text-emerald-600'}`}>{property?.cropType}</span>
                        {visitLate && <span className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-2 animate-pulse">Atrasada</span>}
                      </div>
                      <p className={`text-sm font-medium flex items-center gap-2 ${visitLate ? 'text-red-700/60' : 'text-gray-500'}`}>
                        <Building2 size={14} className={visitLate ? 'text-red-400' : 'text-gray-300'} /> {property?.name} • {producer?.location.city}, {producer?.location.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-10">
                    <div className="space-y-1 text-right">
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${visitLate ? 'text-red-400' : 'text-gray-400'}`}>Data Programada</p>
                       <p className={`text-sm font-bold flex items-center justify-end gap-2 ${visitLate ? 'text-red-600' : 'text-gray-900'}`}>
                         <Calendar size={14} className={visitLate ? 'text-red-500' : 'text-emerald-500'} /> {safeFormatDate(visit.date)}
                       </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="hidden sm:block text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            visitLate ? 'text-red-600 bg-red-100 border border-red-200' :
                            visit.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 
                            'text-sky-600 bg-sky-50'
                          }`}>
                             {visitLate ? 'Atrasada' : visit.status === 'completed' ? 'Concluída' : 'Pendente'}
                          </span>
                       </div>
                       <div className={`p-3 rounded-2xl transition-all ${
                         visitLate ? 'bg-red-200 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 
                         'bg-gray-50 text-gray-300 group-hover:bg-emerald-500 group-hover:text-white'
                       }`}>
                          <ChevronRight size={20} />
                       </div>
                    </div>
                  </div>
                </div>

                {visit.notes && (
                  <div className={`mt-4 pt-4 border-t ${visitLate ? 'border-red-200' : 'border-gray-50'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${visitLate ? 'text-red-500' : 'text-gray-400'}`}>
                      <FileText size={12} /> Objetivo da Visita
                    </p>
                    <p className={`text-xs italic line-clamp-2 ${visitLate ? 'text-red-900/60' : 'text-gray-500'}`}>{visit.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL AGENDAMENTO GLOBAL */}
      {showGlobalSchedule && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><CalendarPlus size={20} /></div>
                    <h3 className="text-lg font-bold text-gray-900">Novo Agendamento Técnico</h3>
                 </div>
                 <button onClick={() => setShowGlobalSchedule(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Cliente (Fazenda)</label>
                    <select 
                      value={selectedProducerId} 
                      onChange={e => { setSelectedProducerId(e.target.value); setSelectedPropertyId(''); }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                       <option value="">Escolha um cliente...</option>
                       {producers.map(p => (
                         <option key={p.id} value={p.id}>{p.name} ({p.farmName})</option>
                       ))}
                    </select>
                 </div>

                 {selectedProducerId && (
                   <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Talhão</label>
                      <select 
                        value={selectedPropertyId} 
                        onChange={e => setSelectedPropertyId(e.target.value)}
                        className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                         <option value="">Escolha o talhão...</option>
                         {selectedProducer?.properties.map(prop => (
                           <option key={prop.id} value={prop.id}>{prop.name} - {prop.cropType}</option>
                         ))}
                      </select>
                   </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Agendada</label>
                    <input 
                      type="date" 
                      value={scheduleDate} 
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Objetivo da Visita</label>
                    <textarea 
                      value={scheduleNotes} 
                      onChange={e => setScheduleNotes(e.target.value)}
                      placeholder="Ex: Entrega de laudo, avaliação de sanidade, etc."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
                    />
                 </div>

                 <button 
                  onClick={handleCreateSchedule}
                  disabled={!selectedProducerId || !selectedPropertyId || !scheduleDate}
                  className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                    Salvar na Agenda
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
