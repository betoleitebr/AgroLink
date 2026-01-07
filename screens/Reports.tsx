
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
    const parts = isoString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoString;
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
    
    const totalArea = allProps.reduce((acc, p) => acc + Number(p.area || 0), 0);
    const avgInputCost = allProps.reduce((acc, p) => acc + Number(p.economic?.inputCost || 0), 0) / (allProps.length || 1);
    const totalPotentialRevenue = allProps.reduce((acc, p) => acc + (Number(p.economic?.estimatedRevenue || 0) * Number(p.area || 0)), 0);
    const totalProposalsValue = proposals.reduce((acc, p) => acc + Number(p.totalValue || 0), 0);
    const conversionRate = proposals.length > 0 ? (proposals.filter(p => p.columnId === 'col-5').length / proposals.length) * 100 : 0;
    const alertsCount = completedVisits.filter(v => v.pests || v.diseases).length;
    
    const cropDistribution = allProps.reduce((acc: any, p) => {
      acc[p.cropType] = (acc[p.cropType] || 0) + Number(p.area || 0);
      return acc;
    }, {});

    const rankedProperties = [...allProps]
      .sort((a, b) => (Number(b.economic?.profitability || 0)) - (Number(a.economic?.profitability || 0)))
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
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Pipeline Total</p>
                          <h5 className="text-2xl font-black text-gray-900">{formatCurrency(stats.totalProposalsValue)}</h5>
                       </div>
                       <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Taxa de Conversão</p>
                          <h5 className="text-4xl font-black text-emerald-600">{stats.conversionRate.toFixed(1)}%</h5>
                       </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50/50">
                             <tr>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Proposta</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase">Previsão</th>
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
                                   <td className="px-8 py-5 text-right font-black text-gray-900">{formatCurrency(Number(p.totalValue || 0))}</td>
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
    </div>
  );
};

export default Reports;
