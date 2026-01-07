
export type UserRole = 'admin' | 'operator';

export interface UserPermissions {
  dashboard: boolean;
  map: boolean;
  visits: boolean;
  producers: boolean;
  proposals: boolean;
  catalog: boolean;
  reports: boolean;
  users: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  password?: string;
  role: UserRole;
  permissions: UserPermissions;
  isVerified: boolean;
  createdAt: string;
}

export interface ConversationNote {
  id: string;
  timestamp: string;
  content: string;
}

export interface ContactItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isPrimary?: boolean;
}

export interface Producer {
  id: string;
  name: string;
  farmName: string;
  taxId: string;
  clientType: 'produtor' | 'arrendatario' | 'grupo' | 'cooperativa';
  status: 'active' | 'inactive' | 'prospect';
  location: {
    address: string;
    city: string;
    state: string;
    region: string;
    totalArea: number;
    productiveArea: number;
    coordinates: { lat: number; lng: number };
  };
  legal: {
    stateRegistration: string;
    car: string;
    ccir: string;
    environmentalStatus: string;
  };
  structure: {
    activities: string[];
    system: 'sequeiro' | 'irrigado' | 'misto';
    techLevel: 'alto' | 'medio' | 'baixo';
    infrastructure: string[];
  };
  contacts: {
    phone: string;
    email: string;
    whatsapp: string;
    list: ContactItem[];
  };
  commercial: {
    creditLimit: number;
    classification: 'A' | 'B' | 'C';
    paymentTerms: string;
    origin: string;
  };
  history?: {
    registrationDate: string;
    origin: string;
    observations: string;
  };
  properties: Property[];
}

export interface SoilFertility {
  id?: string;
  analysisDate: string;
  ph: number;
  organicMatter: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  ctc: number;
  vPercentage: number;
  micronutrients: string;
  recommendations: string;
}

export interface CropHistory {
  safra: string;
  variety: string;
  plantingSystem: string;
  plantingDate: string;
  harvestDate: string; // Previsão
  actualHarvestDate?: string; // Realizada
  plantPopulation: number;
  spacing: string;
}

export interface Property {
  id: string;
  name: string;
  area: number; 
  cropType: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  polygonCoords?: { lat: number; lng: number }[];
  physical?: {
    soilType: string;
    texture: string;
    declivity: string;
    altitude: number;
    waterRetention: string;
    drainage: string;
    erosion: string;
  };
  soilFertility?: SoilFertility;
  soilHistory?: SoilFertility[];
  cropHistory?: CropHistory;
  cropHistoryHistory?: CropHistory[];
  management?: {
    soilPrep: string;
    fertilization: string;
    liming: string;
    applications: string;
    applicationType: string;
    irrigation: string;
    operator: string;
  };
  climate?: {
    accumulatedRain: number;
    avgTemp: number;
    extremeEvents: string;
    climateRisk: string;
  };
  economic?: {
    inputCost: number;
    operationalCost: number;
    costPerHa: number;
    estimatedRevenue: number;
    grossMargin: number;
    profitability: number;
  };
  monitoring?: {
    pests: string;
    diseases: string;
    weeds: string;
    plantingFailures: string;
    techNotes: string;
    lastUpdate?: string;
  };
}

export interface Visit {
  id: string;
  producerId: string;
  propertyId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'pending' | 'completed' | 'ongoing';
  notes?: string;
  pests?: string;
  diseases?: string;
  weeds?: string;
  photos?: string[];
  recommendations?: string;
  reportSummary?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  type: 'product' | 'service';
  category: string;
  status: 'active' | 'inactive';
  brand?: string;
  serviceDetails?: any;
  productDetails?: any;
}

export interface ProposalItem {
  itemId: string;
  quantity: number;
  priceAtTime: number;
}

export interface ActivityGroup {
  activity: string;
  propertyIds: string[];
  items: ProposalItem[]; 
}

export interface Proposal {
  id: string;
  code: string;
  title: string;
  producerId: string;
  contactId?: string; 
  farmName: string;
  activityGroups: ActivityGroup[]; 
  totalValue: number;
  paymentMethod: string;
  validityDate: string;
  safra: string; 
  columnId: string;
  createdAt: string;
  expectedClosingDate: string;
  lastMovementDate: string;
  closingProbability: number; 
  lossReason?: string;
  technicalLead: string;
  commercialLead: string;
  description: string; 
  internalNotes?: string;
  aiGeneratedContent?: string; 
  conversationHistory: ConversationNote[]; 
  nextContactDate?: string; 
}

export interface ProposalColumn {
  id: string;
  title: string;
  order: number;
  color: string;
}

export interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}
