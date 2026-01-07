
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Camera, MapPin, CheckCircle2, Send, Loader2, X, 
  Activity, AlertTriangle, Bug, Ghost, Leaf, FileText, 
  Clock, Calendar, History, ArrowRight, ChevronRight, Save, Plus,
  ArrowLeft, Sparkles
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { generateRTVReport } from '../services/geminiService';
import { Visit, Producer, Property } from '../types';

const VisitSession: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do Formulário Técnico
  const [notes, setNotes] = useState('');
  const [pests, setPests] = useState('');
  const [diseases, setDiseases] = useState('');
  const [weeds, setWeeds] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Estados de Controle
  const [step, setStep] = useState<'check-in' | 'active' | 'summary'>('check-in');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  const [visit, setVisit] = useState<Visit | null>(null);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const visitsData = await dataStore.getVisits();
      const producersData = await dataStore.getProducers();
      const v = visitsData.find(visit => visit.id === id);
      
      if (v) {
        setVisit(v);
        
        // Se a visita já estiver completada, carrega os dados para o modo visualização
        if (v.status === 'completed') {
          setNotes(v.notes || '');
          setPests(v.pests || '');
          setDiseases(v.diseases || '');
          setWeeds(v.weeds || '');
          setPhotos(v.photos || []);
          setCheckInTime(v.checkInTime || null);
          setCheckOutTime(v.checkOutTime || null);
          setReport({
            summary: v.reportSummary || 'Relatório sem resumo.',
            recommendations: (v.recommendations || '').split('\n').filter(r => r.trim() !== '')
          });
          setStep('summary');
        } else if (v.status === 'ongoing') {
          setCheckInTime(new Date().toISOString());
          setStep('active');
        }

        const prod = producersData.find(p => p.id === v.producerId);
        if (prod) {
          setProducer(prod);
          const prop = prod.properties.find(p => p.id === v.propertyId);
          setProperty(prop || null);
        }
      }
    };
    loadData();
  }, [id]);

  const handleCheckIn = () => {
    const now = new Date().toISOString();
    setCheckInTime(now);
    setStep('active');
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleFinish = async () => {
    if (!visit || !producer || !property) return;
    
    setIsGenerating(true);
    const now = new Date().toISOString();
    
    // 1. Gerar Relatório via IA Gemini baseado no que foi anotado
    const fullNotesForAI = `Observações: ${notes}. Pragas: ${pests}. Doenças: ${diseases}. Daninhas: ${weeds}.`;
    const aiReport = await generateRTVReport(fullNotesForAI, property.cropType);
    setReport(aiReport);

    // 2. Preparar Dados da Visita Atualizada
    const updatedVisit: Visit = {
      ...visit,
      status: 'completed',
      checkInTime: checkInTime || visit.checkInTime || now,
      checkOutTime: now,
      notes: notes,
      pests: pests,
      diseases: diseases,
      weeds: weeds,
      photos: photos,
      reportSummary: aiReport.summary,
      recommendations: aiReport.recommendations.join('\n')
    };

    // 3. Atualizar no DataStore
    await dataStore.updateVisit(updatedVisit);
    
    // 4. Sincronizar dados para o monitoramento ATUAL do talhão
    const updatedMonitoring = {
      techNotes: notes,
      pests: pests || 'Área limpa',
      diseases: diseases || 'Nenhuma identificada',
      weeds: weeds || 'Área limpa',
      plantingFailures: property.monitoring?.plantingFailures || 'Nenhuma',
      lastUpdate: now
    };
    
    const updatedProperties = producer.properties.map(p => 
      p.id === property.id ? { ...p, monitoring: updatedMonitoring } : p
    );
    
    await dataStore.updateProducer({
      ...producer,
      properties: updatedProperties
    });

    setIsGenerating(false);
    setStep('summary');
  };

  const shareWhatsApp = () => {
    const text = `*RELATÓRIO TÉCNICO DE CAMPO*\n*Cliente:* ${producer?.name}\n*Talhão:* ${property?.name}\n*Data:* ${new Date(visit?.date || '').toLocaleDateString('pt-BR')}\n\n*RESUMO IA:* ${report?.summary}\n\n*RECOMENDAÇÕES:*\n${report?.recommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}`;
    const contact = producer?.contacts.list.find(c => c.isPrimary) || producer?.contacts;
    const phone = (contact?.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!visit) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" /> Carregando registro...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange} 
      />

      {/* Cabeçalho de Contexto */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ArrowLeft size={20}/></button>
          <div className="flex-1">
            <h2 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-1">
              {visit.status === 'completed' ? 'Histórico de Visita' : 'Sessão Técnica Ativa'}
            </h2>
            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{property?.name}</h1>
            <p className="text-xs text-gray-500 font-medium line-clamp-1">{producer?.name}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">{property?.cropType}</span>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">{new Date(visit.date).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {step === 'check-in' && (
        <div className="bg-emerald-50 rounded-[40px] p-12 border border-emerald-100 text-center animate-in zoom-in duration-500 shadow-xl shadow-emerald-100/20">
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200 animate-bounce">
            <MapPin size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Iniciar agora neste talhão?</h3>
          <p className="text-gray-600 mb-10 max-w-xs mx-auto">O check-in registra o início do seu trabalho técnico para o histórico da {property?.name}.</p>
          <button 
            onClick={handleCheckIn}
            className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Começar Visita <ChevronRight size={20} />
          </button>
        </div>
      )}

      {step === 'active' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-900 text-white rounded-2xl"><FileText size={20}/></div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Observações do Talhão</h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o estado geral da lavoura, vigor, falhas ou qualquer detalhe técnico relevante..."
              className="w-full min-h-[140px] p-5 bg-gray-50 rounded-[24px] border-none focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm font-medium text-gray-700"
            />
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500 text-white rounded-2xl"><Activity size={20}/></div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Alertas Sanitários</h4>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase ml-1">
                  <Bug size={14} /> Pragas Identificadas
                </label>
                <input type="text" value={pests} onChange={e => setPests(e.target.value)} placeholder="Ex: Percevejo, Lagarta..." className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-5 py-4 text-sm font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-orange-600 uppercase ml-1">
                  <AlertTriangle size={14} /> Doenças
                </label>
                <input type="text" value={diseases} onChange={e => setDiseases(e.target.value)} placeholder="Ex: Ferrugem, Mancha..." className="w-full bg-orange-50/30 border border-orange-100 rounded-2xl px-5 py-4 text-sm font-bold text-orange-900 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-yellow-600 uppercase ml-1">
                  <Leaf size={14} /> Plantas Daninhas
                </label>
                <input type="text" value={weeds} onChange={e => setWeeds(e.target.value)} placeholder="Ex: Buva, Capim..." className="w-full bg-yellow-50/30 border border-yellow-100 rounded-2xl px-5 py-4 text-sm font-bold text-yellow-900 outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl"><Camera size={20}/></div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Fotos do Talhão</h4>
              </div>
              <button onClick={handleAddPhotoClick} className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors">
                <Plus size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm border border-gray-100">
                  <img src={p} alt="Evidência" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                </div>
              ))}
              <button onClick={handleAddPhotoClick} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all">
                <Camera size={28} /><span className="text-[9px] mt-2 font-black uppercase tracking-tighter">Anexar</span>
              </button>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            disabled={isGenerating || !notes}
            className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-emerald-600 transition-all active:scale-95"
          >
            {isGenerating ? (
              <><Loader2 className="animate-spin" /> Processando com IA...</>
            ) : (
              <><Save size={24} /> Salvar e Finalizar</>
            )}
          </button>
        </div>
      )}

      {step === 'summary' && report && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><CheckCircle2 size={120} /></div>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mb-8 shadow-inner"><CheckCircle2 size={40} /></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Relatório Técnico</h3>
                <p className="text-xs text-gray-400 font-bold uppercase">Consolidado em {new Date(visit.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                {checkInTime && checkOutTime && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 justify-end">
                    <Clock size={12} /> Tempo em campo: {Math.round((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 60000)} min
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-500" /> Diagnóstico Estratégico (IA)
                </h4>
                <div className="p-6 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50">
                  <p className="text-gray-700 leading-relaxed text-sm font-medium italic">"{report.summary}"</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Recomendações da Visita</h4>
                <ul className="space-y-4">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 group-hover:bg-emerald-500 transition-colors">{i+1}</span>
                      <p className="text-sm text-gray-700 font-bold">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Notas do Consultor</h5>
                   <p className="text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 min-h-[80px] leading-relaxed">{notes || 'Sem observações manuais.'}</p>
                 </div>
                 <div className="space-y-3">
                   <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alertas Sanitários</h5>
                   <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl"><Bug size={14}/> {pests || 'Limpo'}</div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 bg-orange-50 p-2 rounded-xl"><AlertTriangle size={14}/> {diseases || 'Monitorado'}</div>
                   </div>
                 </div>
              </div>

              {photos.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Evidências Fotográficas</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {photos.map((p, idx) => (
                      <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
                        <img src={p} alt="Evidência" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={shareWhatsApp} className="flex-1 bg-emerald-500 text-white py-5 rounded-[24px] font-bold shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"><Send size={22} /> Enviar para o Produtor</button>
            <button onClick={() => navigate(`/field/${property?.id}`)} className="flex-1 bg-gray-100 text-gray-900 py-5 rounded-[24px] font-bold hover:bg-gray-200 transition-colors">Voltar ao Talhão</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitSession;
