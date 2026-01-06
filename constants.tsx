
import { Producer, Visit } from './types';

export const THEME = {
  primary: '#111827',
  secondary: '#10b981',
  accent: '#0ea5e9',
  warning: '#fbbf24',
};

export const CLIENT_BRAND = {
  name: 'AgroLink',
  corporateName: 'AgroLink Soluções Agrícolas',
  slogan: 'Conectando tecnologia e campo',
  primaryColor: 'emerald',
  version: 'v4.2 PRO'
};

export const MOCK_PRODUCERS: Producer[] = [
  {
    id: 'p1',
    name: 'Grupo Agrícola Terra Forte',
    farmName: 'Fazenda Boa Esperança',
    taxId: '12.345.678/0001-99',
    clientType: 'grupo',
    status: 'active',
    location: {
      address: 'Rodovia BR-163, Km 450',
      city: 'Sorriso',
      state: 'MT',
      region: 'Médio-Norte',
      totalArea: 1500,
      productiveArea: 1200,
      coordinates: { lat: -12.5505, lng: -55.6333 }
    },
    legal: {
      stateRegistration: '987654321',
      car: 'MT-1234567-ABCD-8888',
      ccir: '000.111.222.333',
      environmentalStatus: 'Regularizado'
    },
    structure: {
      activities: ['Soja', 'Milho', 'Algodão'],
      system: 'misto',
      techLevel: 'alto',
      infrastructure: ['Silos próprios', 'Conectividade Starlink', 'Frota Renovada']
    },
    contacts: {
      phone: '+55 66 99988-7766',
      email: 'contato@terraforte.agr.br',
      whatsapp: '5566999887766',
      list: [
        { 
          id: 'c-terra-1', 
          name: 'Ricardo Terra', 
          role: 'Produtor rural / Proprietário', 
          phone: '+55 66 99988-7766', 
          email: 'ricardo@terraforte.agr.br',
          isPrimary: true 
        },
        { 
          id: 'c-terra-2', 
          name: 'Marcos Oliveira', 
          role: 'Gerente geral da fazenda', 
          phone: '+55 66 98877-0011', 
          email: 'marcos@terraforte.agr.br' 
        }
      ]
    },
    commercial: {
      creditLimit: 2500000,
      classification: 'A',
      paymentTerms: 'Safra/30 dias',
      origin: 'Visita Técnica'
    },
    history: {
      registrationDate: '2023-01-15',
      origin: 'Indicação Comercial',
      observations: 'Cliente premium com alto potencial de expansão em 2025.'
    },
    properties: [
      {
        id: 'prop1',
        name: 'Talhão Norte',
        area: 450,
        cropType: 'Soja',
        coordinates: { lat: -12.5505, lng: -55.6333 },
        polygonCoords: [
          { lat: -12.5480, lng: -55.6350 },
          { lat: -12.5480, lng: -55.6310 },
          { lat: -12.5530, lng: -55.6310 },
          { lat: -12.5530, lng: -55.6350 }
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'João de Deus Ribeiro',
    farmName: 'Sítio Novo Horizonte',
    taxId: '123.456.789-00',
    clientType: 'produtor',
    status: 'prospect',
    location: {
      address: 'Estrada do Café, S/N',
      city: 'Patrocínio',
      state: 'MG',
      region: 'Cerrado Mineiro',
      totalArea: 150,
      productiveArea: 120,
      coordinates: { lat: -18.9442, lng: -46.9922 }
    },
    legal: {
      stateRegistration: '1122334455',
      car: 'MG-9998887-ZZZZ-0000',
      ccir: '444.555.666.777',
      environmentalStatus: 'Em análise'
    },
    structure: {
      activities: ['Café', 'Hortifrúti'],
      system: 'irrigado',
      techLevel: 'medio',
      infrastructure: ['Terreiro suspenso', 'Internet via rádio']
    },
    contacts: {
      phone: '+55 34 98877-1122',
      email: 'joao@novohorizonte.agr.br',
      whatsapp: '5534988771122',
      list: [
        { 
          id: 'c-joao-1', 
          name: 'João de Deus', 
          role: 'Produtor rural / Proprietário', 
          phone: '+55 34 98877-1122', 
          email: 'joao@novohorizonte.agr.br',
          isPrimary: true 
        }
      ]
    },
    commercial: {
      creditLimit: 300000,
      classification: 'B',
      paymentTerms: 'À vista com desconto',
      origin: 'Indicação'
    },
    history: {
      registrationDate: '2024-05-10',
      origin: 'Evento Agro',
      observations: 'Interessado em soluções de irrigação inteligente.'
    },
    properties: [
      {
        id: 'prop3',
        name: 'Área Principal',
        area: 120,
        cropType: 'Café',
        coordinates: { lat: -18.9442, lng: -46.9922 },
        polygonCoords: [
          { lat: -18.9430, lng: -46.9935 },
          { lat: -18.9430, lng: -46.9910 },
          { lat: -18.9460, lng: -46.9910 },
          { lat: -18.9460, lng: -46.9935 }
        ]
      }
    ]
  }
];

export const MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    producerId: 'p1',
    propertyId: 'prop1',
    date: '2024-12-10', 
    status: 'pending',
  },
  {
    id: 'v2',
    producerId: 'p2',
    propertyId: 'prop3',
    date: '2025-12-31', 
    status: 'pending',
  }
];
