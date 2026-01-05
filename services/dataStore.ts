
import { MOCK_PRODUCERS, MOCK_VISITS } from '../constants';
import { Producer, Property, Visit, Proposal, ProposalColumn, CatalogItem } from '../types';

const STORAGE_KEY = 'agrolink_data_v1';

interface AppState {
  producers: Producer[];
  visits: Visit[];
  catalog: CatalogItem[];
  proposalColumns: ProposalColumn[];
  proposals: Proposal[];
}

const DEFAULT_CATALOG: CatalogItem[] = [
  { 
    id: 'cat-1', 
    name: 'Fertilizante NPK 10-10-10', 
    description: 'Fertilizante mineral de alta solubilidade para base.', 
    price: 120.50, 
    unit: 'saco 50kg', 
    type: 'product', 
    category: 'Nutrição',
    status: 'active',
    brand: 'Yara'
  },
  { 
    id: 'cat-3', 
    name: 'Análise de Solo Completa', 
    description: 'Levantamento de macronutrientes e física do solo.', 
    price: 250.00, 
    unit: 'amostra', 
    type: 'service', 
    category: 'Técnico',
    status: 'active'
  }
];

const DEFAULT_COLUMNS: ProposalColumn[] = [
  { id: 'col-1', title: 'Lead Identificado', order: 1, color: '#94a3b8' },
  { id: 'col-2', title: 'Diagnóstico Técnico', order: 2, color: '#38bdf8' },
  { id: 'col-3', title: 'Proposta Enviada', order: 3, color: '#fbbf24' },
  { id: 'col-4', title: 'Em Negociação', order: 4, color: '#f472b6' },
  { id: 'col-5', title: 'Aprovada', order: 5, color: '#10b981' }
];

const loadInitialData = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage", e);
    }
  }
  return {
    producers: [...MOCK_PRODUCERS],
    visits: [...MOCK_VISITS],
    catalog: DEFAULT_CATALOG,
    proposalColumns: DEFAULT_COLUMNS,
    proposals: []
  };
};

const state = loadInitialData();

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const dataStore = {
  getProducers: () => state.producers,
  getProducerById: (id: string) => state.producers.find(p => p.id === id),
  getVisits: () => state.visits,
  getCatalog: () => state.catalog,
  getProposals: () => [...state.proposals], 
  getProposalColumns: () => [...state.proposalColumns].sort((a, b) => a.order - b.order),
  
  addProposal: (proposal: Proposal) => {
    state.proposals = [proposal, ...state.proposals]; 
    save();
    return state.proposals;
  },

  updateProposal: (updatedProposal: Proposal) => {
    state.proposals = state.proposals.map(p => p.id === updatedProposal.id ? updatedProposal : p);
    save();
    return state.proposals;
  },
  
  updateProposalStatus: (proposalId: string, newColumnId: string) => {
    state.proposals = state.proposals.map(p => 
      p.id === proposalId 
        ? { ...p, columnId: newColumnId, lastMovementDate: new Date().toISOString().split('T')[0] } 
        : p
    );
    save();
    return state.proposals;
  },

  addColumn: (column: ProposalColumn) => {
    state.proposalColumns = [...state.proposalColumns, column];
    save();
    return state.proposalColumns;
  },

  updateColumn: (updatedColumn: ProposalColumn) => {
    state.proposalColumns = state.proposalColumns.map(c => c.id === updatedColumn.id ? updatedColumn : c);
    save();
    return state.proposalColumns;
  },

  deleteColumn: (columnId: string) => {
    state.proposalColumns = state.proposalColumns.filter(c => c.id !== columnId);
    const firstCol = state.proposalColumns[0]?.id;
    if (firstCol) {
      state.proposals = state.proposals.map(p => p.columnId === columnId ? { ...p, columnId: firstCol } : p);
    }
    save();
    return { proposalColumns: state.proposalColumns, proposals: state.proposals };
  },

  addProperty: (producerId: string, property: Property) => {
    state.producers = state.producers.map(p => p.id === producerId ? { ...p, properties: [...p.properties, property] } : p);
    save();
  },

  updateProducer: (updatedProducer: Producer) => {
    const index = state.producers.findIndex(p => p.id === updatedProducer.id);
    if (index !== -1) state.producers[index] = updatedProducer;
    else state.producers = [updatedProducer, ...state.producers];
    save();
  },

  deleteProperty: (producerId: string, propertyId: string) => {
    state.producers = state.producers.map(p => {
      if (p.id === producerId) {
        return { ...p, properties: p.properties.filter(prop => prop.id !== propertyId) };
      }
      return p;
    });
    // Limpar visitas órfãs
    state.visits = state.visits.filter(v => v.propertyId !== propertyId);
    save();
  },

  addVisit: (visit: Visit) => {
    state.visits = [visit, ...state.visits];
    save();
  },

  updateVisit: (updatedVisit: Visit) => {
    state.visits = state.visits.map(v => v.id === updatedVisit.id ? updatedVisit : v);
    save();
  },

  addCatalogItem: (item: CatalogItem) => {
    state.catalog = [...state.catalog, item];
    save();
  },

  updateCatalogItem: (updatedItem: CatalogItem) => {
    state.catalog = state.catalog.map(i => i.id === updatedItem.id ? updatedItem : i);
    save();
  },

  deleteCatalogItem: (id: string) => {
    state.catalog = state.catalog.filter(i => i.id !== id);
    save();
  }
};
