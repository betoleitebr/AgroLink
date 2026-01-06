
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Leaf, Activity, 
  ArrowUpRight, ArrowDownRight, Sparkles, Filter, 
  Target, ShieldCheck, Briefcase, Calendar, Info, 
  AlertTriangle, Loader2, Search, CheckCircle2,
  Tractor, CloudRain, Beaker, ArrowRight, X, FileText, Share2, Download,
  ChevronLeft, History, FlaskConical, Bug, Ghost, Gauge, Clock
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { generateStrategicInsights, generateDetailedReportAnalysis, generateFieldDeepAnalysis } from '../services/geminiService';
import { Proposal, Producer, Property, Visit } from '../types';

const Reports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [filterSafra, setFilterSafra] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedField, setSelectedField] = useState<any | null>(null);
  
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [reportAnalysis, setReportAnalysis] = useState<string | null>(null);
  const [fieldAnalysis, setFieldAnalysis] = useState<string | null>(null);
  const [isAnalyzingField, setIsAnalyzingField] = useState(false);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const safeFormatDate = (isoString: string) => {
    if (!isoString) return '';
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [pData, propData, vData] = await Promise.all([
        dataStore.getProducers(),
        dataStore.getProposals(),
        dataStore.getVisits()
      ]);
      setProducers(pData || []);
      setProposals(propData || []);
      setVisits(vData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const allProps = producers.flatMap(p => p.properties);
    const completedVisits = visits.filter(v => v.status === 'completed');
    
    const totalArea = allProps.reduce((acc, p) => acc + (p.area || 0), 0);
    const avgInputCost = allProps.reduce((acc, p) => acc + (p.economic?.inputCost || 0), 0) / (allProps.length || 1);
    const totalPotentialRevenue = allProps.reduce((acc, p) => acc + (p.economic?.estimatedRevenue || 0) * (p.area || 0), 0);
    const totalProposalsValue = proposals.reduce((acc, p) => acc + p.totalValue, 0);
    const conversionRate = proposals.length > 0 ? (proposals.filter(p => p.columnId === 'col-5').length / proposals.length) * 100 : 0;
    const alertsCount = completedVisits.filter(v => v.pests || v.diseases).length;
    
    const cropDistribution = allProps.reduce((acc: any, p) => {
      acc[p.cropType] = (acc[p.cropType] || 0) + p.area;
      return acc;
    }, {});

    const rankedProperties = [...allProps]
      .sort((a, b) => (b.economic?.profitability || 0) - (a.economic?.profitability || 0))
      .map(p => ({
        ...p,
        producerName: producers.find(prod => prod.properties.some(prop => prop.id === p.id))?.name || 'N/A'
      }));

    return {
      totalProducers: producers.length,
      totalArea,
      avgInputCost,
      totalPotentialRevenue,
      totalProposalsValue,
      conversionRate,
      alertsCount,
      mainCrops: Object.keys(cropDistribution),
      cropDistribution,
      rankedProperties,
      avgProb: proposals.length > 0 ? proposals.reduce((acc, p) => acc + p.closingProbability, 0) / proposals.length : 0
    };
  }, [producers, proposals, visits]);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    const result = await generateStrategicInsights(stats);
    setInsights(String(result || ''));
    setIsGenerating(false);
  };

  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
    setReportAnalysis(null);
  };

  const handleFieldDeepDive = (field: any) => {
    setSelectedField(field);
    setFieldAnalysis(null);
  };

  const handleAnalyzeFieldDeepDive = async () => {
    if (!selectedField) return;
    setIsAnalyzingField(true);
    
    const fieldVisits = visits.filter(v => v.propertyId === selectedField.id);
    const pests = fieldVisits.map(v => v.pests).filter(Boolean).join(', ');
    const diseases = fieldVisits.map(v => v.diseases).filter(Boolean).join(', ');

    const analysis = await generateFieldDeepAnalysis({
      name: selectedField.name,
      cropType: selectedField.cropType,
      profitability: selectedField.economic?.profitability || 0,
      currentCost: selectedField.economic?.inputCost || 4500,
      projectedCost: 4000,
      pests: pests || 'Área Limpa',
      diseases: diseases || 'Nenhuma',
      managementStatus: 'Aplicações em 75%'
    });

    setFieldAnalysis(String(analysis || ''));
    setIsAnalyzingField(false);
  };

  const executiveReports = [
    { id: 'prod', title: 'Performance Produtiva', desc: 'Ranking de talhões e evolução de produtividade.', icon: Beaker, color: 'text-purple-500' },
    { id: 'fin', title: 'Custos e Rentabilidade', desc: 'Detalhamento de custos/ha e margens por safras.', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'risk', title: 'Riscos e Clima', desc: 'Impacto de chuvas e eventos extremos na produção.', icon: CloudRain, color: 'text-sky-500' },
    { id: 'sales', title: 'Funil Comercial', desc: 'Taxas de conversão e datas de fechamento previstas.', icon: Briefcase, color: 'text-orange-500' },
    { id: 'legal', title: 'Conformidade Legal', desc: 'Relatório de defensivos e selos ambientais.', icon: ShieldCheck, color: 'text-red-500' },
    { id: 'serv', title: 'Serviços Prestados', desc: 'Valor gerado pelas visitas e consultoria técnica.', icon: CheckCircle2, color: 'text-emerald-600' },
  ];

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" /> Carregando BI...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Business Intelligence</h1>
          <p className="text-sm text-gray-500">Insights estratégicos e performance da safra</p>
        </div>
        <div className="flex gap-3">
          <select value={filterSafra} onChange={e => setFilterSafra(e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-6 py-3 text-sm font-bold shadow-sm outline-none">
            <option value="all">Safra Atual (25/26)</option>
            <option value="24/25">Safra Anterior (24/25)</option>
          </select>
        </div>
      </header>

      {/* ANALISTA IA ESTRATÉGICO */}
      <section className="bg-gradient-to-br from-gray-900 to-emerald-950 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
        <Sparkles size={200} className="absolute -right-20 -bottom-20 opacity-5 -rotate-12" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-500 p-2 rounded-xl"><Sparkles size={20} /></div>
               <h2 className="text-xl font-black tracking-tight">Análise Preditiva Gemini</h2>
            </div>
            {insights ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left duration-500">
                <div className="text-sm text-emerald-100 leading-relaxed font-medium bg-white/5 p-6 rounded-[28px] border border-white/10 italic">
                  {insights.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                </div>
                <button onClick={handleGenerateInsights} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                  Regerar Análise <Activity size={12} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-emerald-100 opacity-60">IA analisando produtividade, janelas climáticas e riscos financeiros para sua carteira.</p>
            )}
          </div>
          {!insights && (
            <button onClick={handleGenerateInsights} disabled={isGenerating} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
              {isGenerating ? <Loader2 className="animate-spin" /> : <TrendingUp size={24} />}
              {isGenerating ? 'Analisando...' : 'Gerar Insights'}
            </button>
          )}
        </div>
      </section>

      {/* EXECUTIVE REPORTS DASHBOARD */}
      <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-sm">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Relatórios Executivos</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {executiveReports.map((rep) => {
              const Icon = rep.icon;
              return (
                <div key={rep.id} onClick={() => handleOpenReport(rep)} className="p-6 rounded-[32px] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all group cursor-pointer">
                   <div className={`p-4 rounded-2xl bg-white shadow-sm mb-6 w-fit transition-transform group-hover:-translate-y-1 ${rep.color}`}>
                      <Icon size={24} />
                   </div>
                   <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{rep.title}</h4>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">{rep.desc}</p>
                   <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      Acessar Relatório <ArrowRight size={14} />
                   </div>
                </div>
              );
            })}
         </div>
      </section>

      {/* REPORT MODAL */}
      {selectedReport && !selectedField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-5">
                   {(() => {
                     const Icon = selectedReport.icon;
                     return (
                       <div className={`p-5 rounded-3xl bg-white shadow-lg ${selectedReport.color}`}><Icon size={32} /></div>
                     );
                   })()}
                   <div><h3 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedReport.title}</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Painel Técnico Detalhado</p></div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-3 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {selectedReport.id === 'sales' ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Ticket Médio / Proposta</p>
                          <h5 className="text-2xl font-black text-gray-900">{formatCurrency(stats.totalProposalsValue / (proposals.length || 1))}</h5>
                       </div>
                       <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Taxa de Conversão</p>
                          <h5 className="text-4xl font-black text-emerald-600">{stats.conversionRate.toFixed(1)}%</h5>
                       </div>
                       <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Previsão Fechamentos</p>
                          <h5 className="text-4xl font-black text-sky-600">{proposals.filter(p => p.closingProbability >= 80).length}</h5>
                       </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50/50">
                             <tr>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Proposta</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Previsão</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Confiança</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Valor</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {proposals.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-all">
                                   <td className="px-8 py-5">
                                      <p className="text-sm font-bold text-gray-900">{p.title}</p>
                                      <p className="text-[10px] text-gray-400 uppercase">{p.farmName}</p>
                                   </td>
                                   <td className="px-8 py-5 text-xs font-bold text-gray-600">{safeFormatDate(p.expectedClosingDate)}</td>
                                   <td className="px-8 py-5">
                                      <div className="flex items-center justify-center gap-2">
                                         <span className={`text-[10px] font-black px-2 py-1 rounded-md ${p.closingProbability >= 80 ? 'bg-emerald-100 text-emerald-700' : p.closingProbability >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.closingProbability}%</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-5 text-right font-black text-gray-900">{formatCurrency(p.totalValue)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                ) : selectedReport.id === 'prod' ? (
                   <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">KPI: Eficiência Agregada</p>
                            <h5 className="text-4xl font-black text-emerald-600">84.2%</h5>
                         </div>
                         <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Custo Médio / ha</p>
                            <h5 className="text-2xl font-black text-gray-900">R$ 5.700</h5>
                         </div>
                         <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Desvio do Planejado</p>
                            <h5 className="text-4xl font-black text-orange-500">+12%</h5>
                         </div>
                      </div>

                      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                         <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h5 className="text-sm font-black text-gray-900 uppercase">Análise Individual por Talhão</h5>
                            <span className="text-[10px] font-bold text-gray-400 italic">Clique no talhão para Deep Dive</span>
                         </div>
                         <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                               <tr>
                                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Talhão / Fazenda</th>
                                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Cultura</th>
                                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Eficiência BI</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                               {stats.rankedProperties.map((p) => (
                                  <tr key={p.id} onClick={() => handleFieldDeepDive(p)} className="hover:bg-emerald-50/40 transition-all cursor-pointer group">
                                     <td className="px-8 py-5">
                                        <div><p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{p.name}</p><p className="text-[10px] text-gray-400">{p.producerName}</p></div>
                                     </td>
                                     <td className="px-8 py-5"><span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase">{p.cropType}</span></td>
                                     <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                           <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${p.economic?.profitability || 0}%` }}></div></div>
                                           <span className="text-sm font-black text-gray-900">{p.economic?.profitability || 0}%</span>
                                        </div>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                ) : (
                   <div className="py-20 text-center space-y-4 opacity-50">
                      <FileText size={48} className="mx-auto text-gray-200" />
                      <p className="text-lg font-bold text-gray-400">Processando BI para "{selectedReport.title}"...</p>
                   </div>
                )}
              </div>
           </div>
        </div>
      )}

      {/* FIELD DEEP DIVE MODAL */}
      {selectedField && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <div className="bg-[#0B0F19] rounded-[56px] w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300 border border-white/10 text-white">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-6">
                   <button onClick={() => setSelectedField(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ChevronLeft size={24} /></button>
                   <div>
                      <div className="flex items-center gap-3">
                         <h3 className="text-4xl font-black tracking-tighter">{selectedField.name}</h3>
                         <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Cultura: {selectedField.cropType}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{selectedField.producerName}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-emerald-400 transition-all"><Share2 size={24}/></button>
                   <button onClick={() => setSelectedField(null)} className="p-4 bg-white text-gray-900 rounded-2xl shadow-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">Sair do Deep Dive</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex flex-col justify-between h-48 group hover:bg-emerald-500/10 transition-all">
                      <div className="flex justify-between items-start">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eficiência Técnica</p>
                         <Gauge size={20} className="text-emerald-500" />
                      </div>
                      <div>
                         <h4 className="text-5xl font-black text-emerald-500">{selectedField.economic?.profitability || 0}%</h4>
                         <p className="text-[10px] text-gray-500 mt-2 font-bold">+4% vs Méd. Fazenda</p>
                      </div>
                   </div>
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex flex-col justify-between h-48 hover:border-orange-500/50 transition-all">
                      <div className="flex justify-between items-start">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget Burn (Custos)</p>
                         <DollarSign size={20} className="text-orange-500" />
                      </div>
                      <div>
                         <h4 className="text-4xl font-black">{formatCurrency(selectedField.economic?.inputCost || 4500)}</h4>
                         <p className="text-[10px] text-orange-500 mt-2 font-bold">110% do Orçado (Atraso)</p>
                      </div>
                   </div>
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex flex-col justify-between h-48">
                      <div className="flex justify-between items-start">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projeção Colheita</p>
                         <TrendingUp size={20} className="text-sky-500" />
                      </div>
                      <div>
                         <h4 className="text-4xl font-black">78 <span className="text-lg">sc/ha</span></h4>
                         <p className="text-[10px] text-sky-400 mt-2 font-bold">Cenário: Conservador</p>
                      </div>
                   </div>
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex flex-col justify-between h-48">
                      <div className="flex justify-between items-start">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risco Sanitário</p>
                         <AlertTriangle size={20} className="text-red-500" />
                      </div>
                      <div>
                         <h4 className="text-4xl font-black">BAIXO</h4>
                         <p className="text-[10px] text-emerald-400 mt-2 font-bold">Último monitoramento: 2 dias</p>
                      </div>
                   </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-900/40 to-sky-900/40 rounded-[48px] p-10 border border-white/10 relative overflow-hidden">
                   <Sparkles className="absolute -right-10 -bottom-10 opacity-10" size={200} />
                   <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                      <div className="max-w-2xl space-y-4">
                         <div className="flex items-center gap-3">
                            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/40"><Activity size={20} /></div>
                            <h4 className="text-xl font-black tracking-tight text-emerald-400 uppercase tracking-widest">Action Center (BI Inteligente)</h4>
                         </div>
                         {fieldAnalysis ? (
                            <div className="text-sm text-emerald-50 leading-relaxed font-medium bg-white/5 p-6 rounded-[32px] border border-white/5 italic shadow-inner">
                               "{fieldAnalysis}"
                            </div>
                         ) : (
                            <p className="text-sm text-gray-400 leading-relaxed font-medium">Ative o especialista IA para correlacionar o histórico de doenças, aplicações de defensivos e as anomalias climáticas detectadas no talhão.</p>
                         )}
                      </div>
                      {!fieldAnalysis && (
                        <button onClick={handleAnalyzeFieldDeepDive} disabled={isAnalyzingField} className="bg-emerald-500 hover:bg-emerald-400 text-white px-12 py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transition-all disabled:opacity-50 active:scale-95">
                           {isAnalyzingField ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                           {isAnalyzingField ? 'Processando Fatos...' : 'Recomendação Técnica'}
                        </button>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white/5 rounded-[48px] p-10 border border-white/10 space-y-8">
                      <div className="flex justify-between items-center">
                         <h5 className="text-lg font-bold uppercase tracking-widest text-orange-400 flex items-center gap-3"><FlaskConical size={20}/> Status de Aplicações</h5>
                         <span className="text-[10px] font-black text-gray-500 uppercase">Ciclo: 75% concluído</span>
                      </div>
                      <div className="space-y-6">
                         {[
                           { name: 'Dessecação (Pré-Plantio)', status: 'concluído', date: '10/10/25', icon: CheckCircle2, color: 'text-emerald-400' },
                           { name: 'Herbicida Pós-Emergência', status: 'concluído', date: '05/11/25', icon: CheckCircle2, color: 'text-emerald-400' },
                           { name: 'Fungicida 1ª Aplicação', status: 'concluído', date: '20/11/25', icon: CheckCircle2, color: 'text-emerald-400' },
                           { name: 'Fungicida 2ª Aplicação', status: 'atrasado', date: 'Prev: 10/12', icon: AlertTriangle, color: 'text-orange-400' },
                           { name: 'Inseticida Final', status: 'pendente', date: 'Prev: 25/12', icon: Clock, color: 'text-gray-500' },
                         ].map((app, idx) => (
                           <div key={idx} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                              <div className="flex items-center gap-4">
                                 <app.icon size={20} className={app.color} />
                                 <div><p className="text-sm font-bold">{app.name}</p><p className="text-[9px] text-gray-500 font-bold uppercase">{app.status}</p></div>
                              </div>
                              <span className="text-[10px] font-black text-gray-400">{app.date}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-[48px] p-10 border border-white/10 space-y-8 text-gray-900 bg-emerald-50">
                      <div className="flex justify-between items-center">
                         <h5 className="text-lg font-black uppercase tracking-tighter text-emerald-900 flex items-center gap-3"><History size={20}/> Histórico Inter-Safra</h5>
                         <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100 px-3 py-1 rounded-full">VS Safra 24/25</span>
                      </div>
                      <div className="space-y-10">
                         <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-gray-600 uppercase"><span>Produtividade (sc/ha)</span><div className="flex gap-4"><span>Safra 25: 78</span><span className="text-emerald-600">Safra 24: 72</span></div></div>
                            <div className="w-full h-8 bg-white rounded-xl overflow-hidden flex shadow-inner border border-gray-100 p-1">
                               <div className="h-full bg-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg" style={{ width: '78%' }}>ATUAL</div>
                            </div>
                            <div className="w-full h-6 bg-emerald-200/50 rounded-lg overflow-hidden flex border border-emerald-100 mt-1">
                               <div className="h-full bg-emerald-400/50 rounded-lg" style={{ width: '72%' }}></div>
                            </div>
                         </div>

                         <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-gray-600 uppercase"><span>Investimento (R$/ha)</span><div className="flex gap-4"><span>Safra 25: 5.7k</span><span className="text-orange-600">Safra 24: 4.8k</span></div></div>
                            <div className="w-full h-8 bg-white rounded-xl overflow-hidden flex shadow-inner border border-gray-100 p-1">
                               <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg" style={{ width: '85%' }}>ATUAL</div>
                            </div>
                            <div className="w-full h-6 bg-gray-200 rounded-lg overflow-hidden flex border border-gray-100 mt-1">
                               <div className="h-full bg-gray-400 rounded-lg" style={{ width: '70%' }}></div>
                            </div>
                         </div>
                         
                         <div className="p-6 bg-white/80 rounded-[32px] border border-emerald-200">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={12}/> Detecção de Padrão</p>
                            <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">O custo de manejo aumentou 18% devido a re-aplicação de fungicida, repetindo o padrão de infestação da mancha-alvo detectado na safra 24/25.</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
