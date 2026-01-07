
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, CloudRain, Thermometer, Wind, Droplets, ArrowRight, CheckCircle2, 
  Clock, MapPin, Loader2, Cloud, Navigation, AlertTriangle, Sparkles, 
  ChevronRight, Plus, Briefcase, FileText, UserPlus, TrendingUp, AlertCircle,
  Target, Calendar, BellRing, Smartphone, MessageSquare
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentLocation, fetchWeather } from '../services/weatherService';
import { generateStrategicInsights } from '../services/geminiService';
import { WeatherData, Visit, Producer, Proposal } from '../types';
import AgentMap from '../components/AgentMap';
import { authStore } from '../services/authStore';
import { CLIENT_BRAND } from '../constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authStore.getCurrentUser();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  
  const [pendingVisits, setPendingVisits] = useState<Visit[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const isLate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visitDate = new Date(dateStr + 'T12:00:00');
    visitDate.setHours(0, 0, 0, 0);
    return visitDate < today;
  };

  const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingData(true);
      try {
        await dataStore.init();
        const [visitsData, producersData, proposalsData] = await Promise.all([
          dataStore.getVisits(),
          dataStore.getProducers(),
          dataStore.getProposals()
        ]);
        
        const validVisits = visitsData.filter(v => v.status !== 'completed');
        const sortedVisits = [...validVisits].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        setPendingVisits(sortedVisits);
        setProducers(producersData);
        setProposals(proposalsData);

        try {
          const position = await getCurrentLocation();
          const weatherData = await fetchWeather(position.coords.latitude, position.coords.longitude);
          setWeather(weatherData);
        } catch (weatherErr) {
          console.warn("Aviso: Falha ao carregar clima local, tentando fallback...");
          try {
            const fallbackWeather = await fetchWeather(-15.7801, -47.9292);
            setWeather({ ...fallbackWeather, location: "Brasília (Sede)" });
          } catch (e) {
            console.error("Falha total no serviço de clima.");
          }
        }
      } catch (err) {
        console.error("Erro no carregamento do Dashboard:", err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingData(false);
        setLoadingWeather(false);
      }
    };
    loadAllData();
  }, []);

  const stats = useMemo(() => {
    const allProps = producers.flatMap(p => p.properties);
    const totalArea = allProps.reduce((acc, p) => acc + Number(p.area || 0), 0);
    const totalPipeline = proposals.reduce((acc, p) => acc + Number(p.totalValue || 0), 0);
    const highConfidenceProposals = proposals.filter(p => p.closingProbability >= 80);
    const weighted = proposals.reduce((acc, p) => acc + (Number(p.totalValue || 0) * (p.closingProbability / 100)), 0);

    const today = new Date().toISOString().split('T')[0];
    const dueFollowUps = proposals.filter(p => p.nextContactDate && p.nextContactDate <= today);

    return {
      totalProducers: producers.length,
      totalArea,
      totalPipeline,
      weightedValue: weighted,
      guaranteedCount: highConfidenceProposals.length,
      avgProb: proposals.length > 0 ? proposals.reduce((acc, p) => acc + p.closingProbability, 0) / proposals.length : 0,
      mainCrops: Array.from(new Set(allProps.map(p => p.cropType))),
      highConfidenceProposals: highConfidenceProposals.sort((a, b) => new Date(a.expectedClosingDate).getTime() - new Date(b.expectedClosingDate).getTime()),
      dueFollowUps: dueFollowUps.sort((a, b) => new Date(a.nextContactDate!).getTime() - new Date(b.nextContactDate!).getTime()),
      alertsCount: 0 
    };
  }, [producers, proposals]);

  const handleQuickInsight = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const insight = await generateStrategicInsights({
        ...stats,
        totalProposalsValue: stats.totalPipeline
      });
      setAiInsight(String(insight || ''));
    } catch (e) {
      setAiInsight("Falha ao processar insights. Verifique a conexão.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* NOTIFICAÇÃO DE FOLLOW-UP */}
      {stats.dueFollowUps.length > 0 && (
        <div className="bg-amber-500 text-white px-8 py-4 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl"><BellRing className="animate-pulse" size={24}/></div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest">Follow-ups Pendentes</h4>
              <p className="text-xs font-bold text-amber-50 opacity-90">Você possui {stats.dueFollowUps.length} ações de contato agendadas para hoje ou em atraso.</p>
            </div>
          </div>
          <button onClick={() => navigate('/proposals')} className="bg-white text-amber-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Ver Agora</button>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">{CLIENT_BRAND.corporateName}</h2>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            Olá, <span className="text-emerald-500">{currentUser?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium italic">Foco operacional: {pendingVisits.length} visitas e {stats.guaranteedCount} fechamentos previstos.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Microssistema {CLIENT_BRAND.version}</span>
        </div>
      </header>

      {/* Metric Cards */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gray-900 text-white rounded-2xl shadow-lg"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Total</p>
            <h4 className="text-2xl font-black text-gray-900">{formatCurrency(stats.totalPipeline)}</h4>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg"><Target size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Ponderado (Forecast)</p>
            <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(stats.weightedValue)}</h4>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Negócios de Alta Confiança</p>
            <h4 className="text-2xl font-black text-sky-600">{stats.guaranteedCount} <span className="text-xs text-gray-400 font-bold uppercase">Propostas</span></h4>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
              <Cloud size={100} className="absolute -right-4 -top-4 text-white/5 rotate-12" />
              {loadingWeather ? (
                <div className="flex items-center gap-3 py-4"><Loader2 size={24} className="animate-spin text-emerald-400" /><p className="text-sm font-bold">Monitorando clima...</p></div>
              ) : weather ? (
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <MapPin size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">{weather.location}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-black tracking-tighter">{weather.temp}°C</span>
                      <CloudRain className="text-emerald-400" size={32} />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
                    <div><p className="text-[8px] font-bold text-gray-500 uppercase">Vento</p><p className="text-xs font-bold">{weather.windSpeed} km/h</p></div>
                    <div><p className="text-[8px] font-bold text-gray-500 uppercase">Umidade</p><p className="text-xs font-bold">{weather.humidity}%</p></div>
                    <p className="text-xs font-bold text-emerald-400 ml-auto">{weather.condition}</p>
                  </div>
                </div>
              ) : (
                <div className="text-white/40 text-xs font-bold uppercase py-4 flex items-center gap-2">
                  <AlertCircle size={14} /> Clima indisponível
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => navigate('/map')} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                  <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MAPA</p><p className="text-xs font-bold text-gray-900">Novo Talhão</p></div>
               </button>
               <button onClick={() => navigate('/proposals')} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Briefcase size={20}/></div>
                  <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SALES</p><p className="text-xs font-bold text-gray-900">Negócio</p></div>
               </button>
               <button onClick={() => navigate('/visits')} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                  <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AGENDA</p><p className="text-xs font-bold text-gray-900">Visita</p></div>
               </button>
               <button onClick={() => navigate('/producers')} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserPlus size={20}/></div>
                  <div className="text-left"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CRM</p><p className="text-xs font-bold text-gray-900">Produtor</p></div>
               </button>
            </div>
          </section>

          {/* Map Monitoring */}
          <section className="bg-white rounded-[40px] p-2 shadow-sm border border-gray-100 h-[400px] relative overflow-hidden group">
             <AgentMap />
          </section>
        </div>

        <div className="space-y-6">
          {/* AI Insights */}
          <section className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
            <Sparkles className="absolute -right-10 -bottom-10 opacity-10" size={160} />
            <div className="relative z-10">
               <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4"><Sparkles size={16} /> Insights IA</h4>
               {aiInsight ? (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom">
                    <p className="text-sm text-emerald-50 leading-relaxed font-medium line-clamp-5 italic">"{aiInsight}"</p>
                    <button onClick={() => navigate('/reports')} className="text-[9px] font-black uppercase tracking-[0.2em] bg-white text-emerald-600 px-4 py-2 rounded-xl shadow-lg">Detalhamento</button>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <p className="text-sm text-emerald-50/80 leading-relaxed font-medium">IA analisando riscos sanitários e oportunidades de negociação...</p>
                   <button 
                    onClick={handleQuickInsight} 
                    disabled={loadingAi}
                    className="w-full bg-emerald-900 text-white py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {loadingAi ? <Loader2 className="animate-spin" /> : <TrendingUp size={18} />}
                     {loadingAi ? 'Processando...' : 'Diagnóstico da Carteira'}
                   </button>
                 </div>
               )}
            </div>
          </section>

          {/* Next Events & Closings */}
          <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Prioridades</h3>
              <Clock className="text-emerald-500" size={24} />
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {/* Follow-ups Today */}
              {stats.dueFollowUps.length > 0 && (
                <div className="animate-in slide-in-from-top duration-500">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                    <BellRing size={12} /> Ações de Follow-up
                  </p>
                  <div className="space-y-3">
                    {stats.dueFollowUps.slice(0, 3).map(p => (
                      <Link key={p.id} to="/proposals" className="block bg-amber-50 border border-amber-100 p-4 rounded-2xl hover:bg-amber-100 transition-all group">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-sm">Ativo</span>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter flex items-center gap-1">
                              <BellRing size={10} /> {safeFormatDate(p.nextContactDate)}
                            </span>
                         </div>
                         <h4 className="text-xs font-black text-gray-900 truncate group-hover:text-amber-700">{p.title}</h4>
                         <p className="text-[10px] font-bold text-amber-700/60 uppercase">{p.farmName}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {stats.highConfidenceProposals.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 ml-2">Fechamentos Previstos</p>
                  <div className="space-y-3">
                    {stats.highConfidenceProposals.slice(0, 3).map(p => (
                      <Link key={p.id} to="/proposals" className="block bg-emerald-50 border border-emerald-100 p-4 rounded-2xl hover:bg-emerald-100 transition-all group">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">{p.closingProbability}% Confiança</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                              <Calendar size={10} /> {safeFormatDate(p.expectedClosingDate)}
                            </span>
                         </div>
                         <h4 className="text-xs font-black text-gray-900 truncate group-hover:text-emerald-600">{p.title}</h4>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">{p.farmName} • {formatCurrency(Number(p.totalValue || 0))}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Agenda Técnica</p>
                {loadingData ? (
                   <div className="py-20 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" /></div>
                ) : pendingVisits.length === 0 ? (
                   <div className="py-10 text-center text-xs font-bold text-gray-400 italic">Sem visitas agendadas.</div>
                ) : pendingVisits.slice(0, 3).map((v) => {
                  const prod = producers.find(p => p.id === v.producerId);
                  const prop = prod?.properties.find(p => p.id === v.propertyId);
                  const formattedDate = safeFormatDate(v.date);
                  return (
                    <Link 
                      key={v.id} 
                      to={`/visit-session/${v.id}`} 
                      className="group block bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-100 transition-all mb-3"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-black text-gray-900 truncate">{prod?.name}</h4>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin size={10} className="text-emerald-500" />
                        <span className="text-[10px] font-bold truncate">{prop?.name} ({prop?.cropType})</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
