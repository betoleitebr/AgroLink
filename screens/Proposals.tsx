
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
  Palette, BarChart3, TrendingDown, Gauge, User, ChevronUp, ChevronDown,
  Clock3, StickyNote, Smartphone
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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("Erro ao carregar dados do funil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    safra: '25/26',
    closingDate: '',
    validityDate: '',
    paymentMethod: 'Safra + 30 dias',
    technicalLead: 'Bruno Marcon',
    commercialLead: 'Bruno Marcon',
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
      const matchActivity = p.activityGroups.some(ag => ag.activity === filterActivity) || filterActivity === 'all';
      
      let matchConfidence = true;
      if (filterConfidence === 'high') matchConfidence = p.closingProbability >= 80;
      else if (filterConfidence === 'mid') matchConfidence = p.closingProbability >= 40 && p.closingProbability < 80;
      else if (filterConfidence === 'low') matchConfidence = p.closingProbability < 40;

      return matchSearch && matchSafra && (filterActivity === 'all' ? true : matchActivity) && matchConfidence;
    });
  }, [proposals, searchTerm, filterSafra, filterActivity, filterConfidence]);

  const pipelineMetrics = useMemo(() => {
    const total = proposals.reduce((acc, p) => acc + Number(p.totalValue || 0), 0);
    const weighted = proposals.reduce((acc, p) => acc + (Number(p.totalValue || 0) * (p.closingProbability / 100)), 0);
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
    const parts = isoString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoString;
  };

  const calculateTotalValue = () => {
    return newProposalData.activityGroups.reduce((total, group) => {
      const groupValue = group.items.reduce((groupTotal, item) => {
        const catalogItem = catalog.find(c => c.id === item.itemId);
        return groupTotal + (catalogItem ? Number(catalogItem.price || 0) * Number(item.quantity || 0) : 0);
      }, 0);
      return total + groupValue;
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
    setNewConversationNote('');
  };

  const handleFollowUpAI = async () => {
    if (!selectedProducer) return;
    setIsGeneratingFollowUp(true);
    const contact = availableContacts.find(c => c.id === newProposalData.contactId);
    const contactName = contact?.name || selectedProducer.contacts.phone || "Produtor";
    const message = await generateFollowUpMessage(
      newProposalData.conversationHistory, 
      contactName, 
      selectedProducer.farmName
    );
    setIsGeneratingFollowUp(false);
    
    // Abrir WhatsApp com a mensagem
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
    const contactName = contact?.name || selectedProducer.contacts.phone || "Produtor";
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
    if (columns.length <= 1) {
      alert('O funil de vendas deve ter pelo menos uma etapa.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta etapa? Propostas vinculadas serão movidas para a primeira etapa disponível.')) {
      setIsDeleting(true);
      try {
        const result = await dataStore.deleteColumn(colId);
        if (result && result.proposalColumns) {
          setColumns([...result.proposalColumns]);
        }
        if (result && result.proposals) {
          setProposals([...result.proposals]);
        }
      } catch (err: any) {
        console.error('Erro detalhado ao deletar etapa:', err);
        alert(`Ocorreu um erro ao tentar excluir a etapa: ${err.message || 'Verifique sua conexão com o banco de dados.'}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleMoveColumn = async (colId: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(c => c.id === colId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === columns.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newColumns = [...columns];
    
    const currentItem = { ...newColumns[currentIndex] };
    const targetItem = { ...newColumns[targetIndex] };
    
    const tempOrder = currentItem.order;
    currentItem.order = targetItem.order;
    targetItem.order = tempOrder;

    newColumns[currentIndex] = targetItem;
    newColumns[targetIndex] = currentItem;

    const sortedColumns = newColumns.sort((a, b) => a.order - b.order);
    setColumns([...sortedColumns]);

    try {
      await Promise.all([
        dataStore.updateColumn(currentItem),
        dataStore.updateColumn(targetItem)
      ]);
    } catch (err) {
      console.error('Erro ao salvar nova ordem das colunas:', err);
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
      safra: '25/26',
      closingDate: '',
      validityDate: '',
      paymentMethod: 'Safra + 30 dias',
      technicalLead: 'Bruno Marcon',
      commercialLead: 'Bruno Marcon',
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
    if (currentGroupPropertyIds.length === 0) return alert('Selecione ao menos um talhão.');
    const newGroup: ActivityGroup = { activity: currentGroupActivity, propertyIds: [...currentGroupPropertyIds], items: [] };
    setNewProposalData(prev => ({ ...prev, activityGroups: [...prev.activityGroups, newGroup] }));
    setCurrentGroupPropertyIds([]);
    setActiveGroupIndex(newProposalData.activityGroups.length);
    setAddSuccessFeedback(true);
    setTimeout(() => setAddSuccessFeedback(false), 2000);
  };

  // Added helper function to remove an activity group from the proposal scope
  const removeActivityGroup = (index: number) => {
    setNewProposalData(prev => ({
      ...prev,
      activityGroups: prev.activityGroups.filter((_, i) => i !== index)
    }));
    // Adjust activeGroupIndex if necessary to stay within bounds
    if (activeGroupIndex >= index && activeGroupIndex > 0) {
      setActiveGroupIndex(activeGroupIndex - 1);
    }
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

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Pipeline Summary Cards */}
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
            const columnTotalValue = columnProposals.reduce((acc, p) => acc + Number(p.totalValue || 0), 0);
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
                        
                        <div className="space-y-1.5 mt-3">
                          {proposal.expectedClosingDate && (
                            <div className="flex items-center justify-between text-[10px]">
                               <span className="text-gray-400 font-bold uppercase tracking-tighter">Previsão Fechamento</span>
                               <span className="font-bold text-sky-600 flex items-center gap-1"><Calendar size={10}/> {safeFormatDate(proposal.expectedClosingDate)}</span>
                            </div>
                          )}
                          {proposal.nextContactDate && (
                            <div className={`flex items-center justify-between text-[10px] p-1.5 rounded-lg border ${isToday(proposal.nextContactDate) ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                               <span className={`font-black uppercase tracking-tighter ${isToday(proposal.nextContactDate) ? 'text-amber-700' : 'text-gray-400'}`}>Ação de Follow-up</span>
                               <span className={`font-black flex items-center gap-1.5 ${isToday(proposal.nextContactDate) ? 'text-amber-600 animate-pulse' : 'text-amber-600'}`}>
                                 <BellRing size={12} className={isToday(proposal.nextContactDate) ? 'fill-amber-500' : ''}/> {safeFormatDate(proposal.nextContactDate)}
                               </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                          <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded shadow-inner border border-emerald-100">{proposal.closingProbability}% Confiança</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-900">
                        {formatCurrency(Number(proposal.totalValue || 0))}
                      </div>
                    </div>
                  ))}
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
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Datas Críticas</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Confiança</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Valor</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredProposals.map(p => (
                  <tr key={p.id} onClick={() => handleOpenEditProposal(p)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{p.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Safra {p.safra} • {p.code}</p>
                    </td>
                    <td className="px-6 py-5"><div className="flex items-center gap-2 text-xs font-medium text-gray-600"><Building2 size={14} className="text-gray-300" />{p.farmName}</div></td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {p.expectedClosingDate && <p className="text-[9px] font-bold text-sky-600 uppercase tracking-tighter flex items-center gap-1"><Calendar size={10} /> Fechamento: {safeFormatDate(p.expectedClosingDate)}</p>}
                        {p.nextContactDate && <p className={`text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${isToday(p.nextContactDate) ? 'text-amber-600 bg-amber-50 px-1 rounded' : 'text-amber-600'}`}><BellRing size={10} /> Follow-up: {safeFormatDate(p.nextContactDate)}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-5 flex justify-center"><ProbabilityBadge probability={p.closingProbability} /></td>
                    <td className="px-6 py-5 font-black text-gray-900 text-right">{formatCurrency(Number(p.totalValue || 0))}</td>
                  </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {/* Main Modal */}
      {showAddProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Briefcase size={20}/></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingProposalId ? 'Gestão do Negócio' : 'Nova Oportunidade'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{newProposalData.title || 'Nova Negociação'}</p>
                </div>
              </div>
              <button onClick={() => setShowAddProposal(false)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-gray-50 px-6 bg-white overflow-x-auto scrollbar-hide">
               {[
                 { step: 1, label: 'CRM & Negociação', icon: MessageSquare },
                 { step: 2, label: 'Escopo & Itens', icon: ShoppingBag },
                 { step: 3, label: 'Financeiro', icon: DollarSign },
                 { step: 4, label: 'IA & Envio', icon: Target },
               ].map(s => (
                 <button 
                  key={s.step} 
                  onClick={() => setFormStep(s.step)} 
                  className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${formStep === s.step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                 >
                   <s.icon size={14}/> {s.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {formStep === 1 && (
                <div className="animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={14} className="text-emerald-500"/> Identificação</h4>
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Título do Negócio</label>
                          <input type="text" value={newProposalData.title} onChange={e => setNewProposalData({...newProposalData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Safra milho 25/26"/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cliente / Grupo</label>
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
                                <option value="">Selecione...</option>
                                <option value="owner">{selectedProducer.contacts.phone} (Proprietário)</option>
                                {availableContacts.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapIcon size={14} className="text-emerald-500"/> Talhões Vinculados</h4>
                      {selectedProducer ? (
                        <div className="space-y-4">
                          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] space-y-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-emerald-700 uppercase">Cultura / Atividade</label>
                               <div className="flex gap-2">
                                  <select value={currentGroupActivity} onChange={e => setCurrentGroupActivity(e.target.value)} className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                                    {availableCrops.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-emerald-700 uppercase">Selecione os Talhões</label>
                               <div className="flex flex-wrap gap-2">
                                  {selectedProducer.properties.map(p => (
                                    <button 
                                      key={p.id} 
                                      onClick={() => {
                                        const exists = currentGroupPropertyIds.includes(p.id);
                                        if (exists) setCurrentGroupPropertyIds(prev => prev.filter(id => id !== p.id));
                                        else setCurrentGroupPropertyIds(prev => [...prev, p.id]);
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${currentGroupPropertyIds.includes(p.id) ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-400 border border-emerald-200'}`}
                                    >
                                      {p.name}
                                    </button>
                                  ))}
                               </div>
                            </div>
                            <button onClick={handleAddActivityGroup} className="w-full py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all">
                               Adicionar ao Escopo <Plus size={14} />
                            </button>
                          </div>
                          <div className="space-y-2">
                             {newProposalData.activityGroups.map((group, idx) => (
                               <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                  <div><p className="text-xs font-black text-gray-900 uppercase tracking-wider">{group.activity}</p><p className="text-[9px] text-gray-400">{group.propertyIds.length} talhões ativos</p></div>
                                  <button onClick={() => removeActivityGroup(idx)} className="p-2 text-gray-300 hover:text-red-500"><X size={16}/></button>
                               </div>
                             ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 border-2 border-dashed border-gray-100 rounded-[32px] flex items-center justify-center text-gray-400 text-xs italic">Aguardando seleção do cliente...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right">
                    <div className="flex flex-col lg:flex-row gap-8">
                       <div className="w-full lg:w-72 space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Atividades no Orçamento</h4>
                          <div className="flex flex-col gap-2">
                             {newProposalData.activityGroups.map((group, idx) => (
                               <button key={idx} onClick={() => setActiveGroupIndex(idx)} className={`p-4 rounded-2xl border text-left transition-all ${activeGroupIndex === idx ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'}`}><div className="flex justify-between items-center mb-1"><span className="text-sm font-bold">{group.activity}</span></div><p className="text-[9px] truncate opacity-50">{group.propertyIds.length} talhões selecionados</p></button>
                             ))}
                          </div>
                       </div>
                       <div className="flex-1 space-y-6">
                          <h4 className="text-lg font-bold text-gray-900">Catálogo: {newProposalData.activityGroups[activeGroupIndex]?.activity}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {catalog.map(item => {
                                const group = newProposalData.activityGroups[activeGroupIndex];
                                const selected = group?.items.find(i => i.itemId === item.id);
                                return (
                                  <div key={item.id} className={`bg-white p-5 rounded-[28px] border transition-all ${selected ? 'border-emerald-500 shadow-lg' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-3">
                                        <button onClick={() => {
                                          const newItems = selected ? group.items.filter(i => i.itemId !== item.id) : [...group.items, { itemId: item.id, quantity: 1, priceAtTime: Number(item.price || 0) }];
                                          handleUpdateItemsForActiveGroup(newItems);
                                        }} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-gray-200'}`}>
                                          {selected && <Check size={16}/>}
                                        </button>
                                        <div><p className="text-sm font-black text-gray-900 tracking-tight">{item.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{item.category}</p></div>
                                      </div>
                                      <p className="text-xs font-black text-emerald-600">{formatCurrency(item.price)}</p>
                                    </div>
                                    {selected && (
                                       <div className="mt-4 flex items-center gap-3 bg-gray-50 p-2 rounded-xl animate-in slide-in-from-top-2">
                                         <input type="number" min="1" value={selected.quantity} onChange={e => {
                                           const val = Number(e.target.value);
                                           const newItems = group.items.map(i => i.itemId === item.id ? {...i, quantity: val >= 0 ? val : 0} : i);
                                           handleUpdateItemsForActiveGroup(newItems);
                                         }} className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-black outline-none text-center" />
                                         <span className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}</span>
                                       </div>
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
                      <div className="bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden">
                        <DollarSign size={220} className="absolute -right-24 -bottom-24 opacity-5" />
                        <div><p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Total Investimento</p><h3 className="text-6xl font-black tracking-tighter">{formatCurrency(calculateTotalValue())}</h3></div>
                        <div className="flex gap-4">
                           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10"><p className="text-[8px] font-bold text-gray-500 uppercase">Margem Prevista</p><p className="text-xs font-black text-emerald-400">100%</p></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Settings2 size={14} className="text-emerald-500"/> Regras de Negócio</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Probabilidade (%)</label><input type="number" min="0" max="100" value={newProposalData.closingProbability} onChange={e => setNewProposalData({...newProposalData, closingProbability: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Safra de Referência</label><input type="text" value={newProposalData.safra} onChange={e => setNewProposalData({...newProposalData, safra: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Previsão Fechamento</label><input type="date" value={newProposalData.closingDate} onChange={e => setNewProposalData({...newProposalData, closingDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Validade Proposta</label><input type="date" value={newProposalData.validityDate} onChange={e => setNewProposalData({...newProposalData, validityDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold" /></div>
                         </div>
                         <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Condição de Pagamento</label><input type="text" value={newProposalData.paymentMethod} onChange={e => setNewProposalData({...newProposalData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                      </div>
                   </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-10 animate-in slide-in-from-right">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Área da Proposta IA */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={14} className="text-emerald-500"/> Texto Comercial (IA)</h4>
                          <div className="flex gap-2">
                             <button 
                              onClick={handleAIProposalGeneration} 
                              disabled={isGeneratingAI}
                              className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                             >
                               {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles size={12}/>}
                               {newProposalData.aiGeneratedContent ? 'Refinar com IA' : 'Gerar Proposta'}
                             </button>
                             {newProposalData.aiGeneratedContent && (
                               <button onClick={() => { navigator.clipboard.writeText(newProposalData.aiGeneratedContent); alert('Copiado!'); }} className="text-[9px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5 hover:bg-gray-100 transition-all"><Copy size={12}/> Copiar</button>
                             )}
                          </div>
                        </div>
                        <div className="relative">
                          <textarea 
                            value={newProposalData.aiGeneratedContent} 
                            onChange={e => setNewProposalData({...newProposalData, aiGeneratedContent: e.target.value})}
                            placeholder="Gere o texto da proposta comercial clicando no botão acima ou escreva manualmente aqui..."
                            className="w-full min-h-[400px] bg-gray-50 border border-gray-100 rounded-[32px] p-6 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none custom-scrollbar"
                          />
                          {!newProposalData.aiGeneratedContent && !isGeneratingAI && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 gap-3">
                              <Target size={48} className="text-gray-300" />
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">IA aguardando dados<br/>para composição estratégica</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gestão de Follow-up e Histórico */}
                      <div className="space-y-8 flex flex-col">
                        <section className="bg-gray-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden shrink-0">
                           <BellRing size={120} className="absolute -right-10 -bottom-10 opacity-5" />
                           <div className="relative z-10 space-y-6">
                              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Agendamento de Follow-up</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Próximo Contato</label>
                                  <div className="relative">
                                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                                    <input 
                                      type="date" 
                                      value={nextContactDate} 
                                      onChange={e => setNextContactDate(e.target.value)}
                                      className="w-full bg-white/10 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                  <button 
                                    onClick={handleFollowUpAI}
                                    disabled={isGeneratingFollowUp || !selectedProducer}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    {isGeneratingFollowUp ? <Loader2 size={14} className="animate-spin"/> : <Smartphone size={14} />}
                                    Follow-up WhatsApp (IA)
                                  </button>
                                </div>
                              </div>
                           </div>
                        </section>

                        <section className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm flex-1 flex flex-col min-h-[400px]">
                           <div className="flex justify-between items-center mb-6">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><HistoryIcon size={14} className="text-sky-500"/> Evolução do Processo</h4>
                             <span className="text-[9px] font-black text-gray-300 uppercase">{newProposalData.conversationHistory.length} Registros</span>
                           </div>

                           {/* Timeline de Histórico */}
                           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6 space-y-6">
                              {newProposalData.conversationHistory.length > 0 ? newProposalData.conversationHistory.map((note) => (
                                <div key={note.id} className="relative pl-6 border-l-2 border-gray-50 pb-1 last:pb-0">
                                   <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full" />
                                   <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50 hover:bg-white hover:border-emerald-100 transition-all">
                                      <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <Clock3 size={10} /> {note.timestamp}
                                      </div>
                                      <p className="text-xs font-medium text-gray-600 leading-relaxed">{note.content}</p>
                                   </div>
                                </div>
                              )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-3">
                                   <MessageSquare size={48} className="text-gray-300" />
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sem conversas<br/>registradas ainda</p>
                                </div>
                              )}
                           </div>

                           {/* Input de Nova Nota */}
                           <div className="space-y-3 pt-4 border-t border-gray-50">
                              <div className="relative">
                                 <textarea 
                                  value={newConversationNote}
                                  onChange={e => setNewConversationNote(e.target.value)}
                                  onKeyDown={e => { if(e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleAddConversationNote(); } }}
                                  placeholder="Registrar o que foi falado hoje..."
                                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium text-gray-700 min-h-[80px] focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                 />
                                 <button 
                                  onClick={handleAddConversationNote}
                                  disabled={!newConversationNote.trim()}
                                  className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                                 >
                                   <Plus size={16} />
                                 </button>
                              </div>
                              <p className="text-[8px] text-gray-400 font-bold text-right uppercase tracking-widest">Ctrl+Enter para salvar nota</p>
                           </div>
                        </section>
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center gap-4">
              <div className="flex gap-2">
                 <button onClick={() => setFormStep(prev => Math.max(1, prev - 1))} className={`px-6 py-4 bg-gray-50 text-gray-400 rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-colors ${formStep === 1 ? 'opacity-30 pointer-events-none' : ''}`}><ChevronLeft size={16}/> Anterior</button>
                 <button onClick={() => setFormStep(prev => Math.min(4, prev + 1))} className={`px-6 py-4 bg-emerald-50 text-emerald-600 rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 ${formStep === 4 ? 'opacity-30 pointer-events-none' : ''}`}>Próximo <ChevronRight size={16}/></button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowAddProposal(false)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-[28px] font-black text-xs uppercase tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
                <button 
                  onClick={handleAddProposal} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 active:rotate-1"
                >
                  <Save size={20} />
                  {editingProposalId ? 'Salvar Negócio' : 'Criar Negócio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
