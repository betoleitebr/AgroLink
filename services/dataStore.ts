
import { neon } from '@neondatabase/serverless';
import { Producer, Property, Visit, Proposal, ProposalColumn, CatalogItem } from '../types';
import { MOCK_PRODUCERS, MOCK_VISITS } from '../constants';

const sql = neon('postgresql://neondb_owner:npg_8oIQS4HLvmaU@ep-raspy-paper-acj6kepf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

const mapToCamel = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (let key in obj) {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

export const dataStore = {
  init: async () => {
    try {
      // Create tables with basic constraints
      await sql`CREATE TABLE IF NOT EXISTS producers (id TEXT PRIMARY KEY, name TEXT, farm_name TEXT, tax_id TEXT, client_type TEXT, status TEXT, location JSONB, legal JSONB, structure JSONB, contacts JSONB, commercial JSONB, history JSONB)`;
      await sql`CREATE TABLE IF NOT EXISTS properties (id TEXT PRIMARY KEY, producer_id TEXT, name TEXT, area NUMERIC, crop_type TEXT, coordinates JSONB, polygon_coords JSONB, physical JSONB, soil_fertility JSONB, soil_history JSONB, crop_history JSONB, crop_history_history JSONB, management JSONB, climate JSONB, economic JSONB, monitoring JSONB)`;
      await sql`CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, producer_id TEXT, property_id TEXT, date TEXT, status TEXT, notes TEXT, pests TEXT, diseases TEXT, weeds TEXT, photos JSONB, recommendations TEXT, report_summary TEXT, check_in_time TEXT, check_out_time TEXT)`;
      await sql`CREATE TABLE IF NOT EXISTS catalog_items (id TEXT PRIMARY KEY, name TEXT, description TEXT, price NUMERIC, unit TEXT, type TEXT, category TEXT, status TEXT, brand TEXT, details JSONB)`;
      await sql`CREATE TABLE IF NOT EXISTS proposal_columns (id TEXT PRIMARY KEY, title TEXT, "order" INTEGER, color TEXT)`;
      await sql`CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, code TEXT, title TEXT, producer_id TEXT, contact_id TEXT, farm_name TEXT, total_value NUMERIC, payment_method TEXT, validity_date TEXT, safra TEXT, column_id TEXT, expected_closing_date TEXT, last_movement_date TEXT, closing_probability INTEGER, description TEXT, ai_generated_content TEXT, activity_groups JSONB, conversation_history JSONB, next_contact_date TEXT, internal_notes TEXT)`;
      await sql`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value JSONB)`;

      // Migration: Ensure columns added in updates exist in existing tables
      await sql`ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contact_id TEXT`;
      await sql`ALTER TABLE proposals ADD COLUMN IF NOT EXISTS internal_notes TEXT`;

      // Seed Proposal Columns
      const colsCount = await sql`SELECT count(*) FROM proposal_columns`;
      if (parseInt(colsCount[0].count) === 0) {
        await sql`INSERT INTO proposal_columns (id, title, "order", color) VALUES 
          ('col-1', 'Lead', 1, '#94a3b8'), 
          ('col-2', 'Diagnóstico', 2, '#38bdf8'), 
          ('col-3', 'Proposta', 3, '#fbbf24'), 
          ('col-4', 'Negociação', 4, '#f472b6'), 
          ('col-5', 'Fechado', 5, '#10b981')`;
      }

      // Seed Producers and Properties
      const prodCount = await sql`SELECT count(*) FROM producers`;
      if (parseInt(prodCount[0].count) === 0) {
        for (const p of MOCK_PRODUCERS) {
          await sql`
            INSERT INTO producers (id, name, farm_name, tax_id, client_type, status, location, legal, structure, contacts, commercial, history)
            VALUES (
              ${p.id}, ${p.name}, ${p.farmName}, ${p.taxId}, ${p.clientType}, ${p.status}, 
              ${JSON.stringify(p.location)}::jsonb, 
              ${JSON.stringify(p.legal)}::jsonb, 
              ${JSON.stringify(p.structure)}::jsonb, 
              ${JSON.stringify(p.contacts)}::jsonb, 
              ${JSON.stringify(p.commercial)}::jsonb, 
              ${JSON.stringify(p.history || {})}::jsonb
            )
          `;
          for (const prop of p.properties) {
            await sql`
              INSERT INTO properties (id, producer_id, name, area, crop_type, coordinates, polygon_coords, physical, soil_fertility, management, climate, economic, monitoring)
              VALUES (
                ${prop.id}, ${p.id}, ${prop.name}, ${prop.area}, ${prop.cropType}, 
                ${JSON.stringify(prop.coordinates)}::jsonb, 
                ${JSON.stringify(prop.polygonCoords || [])}::jsonb, 
                ${JSON.stringify(prop.physical || {})}::jsonb, 
                ${JSON.stringify(prop.soilFertility || {})}::jsonb, 
                ${JSON.stringify(prop.management || {})}::jsonb, 
                ${JSON.stringify(prop.climate || {})}::jsonb, 
                ${JSON.stringify(prop.economic || {})}::jsonb, 
                ${JSON.stringify(prop.monitoring || {})}::jsonb
              )
            `;
          }
        }
      }

      // Seed Only Valid Visits
      const visitCount = await sql`SELECT count(*) FROM visits`;
      if (parseInt(visitCount[0].count) === 0) {
        for (const v of MOCK_VISITS) {
          const pExists = MOCK_PRODUCERS.find(p => p.id === v.producerId);
          const propExists = pExists?.properties.find(pr => pr.id === v.propertyId);
          
          if (pExists && propExists) {
            await sql`
              INSERT INTO visits (id, producer_id, property_id, date, status, notes, pests, diseases, weeds, photos, recommendations, report_summary, check_in_time, check_out_time)
              VALUES (
                ${v.id}, ${v.producerId}, ${v.propertyId}, ${v.date}, ${v.status}, 
                ${v.notes || ''}, ${v.pests || ''}, ${v.diseases || ''}, ${v.weeds || ''}, 
                ${JSON.stringify(v.photos || [])}::jsonb, 
                ${v.recommendations || ''}, ${v.reportSummary || ''}, 
                ${v.checkInTime || null}, ${v.checkOutTime || null}
              )
            `;
          }
        }
      }

      // Metadata initialization
      const initMetadata = async (key: string, defaultValue: any) => {
        const rows = await sql`SELECT * FROM metadata WHERE key = ${key}`;
        if (rows.length === 0) {
          await sql`INSERT INTO metadata (key, value) VALUES (${key}, ${JSON.stringify(defaultValue)}::jsonb)`;
        }
      };

      await initMetadata('available_crops', ["Soja", "Milho", "Algodão", "Café", "Pasto"]);
      await initMetadata('service_categories', ["Consultoria Agronômica", "Análise de Solo", "Mapeamento", "Aplicação Aérea", "Treinamento"]);
      await initMetadata('pricing_models', ["Por Hectare", "Por Hora", "Por Amostra", "Por Visita", "Valor por Safra"]);
      await initMetadata('product_categories', ["Fertilizante", "Defensivo", "Semente", "Biológico", "Nutrição Foliar"]);
      await initMetadata('agronomic_classes', ["Herbicida", "Inseticida", "Fungicida", "Acaricida", "Adjuvante", "Fertilizante"]);
      await initMetadata('formulations', ["Grânulos", "Concentrado Solúvel (SL)", "Pó Molhável (WP)", "Suspensão Concentrada (SC)", "Emulsão Óleo em Água (EW)"]);
      await initMetadata('product_units', ["kg", "litro", "alqueire", "amostra", "safra", "unidade"]);

    } catch (err) {
      console.error("Database init error:", err);
    }
  },

  getMetadataList: async (key: string): Promise<string[]> => {
    const rows = await sql`SELECT value FROM metadata WHERE key = ${key}`;
    return rows.length > 0 ? (rows[0].value as string[]) : [];
  },

  addMetadataItem: async (key: string, newItem: string): Promise<string[]> => {
    const list = await dataStore.getMetadataList(key);
    if (!list.includes(newItem)) {
      const updated = [...list, newItem];
      await sql`UPDATE metadata SET value = ${JSON.stringify(updated)}::jsonb WHERE key = ${key}`;
      return updated;
    }
    return list;
  },

  getAvailableCrops: () => dataStore.getMetadataList('available_crops'),
  addAvailableCrop: (item: string) => dataStore.addMetadataItem('available_crops', item),
  getServiceCategories: () => dataStore.getMetadataList('service_categories'),
  addServiceCategory: (item: string) => dataStore.addMetadataItem('service_categories', item),
  getPricingModels: () => dataStore.getMetadataList('pricing_models'),
  addPricingModel: (item: string) => dataStore.addMetadataItem('pricing_models', item),
  getProductCategories: () => dataStore.getMetadataList('product_categories'),
  addProductCategory: (item: string) => dataStore.addMetadataItem('product_categories', item),
  getAgronomicClasses: () => dataStore.getMetadataList('agronomic_classes'),
  addAgronomicClass: (item: string) => dataStore.addMetadataItem('agronomic_classes', item),
  getFormulations: () => dataStore.getMetadataList('formulations'),
  addFormulation: (item: string) => dataStore.addMetadataItem('formulations', item),
  getProductUnits: () => dataStore.getMetadataList('product_units'),
  addProductUnit: (item: string) => dataStore.addMetadataItem('product_units', item),

  getProducers: async (): Promise<Producer[]> => {
    const rows = await sql`SELECT * FROM producers ORDER BY name ASC`;
    const producers = rows.map(mapToCamel);
    for (const p of producers) {
      const propRows = await sql`SELECT * FROM properties WHERE producer_id = ${p.id}`;
      p.properties = propRows.map(mapToCamel);
    }
    return producers as Producer[];
  },

  updateProducer: async (p: Producer) => {
    await sql`
      INSERT INTO producers (id, name, farm_name, tax_id, client_type, status, location, legal, structure, contacts, commercial, history)
      VALUES (
        ${p.id}, ${p.name}, ${p.farmName}, ${p.taxId}, ${p.clientType}, ${p.status}, 
        ${JSON.stringify(p.location)}::jsonb, 
        ${JSON.stringify(p.legal)}::jsonb, 
        ${JSON.stringify(p.structure)}::jsonb, 
        ${JSON.stringify(p.contacts)}::jsonb, 
        ${JSON.stringify(p.commercial)}::jsonb, 
        ${JSON.stringify(p.history || {})}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, farm_name = EXCLUDED.farm_name, tax_id = EXCLUDED.tax_id, 
        status = EXCLUDED.status, location = EXCLUDED.location, legal = EXCLUDED.legal, 
        structure = EXCLUDED.structure, contacts = EXCLUDED.contacts, 
        commercial = EXCLUDED.commercial, history = EXCLUDED.history
    `;
  },

  addProperty: async (producerId: string, prop: Property) => {
    // FIX: Corrected target table and column count/names for properties
    await sql`
      INSERT INTO properties (id, producer_id, name, area, crop_type, coordinates, polygon_coords, physical, soil_fertility, management, climate, economic, monitoring)
      VALUES (
        ${prop.id}, ${producerId}, ${prop.name}, ${prop.area}, ${prop.cropType}, 
        ${JSON.stringify(prop.coordinates)}::jsonb, 
        ${JSON.stringify(prop.polygonCoords || [])}::jsonb, 
        ${JSON.stringify(prop.physical || {})}::jsonb, 
        ${JSON.stringify(prop.soilFertility || {})}::jsonb, 
        ${JSON.stringify(prop.management || {})}::jsonb, 
        ${JSON.stringify(prop.climate || {})}::jsonb, 
        ${JSON.stringify(prop.economic || {})}::jsonb, 
        ${JSON.stringify(prop.monitoring || {})}::jsonb
      )
    `;
  },

  deleteProperty: async (producerId: string, propertyId: string) => {
    await sql`DELETE FROM properties WHERE id = ${propertyId} AND producer_id = ${producerId}`;
  },

  getVisits: async (): Promise<Visit[]> => {
    const rows = await sql`SELECT * FROM visits ORDER BY date DESC`;
    return rows.map(mapToCamel) as Visit[];
  },

  addVisit: async (v: Visit) => {
    await sql`
      INSERT INTO visits (id, producer_id, property_id, date, status, notes, pests, diseases, weeds, photos, recommendations, report_summary, check_in_time, check_out_time)
      VALUES (
        ${v.id}, ${v.producerId}, ${v.propertyId}, ${v.date}, ${v.status}, 
        ${v.notes || ''}, ${v.pests || ''}, ${v.diseases || ''}, ${v.weeds || ''}, 
        ${JSON.stringify(v.photos || [])}::jsonb, 
        ${v.recommendations || ''}, ${v.reportSummary || ''}, 
        ${v.checkInTime || null}, ${v.checkOutTime || null}
      )
    `;
  },

  updateVisit: async (v: Visit) => {
    // FIX: Fixed property names for Visit object (v.reportSummary and v.checkOutTime)
    await sql`
      UPDATE visits SET 
        status = ${v.status}, notes = ${v.notes}, pests = ${v.pests}, 
        diseases = ${v.diseases}, weeds = ${v.weeds}, 
        photos = ${JSON.stringify(v.photos || [])}::jsonb, 
        recommendations = ${v.recommendations}, 
        report_summary = ${v.reportSummary}, 
        check_in_time = ${v.checkInTime}, check_out_time = ${v.checkOutTime}
      WHERE id = ${v.id}
    `;
  },

  getProposals: async (): Promise<Proposal[]> => {
    const rows = await sql`SELECT * FROM proposals ORDER BY code DESC`;
    return rows.map(mapToCamel) as Proposal[];
  },

  getProposalColumns: async (): Promise<ProposalColumn[]> => {
    const rows = await sql`SELECT * FROM proposal_columns ORDER BY "order" ASC`;
    return rows as ProposalColumn[];
  },

  addProposal: async (p: Proposal) => {
    await sql`
      INSERT INTO proposals (id, code, title, producer_id, contact_id, farm_name, total_value, payment_method, validity_date, safra, column_id, expected_closing_date, last_movement_date, closing_probability, description, ai_generated_content, activity_groups, conversation_history, next_contact_date, internal_notes)
      VALUES (
        ${p.id}, ${p.code}, ${p.title}, ${p.producerId}, ${p.contactId}, ${p.farmName}, ${p.totalValue}, 
        ${p.paymentMethod}, ${p.validityDate}, ${p.safra}, ${p.columnId}, 
        ${p.expectedClosingDate}, ${p.lastMovementDate}, ${p.closingProbability}, 
        ${p.description}, ${p.aiGeneratedContent || ''}, 
        ${JSON.stringify(p.activityGroups)}::jsonb, 
        ${JSON.stringify(p.conversationHistory)}::jsonb, 
        ${p.nextContactDate}, ${p.internalNotes || ''}
      )
    `;
    return dataStore.getProposals();
  },

  updateProposal: async (p: Proposal) => {
    // FIX: Fixed property names for Proposal object (p.internalNotes)
    await sql`
      UPDATE proposals SET 
        title = ${p.title}, producer_id = ${p.producerId}, contact_id = ${p.contactId}, farm_name = ${p.farmName}, 
        total_value = ${p.totalValue}, payment_method = ${p.paymentMethod}, 
        validity_date = ${p.validityDate}, safra = ${p.safra}, column_id = ${p.columnId}, 
        expected_closing_date = ${p.expectedClosingDate}, last_movement_date = ${p.lastMovementDate}, 
        closing_probability = ${p.closingProbability}, description = ${p.description}, 
        ai_generated_content = ${p.aiGeneratedContent || ''}, 
        activity_groups = ${JSON.stringify(p.activityGroups)}::jsonb, 
        conversation_history = ${JSON.stringify(p.conversationHistory)}::jsonb, 
        next_contact_date = ${p.nextContactDate},
        internal_notes = ${p.internalNotes || ''}
      WHERE id = ${p.id}
    `;
    return dataStore.getProposals();
  },

  updateProposalStatus: async (id: string, columnId: string) => {
    await sql`UPDATE proposals SET column_id = ${columnId}, last_movement_date = CURRENT_DATE WHERE id = ${id}`;
    return dataStore.getProposals();
  },

  addColumn: async (c: ProposalColumn) => {
    await sql`INSERT INTO proposal_columns (id, title, "order", color) VALUES (${c.id}, ${c.title}, ${c.order}, ${c.color})`;
    return dataStore.getProposalColumns();
  },

  updateColumn: async (c: ProposalColumn) => {
    await sql`UPDATE proposal_columns SET title = ${c.title}, "order" = ${c.order}, color = ${c.color} WHERE id = ${c.id}`;
    return dataStore.getProposalColumns();
  },

  deleteColumn: async (targetId: string) => {
    const columnsBefore = await dataStore.getProposalColumns();
    const remainingCols = columnsBefore.filter(c => c.id !== targetId);
    
    if (remainingCols.length > 0) {
      const fallbackId = remainingCols[0].id;
      // Atualiza propostas órfãs para a primeira coluna disponível antes de deletar a etapa
      await sql`UPDATE proposals SET column_id = ${fallbackId} WHERE column_id = ${targetId}`;
    }

    // Deleta a etapa de fato
    await sql`DELETE FROM proposal_columns WHERE id = ${targetId}`;
    
    // Busca dados atualizados para retorno atômico ao frontend
    const updatedProposals = await dataStore.getProposals();
    const updatedColumns = await dataStore.getProposalColumns();
    
    return { proposals: updatedProposals, proposalColumns: updatedColumns };
  },

  getCatalog: async (): Promise<CatalogItem[]> => {
    const rows = await sql`SELECT * FROM catalog_items ORDER BY name ASC`;
    return rows.map(row => {
      const item = mapToCamel(row) as any;
      if (item.type === 'product') {
        item.productDetails = item.details;
      } else {
        item.serviceDetails = item.details;
      }
      return item as CatalogItem;
    });
  },

  addCatalogItem: async (i: CatalogItem) => {
    await sql`
      INSERT INTO catalog_items (id, name, description, price, unit, type, category, status, brand, details)
      VALUES (
        ${i.id}, ${i.name}, ${i.description}, ${i.price}, ${i.unit}, ${i.type}, ${i.category}, 
        ${i.status}, ${i.brand}, 
        ${JSON.stringify(i.type === 'product' ? i.productDetails : i.serviceDetails)}::jsonb
      )
    `;
    return dataStore.getCatalog();
  },

  updateCatalogItem: async (i: CatalogItem) => {
    await sql`
      UPDATE catalog_items SET 
        name = ${i.name}, description = ${i.description}, price = ${i.price}, 
        unit = ${i.unit}, type = ${i.type}, category = ${i.category}, 
        status = ${i.status}, brand = ${i.brand}, 
        details = ${JSON.stringify(i.type === 'product' ? i.productDetails : i.serviceDetails)}::jsonb
      WHERE id = ${i.id}
    `;
    return dataStore.getCatalog();
  },

  deleteCatalogItem: async (id: string) => {
    await sql`DELETE FROM catalog_items WHERE id = ${id}`;
    return dataStore.getCatalog();
  }
};
