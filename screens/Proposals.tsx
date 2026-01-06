
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, LayoutGrid, List, Search, Filter, MoreVertical, 
  ChevronRight, ChevronLeft, PlusCircle, Trash2, Edit3, 
  CheckCircle2, Clock, Calendar, Building2, DollarSign, X,
  ShoppingBag, Map as MapIcon, Leaf, Check, Briefcase, Info,
  TrendingUp, UserCheck, AlertTriangle, Target, FileText,
  Percent, ArrowUpRight, Beaker, Settings2, Settings,
  Hash, Layers, ArrowRight, Move, Sparkles, Send, Copy,
  Loader2, MessageSquare, History as HistoryIcon, Save, BellRing,
  Palette, BarChart3, TrendingDown, Gauge, User
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { generateSalesProposal, generateFollowUpMessage } from '../services/geminiService';
import { Proposal, ProposalColumn, CatalogItem, Producer, ActivityGroup, ProposalItem, ConversationNote } from '../types';

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [columns, setColumns] = useState<ProposalColumn[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para novas culturas
  const [isAddingNewActivity, setIsAddingNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [isCropsLoading, setIsCropsLoading] = useState(false);
  const [addSuccessFeedback, setAddSuccessFeedback] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [pData, cData, prodData, catData, cropData] = await Promise.all([
        dataStore.getProposals(),
        dataStore.getProposalColumns(),
        dataStore.getProducers(),
        dataStore.getCatalog(),
        dataStore.getAvailableCrops()
      ]);
      setProposals(pData || []);
      setColumns(cData || []);
      setProducers(prodData || []);
      setCatalog(catData || []);
      setAvailableCrops(cropData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSafra, setFilterSafra] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showManageColumns, setShowManageColumns] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [selectedColumnForNew, setSelectedColumnForNew] = useState<string | null>(null);

  const [formStep, setFormStep] = useState(1);
  const [currentGroupActivity, setCurrentGroupActivity] = useState('');
  const [currentGroupPropertyIds, setCurrentGroupPropertyIds] = useState<string[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const [draggedProposalId, setDraggedProposalId] = useState<string | null>(null);
  const [isOverColumnId, setIsOverColumnId] = useState<string | null>(null);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  const [newConversationNote, setNewConversationNote] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');

  const [newProposalData, setNewProposalData] = useState({
    title: '',
    producerId: '',
    contactId: '',
    activityGroups: [] as ActivityGroup[],
    safra: '26/26',
    closingDate: '',
    validityDate: '',
    paymentMethod: 'Safra + 30 dias',
    technicalLead: 'João Silva',
    commercialLead: 'João Silva',
    closingProbability: 50,
    description: '',
    internalNotes: '',
    aiGeneratedContent: '',
    conversationHistory: [] as ConversationNote[],
    nextContactDate: ''
  });

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSafra = filterSafra === 'all' || p.safra === filterSafra;
      const matchActivity = filterActivity === 'all' || p.activityGroups.some(ag => ag.activity === filterActivity);
      
      let matchConfidence = true;
      if (filterConfidence === 'high') matchConfidence = p.closingProbability >= 80;
      else if (filterConfidence === 'mid') matchConfidence = p.closingProbability >= 40 && p.closingProbability < 80;
      else if (filterConfidence === 'low') matchConfidence = p.closingProbability < 40;

      return matchSearch && matchSafra && matchActivity && matchConfidence;
    });
  }, [proposals, searchTerm, filterSafra, filterActivity, filterConfidence]);

  const pipelineMetrics = useMemo(() => {
    const total = proposals.reduce((acc, p) => acc + p.totalValue, 0);
    const weighted = proposals.reduce((acc, p) => acc + (p.totalValue * (p.closingProbability / 100)), 0);
    const guaranteed = proposals.filter(p => p.closingProbability >= 80).length;
    return { total, weighted, guaranteed };
  }, [proposals]);

  const selectedProducer = producers.find(p => p.id === newProposalData.producerId);
  const availableContacts = selectedProducer?.contacts?.list || [];
  
  useEffect(() => {
    if (selectedProducer) {
      if (availableCrops.length > 0 && (!currentGroupActivity || !availableCrops.includes(currentGroupActivity))) {
        setCurrentGroupActivity(availableCrops[0]);
      }
    } else {
      setCurrentGroupActivity('');
    }
  }, [newProposalData.producerId, selectedProducer, availableCrops]);

  const safeFormatDate = (isoString: string) => {
    if (!isoString) return '';
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  const calculateTotalValue = () => {
    return newProposalData.activityGroups.reduce((total, group) => {
      return total + group.items.reduce((groupTotal, item) => {
        const catalogItem = catalog.find(c => c.id === item.itemId);
        return groupTotal + (catalogItem ? catalogItem.price * item.quantity : 0);
      }, 0);
    }, 0);
  };

  const handleDragStart = (e: React.DragEvent, proposalId: string) => {
    setDraggedProposalId(proposalId);
    e.dataTransfer.setData('proposalId', proposalId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setIsOverColumnId(columnId);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const proposalId = e.dataTransfer.getData('proposalId') || draggedProposalId;
    
    if (proposalId) {
      const updatedList = await dataStore.updateProposalStatus(proposalId, targetColumnId);
      setProposals([...updatedList]);
    }
    
    setDraggedProposalId(null);
    setIsOverColumnId(null);
  };

  const handleAddConversationNote = async () => {
    if (!newConversationNote.trim()) return;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const note: ConversationNote = {
      id: `note-${Date.now()}`,
      timestamp: formattedDate,
      content: newConversationNote
    };
    const updatedHistory = [note, ...newProposalData.conversationHistory];
    setNewProposalData(prev => ({
      ...prev,
      conversationHistory: updatedHistory,
      nextContactDate: nextContactDate || prev.nextContactDate
    }));
    if (editingProposalId) {
      const currentProposal = proposals.find(p => p.id === editingProposalId);
      if (currentProposal) {
        const updatedProposal = {
          ...currentProposal,
          conversationHistory: updatedHistory,
          nextContactDate: nextContactDate || currentProposal.nextContactDate,
          closingProbability: newProposalData.closingProbability,
          title: newProposalData.title
        };
        const updatedList = await dataStore.updateProposal(updatedProposal);
        setProposals([...updatedList]);
      }
    }
    setNewConversationNote('');
  };

  const handleFollowUpAI = async () => {
    if (!editingProposalId || !selectedProducer) return;
    setIsGeneratingFollowUp(true);
    const contact = availableContacts.find(c => c.id === newProposalData.contactId);
    const contactName = contact?.name || selectedProducer.contacts.owner || "Produtor";
    const message = await generateFollowUpMessage(
      newProposalData.conversationHistory, 
      contactName, 
      selectedProducer.farmName
    );
    setIsGeneratingFollowUp(false);
    const phoneContact = contact || selectedProducer.contacts;
    const phone = (phoneContact.phone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAIProposalGeneration = async () => {
    if (!selectedProducer || !newProposalData.contactId) {
      alert("Selecione um cliente e um contato destinatário primeiro.");
      return;
    }
    const contact = availableContacts.find(c => c.id === newProposalData.contactId);
    const contactName = contact?.name || selectedProducer.contacts.owner || "Produtor";
    setIsGeneratingAI(true);
    const itemsNames = newProposalData.activityGroups.flatMap(g => 
      g.items.map(i => catalog.find(c => c.id === i.itemId)?.name || "")
    ).filter(name => name !== "") as string[];
    const uniqueActivities = Array.from(new Set(newProposalData.activityGroups.map(g => g.activity))) as string[];
    const generatedText = await generateSalesProposal({
      contactName,
      farmName: selectedProducer.farmName,
      safra: newProposalData.safra,
      activities: uniqueActivities,
      totalValue: calculateTotalValue(),
      paymentMethod: newProposalData.paymentMethod,
      items: itemsNames,
      description: newProposalData.description
    });
    setNewProposalData(prev => ({ ...prev, aiGeneratedContent: generatedText }));
    setIsGeneratingAI(false);
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    const newCol: ProposalColumn = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      order: columns.length + 1,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    };
    const updatedColumns = await dataStore.addColumn(newCol);
    setColumns([...updatedColumns]);
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  const handleUpdateColumn = async (col: ProposalColumn) => {
    const updatedColumns = await dataStore.updateColumn(col);
    setColumns([...updatedColumns]);
  };

  const handleDeleteColumn = async (colId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
      const result = await dataStore.deleteColumn(colId);
      setColumns([...result.proposalColumns]);
      setProposals([...result.proposals]);
    }
  };

  const handleOpenNewProposal = (colId?: string) => {
    setEditingProposalId(null);
    setSelectedColumnForNew(colId || columns[0]?.id || 'col-1');
    setNewProposalData({
      title: '',
      producerId: '',
      contactId: '',
      activityGroups: [],
      safra: '26/26',
      closingDate: '',
      validityDate: '',
      paymentMethod: 'Safra + 30 dias',
      technicalLead: 'João Silva',
      commercialLead: 'João Silva',
      closingProbability: 50,
      description: '',
      internalNotes: '',
      aiGeneratedContent: '',
      conversationHistory: [],
      nextContactDate: ''
    });
    setNextContactDate('');
    setFormStep(1);
    setShowAddProposal(true);
  };

  const handleOpenEditProposal = (proposal: Proposal) => {
    setEditingProposalId(proposal.id);
    setSelectedColumnForNew(proposal.columnId);
    setNewProposalData({
      title: proposal.title,
      producerId: proposal.producerId,
      contactId: proposal.contactId || '',
      activityGroups: proposal.activityGroups || [],
      safra: proposal.safra,
      closingDate: proposal.expectedClosingDate,
      validityDate: proposal.validityDate,
      paymentMethod: proposal.paymentMethod,
      technicalLead: proposal.technicalLead,
      commercialLead: proposal.commercialLead,
      closingProbability: proposal.closingProbability,
      description: proposal.description,
      internalNotes: proposal.internalNotes || '',
      aiGeneratedContent: proposal.aiGeneratedContent || '',
      conversationHistory: proposal.conversationHistory || [],
      nextContactDate: proposal.nextContactDate || ''
    });
    setNextContactDate(proposal.nextContactDate || '');
    setFormStep(1);
    setShowAddProposal(true);
  };

  const handleAddActivityGroup = () => {
    if (currentGroupPropertyIds.length === 0) return alert('Selecione ao menos um talhão (departamento).');
    const newGroup: ActivityGroup = { activity: currentGroupActivity, propertyIds: [...currentGroupPropertyIds], items: [] };
    setNewProposalData(prev => ({ ...prev, activityGroups: [...prev.activityGroups, newGroup] }));
    setCurrentGroupPropertyIds([]);
    setActiveGroupIndex(newProposalData.activityGroups.length);
    
    // Feedback de sucesso
    setAddSuccessFeedback(true);
    setTimeout(() => setAddSuccessFeedback(false), 2000);
  };

  const handleAddNewActivityMetadata = async () => {
    if (!newActivityName.trim()) return;
    setIsCropsLoading(true);
    try {
      const updated = await dataStore.addAvailableCrop(newActivityName.trim());
      setAvailableCrops(updated);
      setCurrentGroupActivity(newActivityName.trim());
      setNewActivityName('');
      setIsAddingNewActivity(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropsLoading(false);
    }
  };

  const removeActivityGroup = (index: number) => {
    setNewProposalData(prev => ({ ...prev, activityGroups: prev.activityGroups.filter((_, i) => i !== index) }));
    if (activeGroupIndex >= index && activeGroupIndex > 0) setActiveGroupIndex(activeGroupIndex - 1);
  };

  const handleUpdateItemsForActiveGroup = (newItems: ProposalItem[]) => {
    const updatedGroups = [...newProposalData.activityGroups];
    updatedGroups[activeGroupIndex] = { ...updatedGroups[activeGroupIndex], items: newItems };
    setNewProposalData(prev => ({ ...prev, activityGroups: updatedGroups }));
  };

  const handleAddProposal = async () => {
    const producer = producers.find(p => p.id === newProposalData.producerId);
    const baseProposalData = {
      title: newProposalData.title,
      producerId: newProposalData.producerId,
      contactId: newProposalData.contactId,
      farmName: producer?.farmName || 'Fazenda Desconhecida',
      activityGroups: newProposalData.activityGroups,
      totalValue: calculateTotalValue(),
      paymentMethod: newProposalData.paymentMethod,
      validityDate: newProposalData.validityDate,
      safra: newProposalData.safra,
      expectedClosingDate: newProposalData.closingDate,
      closingProbability: newProposalData.closingProbability,
      technicalLead: newProposalData.technicalLead,
      commercialLead: newProposalData.commercialLead,
      description: newProposalData.description,
      internalNotes: newProposalData.internalNotes,
      aiGeneratedContent: newProposalData.aiGeneratedContent,
      conversationHistory: newProposalData.conversationHistory,
      nextContactDate: nextContactDate || newProposalData.nextContactDate
    };
    
    let updatedList: Proposal[];
    if (editingProposalId) {
      const existing = proposals.find(p => p.id === editingProposalId);
      updatedList = existing ? await dataStore.updateProposal({ ...existing, ...baseProposalData } as Proposal) : proposals;
    } else {
      updatedList = await dataStore.addProposal({
        id: `prop-${Date.now()}`,
        code: `PROP-${new Date().getFullYear()}-${proposals.length + 1}`,
        columnId: selectedColumnForNew!,
        createdAt: new Date().toISOString().split('T')[0],
        lastMovementDate: new Date().toISOString().split('T')[0],
        ...baseProposalData
      } as Proposal);
    }
    setProposals([...updatedList]);
    setShowAddProposal(false);
  };

  const ProbabilityBadge = ({ probability }: { probability: number }) => {
    let label = 'Média';
    let style = 'bg-amber-100 text-amber-700 border-amber-200';
    if (probability <= 20) { label = 'Muito Baixa'; style = 'bg-rose-100 text-rose-700 border-rose-200'; }
    else if (probability <= 40) { label = 'Baixa'; style = 'bg-orange-100 text-orange-700 border-orange-200'; }
    else if (probability <= 60) { label = 'Média'; style = 'bg-amber-100 text-amber-700 border-amber-200'; }
    else if (probability <= 80) { label = 'Alta'; style = 'bg-emerald-100 text-emerald-700 border-emerald-200'; }
    else { label = 'Garantida'; style = 'bg-emerald-600 text-white border-emerald-700'; }
    
    return (
      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 ${style}`}>
        <Target size={10} /> {label}
      </span>
    );
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" /> Carregando funil de vendas...</div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gray-900 text-white rounded-2xl shadow-lg"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Total</p>
            <h4 className="text-2xl font-black text-gray-900">{formatCurrency(pipelineMetrics.total)}</h4>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Ponderado (Forecast)</p>
            <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(pipelineMetrics.weighted)}</h4>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Negócios de Alta Confiança</p>
            <h4 className="text-2xl font-black text-sky-600">{pipelineMetrics.guaranteed} <span className="text-xs text-gray-400 font-bold uppercase">Propostas</span></h4>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funil de Vendas</h1>
          <p className="text-sm text-gray-500">Gestão de propostas focada em conversão</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18}/><span className={`text-[10px] font-bold uppercase px-1 ${viewMode === 'kanban' ? 'block' : 'hidden'}`}>Kanban</span></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><List size={18}/><span className={`text-[10px] font-bold uppercase px-1 ${viewMode === 'list' ? 'block' : 'hidden'}`}>Lista</span></button>
           </div>
           <button onClick={() => handleOpenNewProposal()} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"><Plus size={20} /> Nova Proposta</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Proposta, cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 shadow-sm outline-none" />
        </div>
        <select value={filterConfidence} onChange={(e) => setFilterConfidence(e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 outline-none">
          <option value="all">Todas Confianças</option>
          <option value="high">Alta (80-100%)</option>
          <option value="mid">Média (40-79%)</option>
          <option value="low">Baixa (0-39%)</option>
        </select>
        <select value={filterSafra} onChange={(e) => setFilterSafra(e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 outline-none">
          <option value="all">Todas Safras</option><option value="24/25">24/25</option><option value="25/26">25/26</option>
        </select>
        <div className="flex gap-2">
          <button onClick={() => setShowAddColumn(true)} className="flex-1 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase px-4 py-3 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
            <PlusCircle size={16} className="text-emerald-500" /> Etapa
          </button>
          <button onClick={() => setShowManageColumns(true)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 shadow-sm hover:text-gray-900 transition-colors"><Settings size={20}/></button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 min-h-[600px] scrollbar-hide">
          {columns.map((column) => {
            const columnProposals = filteredProposals.filter(p => p.columnId === column.id);
            const columnTotalValue = columnProposals.reduce((acc, p) => acc + p.totalValue, 0);
            const isTarget = isOverColumnId === column.id;
            
            return (
              <div key={column.id} className="w-80 flex-shrink-0 flex flex-col gap-4" onDragOver={(e) => handleDragOver(e, column.id)} onDrop={(e) => handleDrop(e, column.id)} onDragLeave={() => setIsOverColumnId(null)}>
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{column.title}</h3>
                    <span className="bg-white border border-gray-100 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{columnProposals.length}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">{formatCurrency(columnTotalValue)}</span>
                </div>
                <div className={`flex flex-col gap-4 p-3 rounded-[32px] flex-1 transition-colors duration-300 ${isTarget ? 'bg-emerald-50 ring-2 ring-emerald-200 ring-inset' : 'bg-gray-100/40'}`}>
                  {columnProposals.map((proposal) => (
                    <div key={proposal.id} onClick={() => handleOpenEditProposal(proposal)} draggable="true" onDragStart={(e) => handleDragStart(e, proposal.id)} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-95 active:rotate-2 group ${draggedProposalId === proposal.id ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-[8px] font-bold text-gray-400 uppercase">{proposal.code}</span>
                             <ProbabilityBadge probability={proposal.closingProbability} />
                           </div>
                           <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">{proposal.title}</h4>
                        </div>
                        <div className="text-gray-300 group-hover:text-gray-400"><Move size={14} /></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold"><Building2 size={12}/> {proposal.farmName}</div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                          <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded shadow-inner border border-emerald-100">{proposal.closingProbability}% Confiança</span>
                          {proposal.expectedClosingDate && (
                            <span className="font-bold text-sky-600 flex items-center gap-1"><Calendar size={10}/> {safeFormatDate(proposal.expectedClosingDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-900">
                        {formatCurrency(proposal.totalValue)}
                      </div>
                    </div>
                  ))}
                  {columnProposals.length === 0 && <div className="h-20 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300"><PlusCircle size={24} className="opacity-20" /></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Negócio / Safra</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Propriedade</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Previsão Fechamento</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Confiança</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Valor</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredProposals.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-20 text-center"><p className="font-bold text-sm text-gray-300">Nenhuma proposta encontrada</p></td></tr>
               ) : (
                 filteredProposals.map(p => (
                    <tr key={p.id} onClick={() => handleOpenEditProposal(p)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{p.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Safra {p.safra} • {p.code}</p>
                      </td>
                      <td className="px-6 py-5"><div className="flex items-center gap-2 text-xs font-medium text-gray-600"><Building2 size={14} className="text-gray-300" />{p.farmName}</div></td>
                      <td className="px-6 py-5"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.expectedClosingDate ? 'text-sky-600 bg-sky-50' : 'text-gray-300 bg-gray-50'}`}>{p.expectedClosingDate ? safeFormatDate(p.expectedClosingDate) : 'Não definida'}</span></td>
                      <td className="px-6 py-5 flex justify-center"><ProbabilityBadge probability={p.closingProbability} /></td>
                      <td className="px-6 py-5 font-black text-gray-900 text-right">{formatCurrency(p.totalValue)}</td>
                    </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      )}

      {/* Modals */}
      {showAddColumn && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-900">Nova Etapa do Funil</h3><button onClick={() => setShowAddColumn(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button></div>
             <div className="p-6 space-y-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome da Etapa</label><input type="text" value={newColumnTitle} onChange={e => setNewColumnTitle(e.target.value)} placeholder="Ex: Pós-Venda" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" autoFocus /></div></div>
             <div className="p-6 bg-gray-50 flex gap-3"><button onClick={() => setShowAddColumn(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs uppercase">Cancelar</button><button onClick={handleAddColumn} disabled={!newColumnTitle.trim()} className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase shadow-lg disabled:opacity-30">Salvar Etapa</button></div>
          </div>
        </div>
      )}

      {showManageColumns && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"><div className="flex items-center gap-3"><div className="p-2.5 bg-gray-900 text-white rounded-xl"><Settings size={20}/></div><h3 className="text-lg font-bold text-gray-900">Configurar Funil de Vendas</h3></div><button onClick={() => setShowManageColumns(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button></div>
             <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {columns.map((col) => (
                   <div key={col.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex items-center gap-4"><div className="relative group"><input type="color" value={col.color} onChange={e => handleUpdateColumn({...col, color: e.target.value})} className="w-10 h-10 rounded-xl border-none p-0 cursor-pointer bg-transparent"/><Palette size={14} className="absolute inset-0 m-auto text-white pointer-events-none drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity"/></div><div className="flex-1"><input type="text" value={col.title} onChange={e => handleUpdateColumn({...col, title: e.target.value})} className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none w-full"/></div><button onClick={() => handleDeleteColumn(col.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button></div>
                ))}
             </div>
             <div className="p-6 bg-white border-t border-gray-50"><button onClick={() => setShowManageColumns(false)} className="w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-sm uppercase shadow-xl active:scale-95 transition-transform">Concluir Ajustes</button></div>
          </div>
        </div>
      )}

      {showAddProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3"><div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Briefcase size={20}/></div><div><h3 className="text-xl font-bold text-gray-900">{editingProposalId ? 'Gestão do Negócio' : 'Nova Oportunidade'}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{newProposalData.title || 'Pipeline Agrolink'}</p></div></div>
              <button onClick={() => setShowAddProposal(false)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-gray-50 px-6 bg-white overflow-x-auto scrollbar-hide">
               {[
                 { step: 1, label: editingProposalId ? 'CRM & Negociação' : '1. Cliente & Atividades', icon: MessageSquare },
                 { step: 2, label: editingProposalId ? 'Escopo & Itens' : '2. Catálogo & Itens', icon: ShoppingBag },
                 { step: 3, label: editingProposalId ? 'Financeiro' : '3. Financeiro & Comercial', icon: DollarSign },
                 { step: 4, label: editingProposalId ? 'IA & Envio' : '4. IA & Finalização', icon: Target },
               ].map(s => (
                 <button key={s.step} onClick={() => setFormStep(s.step)} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${formStep === s.step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}><s.icon size={14}/> {s.label}</button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {formStep === 1 && (
                <div className="animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={14} className="text-emerald-500"/> Identificação do Negócio</h4>
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Título da Proposta</label>
                          <input type="text" value={newProposalData.title} onChange={e => setNewProposalData({...newProposalData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Nova safra milho 26/27"/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cliente / Grupo Agrícola</label>
                          <select value={newProposalData.producerId} onChange={e => setNewProposalData({...newProposalData, producerId: e.target.value, contactId: '', activityGroups: []})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="">Selecione o Produtor...</option>
                            {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        
                        {selectedProducer && (
                          <div className="space-y-1 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Contato Destinatário</label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <select 
                                value={newProposalData.contactId} 
                                onChange={e => setNewProposalData({...newProposalData, contactId: e.target.value})} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="">Selecione quem receberá a proposta...</option>
                                <option value="owner">{selectedProducer.contacts.owner} (Proprietário)</option>
                                {availableContacts.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                ))}
                              </select>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1 ml-1 italic">* A proposta será endereçada nominalmente a esta pessoa.</p>
                          </div>
                        )}
                      </div>
                      
                      {newProposalData.activityGroups.length > 0 && (
                        <div className="pt-6 animate-in fade-in">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Grupos Adicionados ({newProposalData.activityGroups.length})</h4>
                          <div className="space-y-2">
                             {newProposalData.activityGroups.map((group, idx) => (
                               <div key={idx} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><Leaf size={16}/></div>
                                   <div>
                                     <p className="text-xs font-bold text-gray-900">{group.activity}</p>
                                     <p className="text-[9px] text-gray-400 font-bold uppercase">{group.propertyIds.length} Talhões Selecionados</p>
                                   </div>
                                 </div>
                                 <button onClick={() => removeActivityGroup(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={14} className="text-sky-500"/> Configuração de Atividades</h4>
                      {selectedProducer ? (
                        <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl space-y-8 border border-white/5">
                           <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cultura / Atividade</label>
                                {!isAddingNewActivity ? (
                                  <button onClick={() => setIsAddingNewActivity(true)} className="text-[9px] font-bold text-white/50 hover:text-white flex items-center gap-1"><Plus size={10}/> Adicionar Outra</button>
                                ) : (
                                  <button onClick={() => setIsAddingNewActivity(false)} className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"><X size={10}/> Cancelar</button>
                                )}
                             </div>
                             
                             {!isAddingNewActivity ? (
                               <div className="flex gap-3">
                                 <select value={currentGroupActivity} onChange={e => setCurrentGroupActivity(e.target.value)} className="flex-1 bg-white/10 border border-white/10 text-white rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                                   {availableCrops.map(act => <option key={act} className="text-gray-900" value={act}>{act}</option>)}
                                 </select>
                                 <button 
                                  onClick={handleAddActivityGroup} 
                                  className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${addSuccessFeedback ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'}`}
                                 >
                                   {addSuccessFeedback ? 'ADICIONADO!' : 'ADD GRUPO'}
                                 </button>
                               </div>
                             ) : (
                               <div className="flex gap-3 animate-in slide-in-from-right">
                                 <input type="text" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} placeholder="Ex: Girassol, Sorgo..." className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                                 <button onClick={handleAddNewActivityMetadata} disabled={isCropsLoading} className="bg-sky-500 text-white px-6 rounded-2xl font-bold">
                                   {isCropsLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                 </button>
                               </div>
                             )}
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} /> Selecione os Talhões (Departamentos)
                              </label>
                              <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedProducer.properties.map(prop => (
                                  <label key={prop.id} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${currentGroupPropertyIds.includes(prop.id) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>
                                    <input type="checkbox" checked={currentGroupPropertyIds.includes(prop.id)} onChange={() => { const ids = currentGroupPropertyIds.includes(prop.id) ? currentGroupPropertyIds.filter(i => i !== prop.id) : [...currentGroupPropertyIds, prop.id]; setCurrentGroupPropertyIds(ids); }} className="hidden" />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${currentGroupPropertyIds.includes(prop.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-700'}`}>
                                      {currentGroupPropertyIds.includes(prop.id) && <Check size={10} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate">{prop.name}</p>
                                      <p className="text-[9px] opacity-50 uppercase">{prop.area} ha • {prop.cropType}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {selectedProducer.properties.length === 0 && (
                                <p className="text-[10px] text-gray-500 italic text-center py-4">Nenhum talhão cadastrado para este produtor.</p>
                              )}
                           </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-[40px] p-12 border border-dashed border-gray-200 text-center">
                          <Building2 size={40} className="text-gray-200 mx-auto mb-4" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selecione um cliente primeiro para gerenciar talhões</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right">
                    <div className="flex flex-col lg:flex-row gap-8">
                       <div className="w-full lg:w-72 space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Atividades Selecionadas</h4>
                          <div className="flex flex-col gap-2">
                             {newProposalData.activityGroups.map((group, idx) => (
                               <button key={idx} onClick={() => setActiveGroupIndex(idx)} className={`p-4 rounded-2xl border text-left transition-all ${activeGroupIndex === idx ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-500'}`}><div className="flex justify-between items-center mb-1"><span className="text-sm font-bold">{group.activity}</span></div><p className="text-[9px] truncate opacity-50">{group.propertyIds.length} talhões selecionados</p></button>
                             ))}
                          </div>
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="text-lg font-bold text-gray-900">Itens Sugeridos para: {newProposalData.activityGroups[activeGroupIndex]?.activity}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                             {catalog.map(item => {
                                const group = newProposalData.activityGroups[activeGroupIndex];
                                const selected = group?.items.find(i => i.itemId === item.id);
                                return (
                                  <div key={item.id} className={`bg-white p-5 rounded-[28px] border transition-all ${selected ? 'border-emerald-500 shadow-lg' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-start"><div className="flex items-center gap-3"><button onClick={() => { const newItems = selected ? group.items.filter(i => i.itemId !== item.id) : [...group.items, { itemId: item.id, quantity: 1, priceAtTime: item.price }]; handleUpdateItemsForActiveGroup(newItems); }} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200'}`}>{selected && <Check size={14}/>}</button><div><p className="text-sm font-bold text-gray-900">{item.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{item.category}</p></div></div><p className="text-xs font-bold text-emerald-600">R$ {item.price}</p></div>
                                    {selected && (
                                       <div className="mt-4 flex items-center gap-3 bg-gray-50 p-2 rounded-xl"><input type="number" min="1" value={selected.quantity} onChange={e => { const val = parseInt(e.target.value); if(val >= 0) { const newItems = group.items.map(i => i.itemId === item.id ? {...i, quantity: val} : i); handleUpdateItemsForActiveGroup(newItems); }}} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold outline-none text-center" /><span className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}</span></div>
                                    )}
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden"><DollarSign size={180} className="absolute -right-16 -bottom-16 opacity-5" /><div><p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Valor Total do Negócio</p><h3 className="text-6xl font-black tracking-tighter">{formatCurrency(calculateTotalValue())}</h3></div><div className="bg-white/10 p-4 rounded-3xl flex justify-between items-center"><div className="flex items-center gap-3"><ShoppingBag size={20} className="text-emerald-400"/><span className="text-xs font-bold uppercase">{newProposalData.activityGroups.length} Atividades Planejadas</span></div></div></div>
                      <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confiança no Fechamento (%)</label>
                               <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3">
                                  <Percent size={14} className="text-emerald-500" />
                                  <input 
                                    type="number" 
                                    min="0" max="100" 
                                    value={newProposalData.closingProbability} 
                                    onChange={e => setNewProposalData({...newProposalData, closingProbability: Number(e.target.value)})} 
                                    className="w-full bg-transparent text-sm font-bold outline-none" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Condição de Pagamento</label>
                               <input type="text" value={newProposalData.paymentMethod} onChange={e => setNewProposalData({...newProposalData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none font-bold" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Validade da Proposta</label><input type="date" value={newProposalData.validityDate} onChange={e => setNewProposalData({...newProposalData, validityDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Previsão Fechamento</label><input type="date" value={newProposalData.closingDate} onChange={e => setNewProposalData({...newProposalData, closingDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" /></div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right">
                    <div className="bg-emerald-50 p-10 rounded-[48px] border border-emerald-100 shadow-inner relative overflow-hidden">
                       <Sparkles size={160} className="absolute -right-16 -bottom-16 text-emerald-100" />
                       <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
                          <div><h4 className="text-xl font-black text-gray-900 tracking-tighter mb-2 flex items-center gap-3"><Sparkles size={24} className="text-emerald-500" /> Redação Estratégica IA</h4><p className="text-sm text-gray-500 max-w-lg font-medium">A IA do Agrolink redige uma mensagem comercial personalizada baseada no histórico de talhões e nos produtos selecionados para este cliente.</p></div>
                          <button onClick={handleAIProposalGeneration} disabled={isGeneratingAI} className="bg-gray-900 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all disabled:opacity-30">{isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} {isGeneratingAI ? 'Escrevendo...' : 'Gerar Mensagem'}</button>
                       </div>
                       {newProposalData.aiGeneratedContent && (
                         <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                            <textarea value={newProposalData.aiGeneratedContent} onChange={e => setNewProposalData({...newProposalData, aiGeneratedContent: e.target.value})} className="w-full bg-white border border-emerald-100 rounded-[32px] p-8 text-sm font-medium text-gray-700 outline-none resize-none min-h-[300px] shadow-sm leading-relaxed" />
                            <div className="flex gap-4"><button onClick={() => { navigator.clipboard.writeText(newProposalData.aiGeneratedContent); alert("Mensagem copiada!"); }} className="flex-1 bg-white border border-emerald-200 text-emerald-600 py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2"><Copy size={16}/> Copiar Texto</button><button onClick={() => { 
                               const contact = availableContacts.find(c => c.id === newProposalData.contactId);
                               const phoneContact = contact || selectedProducer?.contacts;
                               const phone = (phoneContact?.phone || "").replace(/\D/g, ""); 
                               window.open(`https://wa.me/${phone}?text=${encodeURIComponent(newProposalData.aiGeneratedContent)}`, '_blank'); 
                            }} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"><Send size={16}/> Enviar WhatsApp</button></div>
                         </div>
                       )}
                    </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-gray-100 flex justify-between gap-4">
              <button onClick={() => setShowAddProposal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[28px] font-black text-xs uppercase">Cancelar</button>
              <button onClick={handleAddProposal} className="flex-[2] py-4 bg-gray-900 text-white rounded-[28px] font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Save size={18} /> {editingProposalId ? 'Atualizar Negócio' : 'Criar Proposta no Pipeline'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
