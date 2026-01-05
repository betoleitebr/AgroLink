
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
  Palette
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { generateSalesProposal, generateFollowUpMessage } from '../services/geminiService';
import { Proposal, ProposalColumn, CatalogItem, Producer, ActivityGroup, ProposalItem, ConversationNote } from '../types';

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [columns, setColumns] = useState<ProposalColumn[]>([]);

  // Carregar dados iniciais e escutar mudanças
  useEffect(() => {
    setProposals(dataStore.getProposals());
    setColumns(dataStore.getProposalColumns());
  }, []);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSafra, setFilterSafra] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  
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

  // Estados para Drag and Drop
  const [draggedProposalId, setDraggedProposalId] = useState<string | null>(null);
  const [isOverColumnId, setIsOverColumnId] = useState<string | null>(null);

  // Estados para IA
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  // Estado para CRM (Conversas)
  const [newConversationNote, setNewConversationNote] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');

  const [newProposalData, setNewProposalData] = useState({
    title: '',
    producerId: '',
    contactId: '',
    activityGroups: [] as ActivityGroup[],
    safra: '25/26',
    priority: 'media' as 'baixa' | 'media' | 'alta',
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

  const producers = dataStore.getProducers();
  const catalog = dataStore.getCatalog();

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSafra = filterSafra === 'all' || p.safra === filterSafra;
      const matchActivity = filterActivity === 'all' || p.activityGroups.some(ag => ag.activity === filterActivity);
      return matchSearch && matchSafra && matchActivity;
    });
  }, [proposals, searchTerm, filterSafra, filterActivity]);

  const selectedProducer = producers.find(p => p.id === newProposalData.producerId);
  const availableContacts = selectedProducer?.contacts?.list || [];
  
  // Atualiza a atividade padrão quando o produtor muda
  useEffect(() => {
    if (selectedProducer && selectedProducer.structure.activities.length > 0) {
      if (!currentGroupActivity || !selectedProducer.structure.activities.includes(currentGroupActivity)) {
        setCurrentGroupActivity(selectedProducer.structure.activities[0]);
      }
    } else {
      setCurrentGroupActivity('');
    }
  }, [newProposalData.producerId, selectedProducer]);

  // Função utilitária para formatar data ISO (YYYY-MM-DD) sem erro de fuso horário
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

  // HANDLERS DRAG AND DROP
  const handleDragStart = (e: React.DragEvent, proposalId: string) => {
    setDraggedProposalId(proposalId);
    e.dataTransfer.setData('proposalId', proposalId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setIsOverColumnId(columnId);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const proposalId = e.dataTransfer.getData('proposalId') || draggedProposalId;
    
    if (proposalId) {
      const updatedList = dataStore.updateProposalStatus(proposalId, targetColumnId);
      setProposals([...updatedList]);
    }
    
    setDraggedProposalId(null);
    setIsOverColumnId(null);
  };

  const handleAddConversationNote = () => {
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

    // PERSISTÊNCIA IMEDIATA PARA CRM
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
        const updatedList = dataStore.updateProposal(updatedProposal);
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
    
    // Abrir WhatsApp com a mensagem gerada
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
    
    // Fix: cast the result of flatMap and Array.from to string[] to resolve 'unknown[]' assignment error.
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

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newCol: ProposalColumn = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      order: columns.length + 1,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    };
    const updatedColumns = dataStore.addColumn(newCol);
    setColumns([...updatedColumns]);
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  const handleUpdateColumn = (col: ProposalColumn) => {
    const updatedColumns = dataStore.updateColumn(col);
    setColumns([...updatedColumns]);
  };

  const handleDeleteColumn = (colId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta etapa? Os negócios nela serão movidos para a primeira etapa disponível.')) {
      const result = dataStore.deleteColumn(colId);
      setColumns([...result.proposalColumns]);
      setProposals([...result.proposals]);
    }
  };

  const handleOpenNewProposal = (colId?: string) => {
    setEditingProposalId(null);
    setSelectedColumnForNew(colId || columns[0]?.id || 'col-1');
    setCurrentGroupPropertyIds([]);
    setActiveGroupIndex(0);
    setNewProposalData({
      title: '',
      producerId: '',
      contactId: '',
      activityGroups: [],
      safra: '25/26',
      priority: 'media',
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
    setCurrentGroupPropertyIds([]);
    setActiveGroupIndex(0);
    setNewProposalData({
      title: proposal.title,
      producerId: proposal.producerId,
      contactId: proposal.contactId || '',
      activityGroups: proposal.activityGroups || [],
      safra: proposal.safra,
      priority: proposal.priority,
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
    if (currentGroupPropertyIds.length === 0) return alert('Selecione ao menos um talhão para esta atividade.');
    if (!currentGroupActivity) return alert('Selecione ou cadastre uma atividade para este cliente.');
    const newGroup: ActivityGroup = { activity: currentGroupActivity, propertyIds: [...currentGroupPropertyIds], items: [] };
    setNewProposalData(prev => ({ ...prev, activityGroups: [...prev.activityGroups, newGroup] }));
    setCurrentGroupPropertyIds([]);
    setActiveGroupIndex(newProposalData.activityGroups.length);
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

  const handleAddProposal = () => {
    if (!newProposalData.title || !newProposalData.producerId || !selectedColumnForNew) {
      alert('Preencha o título e selecione um cliente.');
      return;
    }
    if (newProposalData.activityGroups.length === 0) {
      alert('Adicione ao menos uma atividade à proposta.');
      return;
    }
    const producer = producers.find(p => p.id === newProposalData.producerId);
    const baseProposalData = {
      title: newProposalData.title,
      producerId: newProposalData.producerId,
      contactId: newProposalData.contactId,
      farmName: producer?.farmName || 'Fazenda Desconhecida',
      activityGroups: newProposalData.activityGroups,
      priority: newProposalData.priority,
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
      updatedList = existing ? dataStore.updateProposal({ ...existing, ...baseProposalData }) : proposals;
    } else {
      updatedList = dataStore.addProposal({
        id: `prop-${Date.now()}`,
        code: `PROP-${new Date().getFullYear()}-${proposals.length + 1}`,
        columnId: selectedColumnForNew,
        createdAt: new Date().toISOString().split('T')[0],
        lastMovementDate: new Date().toISOString().split('T')[0],
        ...baseProposalData
      } as Proposal);
    }
    setProposals([...updatedList]);
    setShowAddProposal(false);
    setFormStep(1);
  };

  /**
   * Probability Badge component that determines label and color based on closingProbability (0-100)
   */
  const ProbabilityBadge = ({ probability }: { probability: number }) => {
    let label = 'Média';
    let style = 'bg-amber-100 text-amber-700';
    
    if (probability <= 20) {
      label = 'Muito Baixa';
      style = 'bg-red-100 text-red-700';
    } else if (probability <= 40) {
      label = 'Baixa';
      style = 'bg-orange-100 text-orange-700';
    } else if (probability <= 60) {
      label = 'Média';
      style = 'bg-amber-100 text-amber-700';
    } else if (probability <= 80) {
      label = 'Alta';
      style = 'bg-emerald-100 text-emerald-700';
    } else {
      label = 'Garantida';
      style = 'bg-emerald-600 text-white';
    }
    
    return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap ${style}`}>{label}</span>;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Comercial</h1>
          <p className="text-sm text-gray-500">Gestão de propostas e timing agrícola</p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Seletor de Visualização */}
           <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center">
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualizar como Kanban"
              >
                <LayoutGrid size={18} />
                <span className={`text-[10px] font-bold uppercase px-1 ${viewMode === 'kanban' ? 'block' : 'hidden'}`}>Kanban</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualizar como Lista"
              >
                <List size={18} />
                <span className={`text-[10px] font-bold uppercase px-1 ${viewMode === 'list' ? 'block' : 'hidden'}`}>Lista</span>
              </button>
           </div>

           <button onClick={() => handleOpenNewProposal()} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
             <Plus size={20} /> Nova Proposta
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Proposta, cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 shadow-sm outline-none" />
        </div>
        <select value={filterSafra} onChange={(e) => setFilterSafra(e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none">
          <option value="all">Todas Safras</option><option value="24/25">24/25</option><option value="25/26">25/26</option>
        </select>
        <select value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none">
          <option value="all">Todas Atividades</option><option value="Soja">Soja</option><option value="Milho">Milho</option><option value="Gado">Gado</option><option value="Café">Café</option><option value="Algodão">Algodão</option>
        </select>
        <div className="flex gap-2">
          <button onClick={() => setShowAddColumn(true)} className="flex-1 bg-white border border-gray-100 rounded-2xl text-xs font-bold px-4 py-3 flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
            <PlusCircle size={18} className="text-emerald-500" /> Etapa
          </button>
          <button onClick={() => setShowManageColumns(true)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 shadow-sm hover:text-gray-900 transition-colors"><Settings size={20}/></button>
        </div>
      </div>

      {/* Kanban / List View */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 min-h-[600px] scrollbar-hide">
          {columns.map((column) => {
            const columnProposals = filteredProposals.filter(p => p.columnId === column.id);
            const isTarget = isOverColumnId === column.id;
            
            return (
              <div 
                key={column.id} 
                className="w-80 flex-shrink-0 flex flex-col gap-4"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={() => setIsOverColumnId(null)}
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{column.title}</h3>
                    <span className="bg-white border border-gray-100 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{columnProposals.length}</span>
                  </div>
                </div>
                <div className={`flex flex-col gap-4 p-3 rounded-[32px] flex-1 transition-colors duration-300 ${isTarget ? 'bg-emerald-50 ring-2 ring-emerald-200 ring-inset' : 'bg-gray-100/40'}`}>
                  {columnProposals.map((proposal) => (
                    <div 
                      key={proposal.id} 
                      onClick={() => handleOpenEditProposal(proposal)} 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, proposal.id)}
                      onDragEnd={() => setDraggedProposalId(null)}
                      className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-95 active:rotate-2 group ${draggedProposalId === proposal.id ? 'opacity-40 grayscale' : 'opacity-100'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-[8px] font-bold text-gray-400 uppercase">{proposal.code}</span>
                             <ProbabilityBadge probability={proposal.closingProbability} />
                           </div>
                           <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">{proposal.title}</h4>
                        </div>
                        <div className="text-gray-300 group-hover:text-gray-400">
                          <Move size={14} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold"><Building2 size={12}/> {proposal.farmName}</div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                          <span className="font-medium bg-gray-50 px-1.5 py-0.5 rounded">Prob: {proposal.closingProbability}%</span>
                          {proposal.nextContactDate && (
                            <span className="font-bold text-sky-600 flex items-center gap-1"><BellRing size={10}/> {safeFormatDate(proposal.nextContactDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-900">
                        R$ {proposal.totalValue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                  
                  {columnProposals.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300">
                      <PlusCircle size={24} className="opacity-20" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-300">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Negócio / Safra</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Propriedade</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Próximo Contato</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Etapa</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Valor</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredProposals.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <ShoppingBag size={48} />
                         <p className="font-bold text-sm">Nenhuma proposta encontrada</p>
                      </div>
                   </td>
                 </tr>
               ) : (
                 filteredProposals.map(p => {
                   const col = columns.find(c => c.id === p.columnId);
                   return (
                    <tr key={p.id} onClick={() => handleOpenEditProposal(p)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 mb-1">
                           <ProbabilityBadge probability={p.closingProbability} />
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{p.code}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{p.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Safra {p.safra}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                           <Building2 size={14} className="text-gray-300" />
                           {p.farmName}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.nextContactDate ? 'text-sky-600 bg-sky-50' : 'text-gray-300 bg-gray-50'}`}>
                          {p.nextContactDate ? safeFormatDate(p.nextContactDate) : 'Não agendado'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: (col?.color || '#000') + '15', color: col?.color }}>
                            {col?.title}
                         </span>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-900 text-right">R$ {p.totalValue.toLocaleString('pt-BR')}</td>
                    </tr>
                   )
                 })
               )}
             </tbody>
           </table>
        </div>
      )}

      {/* Modal Adicionar Coluna (Etapa) */}
      {showAddColumn && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Nova Etapa do Funil</h3>
                <button onClick={() => setShowAddColumn(false)} className="p-2 hover:bg-100 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome da Etapa</label>
                   <input 
                    type="text" 
                    value={newColumnTitle} 
                    onChange={e => setNewColumnTitle(e.target.value)} 
                    placeholder="Ex: Pós-Venda" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                    autoFocus
                  />
                </div>
             </div>
             <div className="p-6 bg-gray-50 flex gap-3">
                <button onClick={() => setShowAddColumn(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs uppercase">Cancelar</button>
                <button onClick={handleAddColumn} disabled={!newColumnTitle.trim()} className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase shadow-lg disabled:opacity-30">Salvar Etapa</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Colunas (Etapas) */}
      {showManageColumns && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-gray-900 text-white rounded-xl"><Settings size={20} /></div>
                   <h3 className="text-lg font-bold text-gray-900">Configurar Funil de Vendas</h3>
                </div>
                <button onClick={() => setShowManageColumns(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {columns.map((col) => (
                   <div key={col.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex items-center gap-4 animate-in fade-in duration-300">
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={col.color} 
                          onChange={e => handleUpdateColumn({...col, color: e.target.value})} 
                          className="w-10 h-10 rounded-xl border-none p-0 cursor-pointer bg-transparent"
                        />
                        <Palette size={14} className="absolute inset-0 m-auto text-white pointer-events-none drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-1">
                         <input 
                           type="text" 
                           value={col.title} 
                           onChange={e => handleUpdateColumn({...col, title: e.target.value})} 
                           className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none w-full"
                         />
                      </div>
                      <button 
                        onClick={() => handleDeleteColumn(col.id)} 
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remover Etapa"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                ))}
                
                <button 
                  onClick={() => { setShowManageColumns(false); setShowAddColumn(true); }}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:border-emerald-200 hover:text-emerald-600 transition-all"
                >
                  <PlusCircle size={20} /> Adicionar Nova Etapa
                </button>
             </div>
             <div className="p-6 bg-white border-t border-gray-50">
                <button onClick={() => setShowManageColumns(false)} className="w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-sm uppercase shadow-xl active:scale-95 transition-transform">Concluir Ajustes</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Proposta */}
      {showAddProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Briefcase size={20} /></div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingProposalId ? 'Gestão do Negócio' : 'Novo Negócio Estratégico'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{newProposalData.title || 'Pipeline Agrolink'}</p>
                </div>
              </div>
              <button onClick={() => setShowAddProposal(false)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-gray-50 px-6 bg-white overflow-x-auto scrollbar-hide">
               {[
                 { step: 1, label: editingProposalId ? 'CRM & Negociação' : '1. Cliente & Atividades', icon: MessageSquare },
                 { step: 2, label: editingProposalId ? 'Escopo & Itens' : '2. Catálogo & Itens', icon: ShoppingBag },
                 { step: 3, label: editingProposalId ? 'Financeiro' : '3. Financeiro & Comercial', icon: DollarSign },
                 { step: 4, label: editingProposalId ? 'IA & Envio' : '4. IA & Finalização', icon: Target },
               ].map(s => (
                 <button key={s.step} onClick={() => setFormStep(s.step)} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${formStep === s.step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>
                   <s.icon size={14} /> {s.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {formStep === 1 && (
                <div className="animate-in slide-in-from-right duration-300">
                  {editingProposalId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} className="text-emerald-500"/> Registro de Conversa</h4>
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={handleFollowUpAI} 
                                disabled={isGeneratingFollowUp || newProposalData.conversationHistory.length === 0}
                                className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase flex items-center gap-2 hover:bg-sky-200 transition-colors disabled:opacity-30"
                             >
                               {isGeneratingFollowUp ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                               Cobrar Retorno (IA)
                             </button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-6 rounded-[32px] border border-emerald-100 shadow-sm transition-all">
                            <textarea 
                              value={newConversationNote} 
                              onChange={e => setNewConversationNote(e.target.value)}
                              placeholder="O que foi conversado hoje? (Dúvidas, acordos...)"
                              className="w-full bg-transparent border-none text-sm font-medium text-gray-700 outline-none resize-none min-h-[100px]"
                            />
                            <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-emerald-50 gap-3">
                               <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-inner">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">Próximo Contato</label>
                                  <input 
                                    type="date" 
                                    value={nextContactDate} 
                                    onChange={e => setNextContactDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold text-gray-700 outline-none cursor-pointer"
                                  />
                               </div>
                               <button 
                                onClick={handleAddConversationNote}
                                disabled={!newConversationNote.trim()}
                                className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-30"
                              >
                                <Save size={14} /> Salvar Anotação
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Histórico e Contexto</h5>
                            <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                              {newProposalData.conversationHistory.map((note) => (
                                <div key={note.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group animate-in slide-in-from-top-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{note.timestamp}</span>
                                    <button onClick={() => {
                                      const updated = newProposalData.conversationHistory.filter(n => n.id !== note.id);
                                      setNewProposalData({...newProposalData, conversationHistory: updated});
                                      if (editingProposalId) {
                                        const p = proposals.find(pr => pr.id === editingProposalId);
                                        if(p) dataStore.updateProposal({...p, conversationHistory: updated});
                                      }
                                    }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-emerald-900 p-10 rounded-[60px] text-white shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={150} /></div>
                           <div className="relative z-10">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Confiança no Fechamento</h4>
                                <ProbabilityBadge probability={newProposalData.closingProbability} />
                              </div>
                              <div className="flex justify-between items-end mb-4">
                                <span className="text-7xl font-black tracking-tighter">{newProposalData.closingProbability}%</span>
                                <TrendingUp size={32} className="text-emerald-400 mb-2" />
                              </div>
                              <input type="range" min="0" max="100" step="5" value={newProposalData.closingProbability} onChange={e => {
                                  const newVal = Number(e.target.value);
                                  setNewProposalData({...newProposalData, closingProbability: newVal});
                                  if (editingProposalId) {
                                    const p = proposals.find(pr => pr.id === editingProposalId);
                                    if(p) dataStore.updateProposal({...p, closingProbability: newVal});
                                  }
                                }} className="w-full h-2 bg-emerald-800 rounded-xl appearance-none cursor-pointer accent-emerald-400 shadow-inner" />
                              <div className="flex justify-between text-[10px] font-bold text-emerald-500 uppercase mt-4 tracking-widest">
                                 <span>Qualificação</span><span>Garantido</span>
                              </div>
                           </div>
                        </div>

                        {(nextContactDate || newProposalData.nextContactDate) && (
                           <div className="bg-sky-50 p-6 rounded-[32px] border border-sky-100 flex items-center gap-4 shadow-inner animate-in fade-in duration-500">
                              <div className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg animate-bounce">
                                 <BellRing size={20} />
                              </div>
                              <div>
                                 <p className="text-[9px] font-bold text-sky-600 uppercase tracking-widest">Próxima Atividade Agendada</p>
                                 <p className="text-lg font-black text-sky-900">{safeFormatDate(nextContactDate || newProposalData.nextContactDate || '')}</p>
                              </div>
                           </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // VISÃO DE CADASTRO (CLIENTE & ATIVIDADES)
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-emerald-500"/> Identificação do Projeto</h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Título da Proposta</label>
                            <input type="text" value={newProposalData.title} onChange={e => setNewProposalData({...newProposalData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Manejo Integrado Verão" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Produtor Rural (Cliente)</label>
                            <select value={newProposalData.producerId} onChange={e => setNewProposalData({...newProposalData, producerId: e.target.value, contactId: '', activityGroups: []})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                              <option value="">Selecione um cliente...</option>
                              {producers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.farmName})</option>)}
                            </select>
                          </div>
                          {selectedProducer && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                               <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-2"><UserCheck size={12} className="text-emerald-500" /> Contato Destinatário</label>
                               <select value={newProposalData.contactId} onChange={e => setNewProposalData({...newProposalData, contactId: e.target.value})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500">
                                 <option value="">Selecione quem receberá a proposta...</option>
                                 <option value="owner">Proprietário: {selectedProducer.contacts.owner}</option>
                                 {availableContacts.map(c => <option key={c.id} value={c.id}>{c.role}: {c.name}</option>)}
                               </select>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} className="text-sky-500"/> Configuração de Atividades</h4>
                        <div className="space-y-3 min-h-[100px]">
                           {newProposalData.activityGroups.map((group, idx) => (
                             <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between group animate-in shadow-sm">
                               <div><p className="text-sm font-bold text-emerald-900">{group.activity}</p><p className="text-[10px] text-emerald-700/60 truncate max-w-[200px]">{group.propertyIds.map(pid => selectedProducer?.properties.find(p => p.id === pid)?.name).join(', ')}</p></div>
                               <button onClick={() => removeActivityGroup(idx)} className="p-2 text-emerald-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                             </div>
                           ))}
                        </div>
                        {selectedProducer && (
                          <div className="bg-gray-900 p-6 rounded-[32px] space-y-4 shadow-xl">
                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <label className="text-[8px] font-bold text-gray-500 uppercase">Cultura / Atividade</label>
                                 <select 
                                   value={currentGroupActivity} 
                                   onChange={e => setCurrentGroupActivity(e.target.value)} 
                                   className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none"
                                 >
                                   {selectedProducer.structure.activities.length > 0 ? (
                                      selectedProducer.structure.activities.map(act => (
                                        <option key={act} className="text-gray-900" value={act}>{act}</option>
                                      ))
                                   ) : (
                                     <option className="text-gray-900" value="">Sem atividades cadastradas</option>
                                   )}
                                 </select>
                               </div>
                               <div className="flex items-end"><button onClick={handleAddActivityGroup} className="w-full bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] uppercase">Adicionar Grupo</button></div>
                             </div>
                             {selectedProducer.structure.activities.length === 0 && (
                               <p className="text-[10px] text-red-400 font-bold px-2 italic">Acesse "Clientes" para cadastrar atividades (Culturas) para este produtor.</p>
                             )}
                             <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedProducer.properties.map(prop => (
                                  <label key={prop.id} className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${currentGroupPropertyIds.includes(prop.id) ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-gray-500'}`}>
                                    <input type="checkbox" checked={currentGroupPropertyIds.includes(prop.id)} onChange={() => {
                                      const ids = currentGroupPropertyIds.includes(prop.id) ? currentGroupPropertyIds.filter(i => i !== prop.id) : [...currentGroupPropertyIds, prop.id];
                                      setCurrentGroupPropertyIds(ids);
                                    }} className="hidden" />
                                    <span className="text-[11px] font-bold truncate">{prop.name}</span>
                                  </label>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right">
                  {newProposalData.activityGroups.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                      <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold">Defina as atividades no Passo 1.</p>
                      <button onClick={() => setFormStep(1)} className="mt-4 text-emerald-600 text-sm font-bold underline">Voltar para Atividades</button>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                       <div className="w-full lg:w-72 space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Focar Atividade</h4>
                          <div className="flex flex-col gap-2">
                             {newProposalData.activityGroups.map((group, idx) => (
                               <button key={idx} onClick={() => setActiveGroupIndex(idx)} className={`p-4 rounded-2xl border text-left transition-all relative ${activeGroupIndex === idx ? 'bg-gray-900 border-gray-900 text-white shadow-xl translate-x-2' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold">{group.activity}</span>
                                    {group.items.length > 0 && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">{group.items.length}</span>}
                                 </div>
                                 <p className="text-[9px] truncate opacity-50">{group.propertyIds.length} talhões selecionados</p>
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="flex-1 space-y-6">
                          <div className="flex items-center justify-between">
                             <h4 className="text-lg font-bold text-gray-900">Itens para: {newProposalData.activityGroups[activeGroupIndex].activity}</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                             {catalog.map(item => {
                                const group = newProposalData.activityGroups[activeGroupIndex];
                                const selected = group.items.find(i => i.itemId === item.id);
                                return (
                                  <div key={item.id} className={`bg-white p-5 rounded-[28px] border transition-all ${selected ? 'border-emerald-500 shadow-lg' : 'border-gray-100 opacity-80 hover:opacity-100'}`}>
                                    <div className="flex justify-between items-start">
                                       <div className="flex items-center gap-3">
                                          <button onClick={() => {
                                              const newItems = selected ? group.items.filter(i => i.itemId !== item.id) : [...group.items, { itemId: item.id, quantity: 1, priceAtTime: item.price }];
                                              handleUpdateItemsForActiveGroup(newItems);
                                            }} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${selected ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                            {selected ? <Check size={20}/> : <Plus size={20}/>}
                                          </button>
                                          <div><p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">R$ {item.price.toLocaleString('pt-BR')} / {item.unit}</p></div>
                                       </div>
                                    </div>
                                    {selected && (
                                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                         <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-inner">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase">Qtd</label>
                                            <input type="number" value={selected.quantity} onChange={e => {
                                                const val = Math.max(1, Number(e.target.value));
                                                const newItems = group.items.map(i => i.itemId === item.id ? {...i, quantity: val} : i);
                                                handleUpdateItemsForActiveGroup(newItems);
                                              }} className="w-16 bg-transparent font-black text-gray-900 text-xs outline-none" />
                                         </div>
                                         <div className="text-right"><p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Total Item</p><p className="text-sm font-black text-emerald-600">R$ {(selected.quantity * item.price).toLocaleString('pt-BR')}</p></div>
                                      </div>
                                    )}
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[350px]">
                         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><DollarSign size={200} /></div>
                         <div className="relative z-10 space-y-10">
                            <div><p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Investimento Consolidado</p><h2 className="text-7xl font-black tracking-tighter">R$ {calculateTotalValue().toLocaleString('pt-BR')}</h2></div>
                            <div className="pt-10 border-t border-white/10 grid grid-cols-2 gap-10">
                               <div><p className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-widest">Validade Proposta</p><input type="date" value={newProposalData.validityDate} onChange={e => setNewProposalData({...newProposalData, validityDate: e.target.value})} className="bg-transparent border-none p-0 text-2xl font-bold text-white outline-none w-full cursor-pointer hover:text-emerald-400 transition-colors" /></div>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-8 flex flex-col justify-center">
                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Settings2 className="text-sky-500" size={14} /> Condições de Negócio</h4>
                         <div className="space-y-6">
                            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-wider">Forma de Pagamento</label><input type="text" value={newProposalData.paymentMethod} onChange={e => setNewProposalData({...newProposalData, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-6 py-5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm" placeholder="Ex: Safra + 30 dias" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-2 tracking-wider">Previsão de Fechamento</label><div className="relative"><Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="date" value={newProposalData.closingDate} onChange={e => setNewProposalData({...newProposalData, closingDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-[28px] pl-14 pr-6 py-5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer" /></div></div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                  <div className="flex flex-col lg:flex-row gap-8">
                     <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="text-emerald-500" size={14}/> Proposta Gerada por IA</h4>
                           <button onClick={handleAIProposalGeneration} disabled={isGeneratingAI || !newProposalData.contactId} className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-200 transition-colors disabled:opacity-50">
                             {isGeneratingAI ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} {newProposalData.aiGeneratedContent ? 'Regerar Proposta' : 'Gerar via IA'}
                           </button>
                        </div>
                        <div className="bg-emerald-50/50 rounded-[40px] border border-emerald-100 p-8 min-h-[300px] relative">
                           {isGeneratingAI ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-emerald-500" size={48} /><p className="text-sm font-bold text-emerald-600 animate-pulse">A Inteligência Artificial está escrevendo sua proposta...</p></div>
                           ) : newProposalData.aiGeneratedContent ? (
                             <div className="space-y-4">
                                <textarea value={newProposalData.aiGeneratedContent} onChange={e => setNewProposalData({...newProposalData, aiGeneratedContent: e.target.value})} className="w-full bg-transparent border-none text-gray-800 text-sm leading-relaxed min-h-[300px] outline-none resize-none scrollbar-hide" />
                                <div className="flex gap-2 justify-end">
                                   <button onClick={() => { navigator.clipboard.writeText(newProposalData.aiGeneratedContent || ''); alert("Copiado!"); }} className="p-3 bg-white border border-emerald-100 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase"><Copy size={16} /> Copiar</button>
                                   <button onClick={() => {
                                        const contact = availableContacts.find(c => c.id === newProposalData.contactId) || selectedProducer?.contacts;
                                        const phone = (contact?.phone || '').replace(/\D/g, '');
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(newProposalData.aiGeneratedContent || '')}`, '_blank');
                                     }} className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase"><Send size={16} /> WhatsApp</button>
                                </div>
                             </div>
                           ) : (
                             <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20"><Sparkles size={48} className="text-emerald-500 mb-4" /><p className="text-sm font-bold text-gray-400">Clique em "Gerar via IA" para criar um texto personalizado.</p></div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-gray-100 flex items-center justify-between">
              <div className="flex gap-4">
                {formStep > 1 && <button onClick={() => setFormStep(formStep - 1)} className="px-10 py-5 bg-gray-100 text-gray-600 rounded-[32px] font-bold text-sm hover:bg-gray-200 transition-colors">Voltar</button>}
                {formStep < 4 ? (
                   <button onClick={() => setFormStep(formStep + 1)} className="px-10 py-5 bg-gray-900 text-white rounded-[32px] font-bold text-sm shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform active:scale-95">Próximo Passo <ChevronRight size={18}/></button>
                ) : (
                   <button onClick={handleAddProposal} disabled={!newProposalData.producerId || newProposalData.activityGroups.length === 0} className="px-12 py-5 bg-emerald-600 text-white rounded-[32px] font-black text-sm shadow-2xl shadow-emerald-200 flex items-center gap-3 disabled:opacity-30 hover:scale-105 transition-all active:scale-95">
                    <CheckCircle2 size={24} /> {editingProposalId ? 'Atualizar Negócio' : 'Lançar Oportunidade'}
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
