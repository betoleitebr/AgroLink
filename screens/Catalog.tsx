
import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit3, X, Check, ShoppingBag, 
  Package, Wrench, DollarSign, Tag, Info, Layers, Beaker,
  Truck, ShieldCheck, ClipboardCheck, Target, AlertTriangle
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { CatalogItem } from '../types';

const Catalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'service'>('product');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<'basic' | 'technical' | 'commercial'>('basic');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const [formState, setFormState] = useState<any>({
    name: '',
    description: '',
    price: '',
    unit: '',
    type: 'product',
    category: '',
    status: 'active',
    brand: '',
    subCategory: '',
    // Service specific
    serviceDetails: {
      scopeIncluded: '',
      scopeExcluded: '',
      pricingModel: 'hectare',
      technicalResponsible: '',
      periodicity: 'unica',
      deliverables: [],
      impactExpected: ''
    },
    // Product specific
    productDetails: {
      registrationNumber: '',
      agronomicClass: '',
      formulation: '',
      dosageRecommended: '',
      packaging: '',
      validity: '',
      toxicologicalClass: '',
      requiredEPI: []
    }
  });

  const catalog = dataStore.getCatalog();
  const filteredCatalog = catalog.filter(item => 
    item.type === activeTab &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (item?: CatalogItem) => {
    if (item) {
      setSelectedItem(item);
      setFormState({
        ...item,
        price: item.price.toString(),
        serviceDetails: item.serviceDetails || formState.serviceDetails,
        productDetails: item.productDetails || formState.productDetails
      });
    } else {
      setSelectedItem(null);
      setFormState({
        name: '',
        description: '',
        price: '',
        unit: '',
        type: activeTab,
        category: '',
        status: 'active',
        brand: '',
        subCategory: '',
        serviceDetails: { scopeIncluded: '', scopeExcluded: '', pricingModel: 'hectare', technicalResponsible: '', periodicity: 'unica', deliverables: [], impactExpected: '' },
        productDetails: { registrationNumber: '', agronomicClass: '', formulation: '', dosageRecommended: '', packaging: '', validity: '', toxicologicalClass: '', requiredEPI: [] }
      });
    }
    setFormStep('basic');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formState.name || !formState.price) return;

    const newItem: CatalogItem = {
      ...formState,
      id: selectedItem?.id || `cat-${Date.now()}`,
      price: Number(formState.price)
    };

    if (selectedItem) {
      dataStore.updateCatalogItem(newItem);
    } else {
      dataStore.addCatalogItem(newItem);
    }

    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir este item do catálogo?')) {
      dataStore.deleteCatalogItem(id);
      setSearchTerm(searchTerm); 
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo Estratégico</h1>
          <p className="text-sm text-gray-500">Insumos e soluções integradas para o campo</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Cadastrar {activeTab === 'product' ? 'Produto' : 'Serviço'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 self-start">
          <button 
            onClick={() => setActiveTab('product')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'product' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Package size={18} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'service' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Wrench size={18} /> Serviços
          </button>
        </div>
        
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={`Buscar em ${activeTab === 'product' ? 'produtos' : 'serviços'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCatalog.map((item) => (
          <div key={item.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
               <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {item.status === 'active' ? 'Ativo' : 'Inativo'}
               </span>
            </div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${item.type === 'product' ? 'bg-sky-50 text-sky-600' : 'bg-orange-50 text-orange-600'}`}>
                  {item.type === 'product' ? <Package size={24} /> : <Wrench size={24} />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(item)} className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">{item.category}</span>
                {item.brand && <span className="text-[10px] font-bold text-gray-400 uppercase">/ {item.brand}</span>}
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-4">{item.description}</p>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                {item.type === 'product' ? (
                  <>
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Dosagem</p>
                      <p className="text-[10px] font-bold text-gray-700">{item.productDetails?.dosageRecommended || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Classe</p>
                      <p className="text-[10px] font-bold text-gray-700">{item.productDetails?.agronomicClass?.split(' ')[0] || '-'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Cobrança</p>
                      <p className="text-[10px] font-bold text-gray-700">{item.serviceDetails?.pricingModel || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Periodicidade</p>
                      <p className="text-[10px] font-bold text-gray-700">{item.serviceDetails?.periodicity || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Investimento Base</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">R$ {item.price.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-400 font-medium">/ {item.unit}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <ShoppingBag size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Formulário Expandido com Abas */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeTab === 'product' ? 'bg-sky-500' : 'bg-orange-500'} text-white`}>
                  {selectedItem ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem ? 'Editar Cadastro' : `Novo ${activeTab === 'product' ? 'Produto' : 'Serviço'}`}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeTab === 'product' ? 'Insumos e Defensivos' : 'Conhecimento e Execução'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
            </div>

            <div className="flex bg-white border-b border-gray-100 px-6 overflow-x-auto scrollbar-hide">
              <button onClick={() => setFormStep('basic')} className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${formStep === 'basic' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>Dados Básicos</button>
              <button onClick={() => setFormStep('technical')} className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${formStep === 'technical' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>Técnico & Escopo</button>
              <button onClick={() => setFormStep('commercial')} className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${formStep === 'commercial' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>Comercial & Regras</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {formStep === 'basic' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Comercial</label>
                      <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Marca / Fabricante</label>
                      <input type="text" value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Bayer, BASF, Syngenta" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                      <input type="text" value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Fertilizantes, Defensivos, Consultoria" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                      <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descrição Curta</label>
                      <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {formStep === 'technical' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  {activeTab === 'product' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Registro (MAPA)</label>
                        <input type="text" value={formState.productDetails.registrationNumber} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, registrationNumber: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Classe Agronômica</label>
                        <input type="text" value={formState.productDetails.agronomicClass} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, agronomicClass: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Herbicida Seletivo" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Formulação</label>
                        <input type="text" value={formState.productDetails.formulation} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, formulation: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Grânulos, Concentrado Solúvel" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dose Recomendada</label>
                        <input type="text" value={formState.productDetails.dosageRecommended} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, dosageRecommended: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Classificação Toxicológica</label>
                        <select value={formState.productDetails.toxicologicalClass} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, toxicologicalClass: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                          <option value="">Selecione...</option>
                          <option value="I">Extremamente Tóxico (Classe I)</option>
                          <option value="II">Altamente Tóxico (Classe II)</option>
                          <option value="III">Moderadamente Tóxico (Classe III)</option>
                          <option value="IV">Pouco Tóxico (Classe IV)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Validade Média</label>
                        <input type="text" value={formState.productDetails.validity} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, validity: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: 24 meses" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Responsável Técnico (RT)</label>
                        <input type="text" value={formState.serviceDetails.technicalResponsible} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, technicalResponsible: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Periodicidade</label>
                        <select value={formState.serviceDetails.periodicity} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, periodicity: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                          <option value="unica">Evento Único</option>
                          <option value="mensal">Mensal</option>
                          <option value="safra">Por Safra</option>
                          <option value="recorrente">Recorrente sob demanda</option>
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Escopo do Serviço (O que está incluso)</label>
                        <textarea value={formState.serviceDetails.scopeIncluded} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, scopeIncluded: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none" />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Impacto Esperado (Objetivos Técnicos)</label>
                        <textarea value={formState.serviceDetails.impactExpected} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, impactExpected: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formStep === 'commercial' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                        <input type="number" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-emerald-900 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Unidade de Medida</label>
                      <input type="text" value={formState.unit} onChange={e => setFormState({...formState, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: kg, ha, litro, amostra" />
                    </div>
                    {activeTab === 'service' && (
                       <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Modelo de Cobrança</label>
                        <select value={formState.serviceDetails.pricingModel} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, pricingModel: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                          <option value="hectare">Por Hectare</option>
                          <option value="cabeca">Por Cabeça</option>
                          <option value="hora">Por Hora/Homem</option>
                          <option value="visita">Por Visita</option>
                          <option value="safra">Valor por Safra</option>
                        </select>
                      </div>
                    )}
                    {activeTab === 'product' && (
                       <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Embalagem de Venda</label>
                        <input type="text" value={formState.productDetails.packaging} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, packaging: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Big Bag 1000kg" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-start gap-4">
                    <Info size={24} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Lembre-se: Os preços base podem ser personalizados durante a criação de propostas individuais para cada cliente. Este valor serve como referência para o cálculo inicial do pipeline.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-3xl font-bold text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                <Check size={18} /> {selectedItem ? 'Atualizar' : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
