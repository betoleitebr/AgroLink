import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit3, X, Check, ShoppingBag, 
  Package, Wrench, DollarSign, Tag, Info, Layers, Beaker,
  Truck, ShieldCheck, ClipboardCheck, Target, AlertTriangle, Loader2
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { CatalogItem } from '../types';

const Catalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'service'>('product');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<'basic' | 'technical' | 'commercial'>('basic');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadados Dinâmicos (Serviços)
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [pricingModels, setPricingModels] = useState<string[]>([]);
  
  // Metadados Dinâmicos (Produtos)
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [agronomicClasses, setAgronomicClasses] = useState<string[]>([]);
  const [formulations, setFormulations] = useState<string[]>([]);
  const [productUnits, setProductUnits] = useState<string[]>([]);

  // Estados de Adição
  const [addingMetadata, setAddingMetadata] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [catData, sCats, pModels, pCats, aClasses, forms, pUnits] = await Promise.all([
        dataStore.getCatalog(),
        dataStore.getServiceCategories(),
        dataStore.getPricingModels(),
        dataStore.getProductCategories(),
        dataStore.getAgronomicClasses(),
        dataStore.getFormulations(),
        dataStore.getProductUnits()
      ]);
      setCatalog(catData);
      setServiceCategories(sCats);
      setPricingModels(pModels);
      setProductCategories(pCats);
      setAgronomicClasses(aClasses);
      setFormulations(forms);
      setProductUnits(pUnits);
      setLoading(false);
    };
    loadData();
  }, []);

  const [formState, setFormState] = useState<any>({
    name: '', description: '', price: '', unit: '', type: 'product', category: '', status: 'active', brand: '',
    serviceDetails: { scopeIncluded: '', pricingModel: '', periodicity: 'unica' },
    productDetails: { registrationNumber: '', agronomicClass: '', formulation: '', dosageRecommended: '' }
  });

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
        serviceDetails: item.serviceDetails || { scopeIncluded: '', pricingModel: pricingModels[0], periodicity: 'unica' },
        productDetails: item.productDetails || { registrationNumber: '', agronomicClass: agronomicClasses[0], formulation: formulations[0], dosageRecommended: '' }
      });
    } else {
      setSelectedItem(null);
      setFormState({
        name: '', description: '', price: '', type: activeTab, status: 'active', brand: '',
        category: activeTab === 'service' ? serviceCategories[0] : productCategories[0],
        unit: activeTab === 'product' ? productUnits[0] : '',
        serviceDetails: { scopeIncluded: '', pricingModel: pricingModels[0], periodicity: 'unica' },
        productDetails: { registrationNumber: '', agronomicClass: agronomicClasses[0], formulation: formulations[0], dosageRecommended: '' }
      });
    }
    setFormStep('basic');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formState.name || !formState.price) return;
    const newItem: CatalogItem = {
      ...formState,
      id: selectedItem?.id || `cat-${Date.now()}`,
      price: Number(formState.price),
      unit: formState.type === 'service' ? '' : formState.unit,
      brand: formState.type === 'service' ? '' : formState.brand
    };
    const updated = selectedItem ? await dataStore.updateCatalogItem(newItem) : await dataStore.addCatalogItem(newItem);
    setCatalog(updated);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir item?')) setCatalog(await dataStore.deleteCatalogItem(id));
  };

  const handleAddMetadata = async (key: string, listSetter: any, formFieldPath: string[]) => {
    if (!newValue.trim()) return;
    const updated = await dataStore.addMetadataItem(key, newValue.trim());
    listSetter(updated);
    
    // Atualiza o formState
    const updatedForm = { ...formState };
    let current = updatedForm;
    for (let i = 0; i < formFieldPath.length - 1; i++) current = current[formFieldPath[i]];
    current[formFieldPath[formFieldPath.length - 1]] = newValue.trim();
    setFormState(updatedForm);

    setNewValue('');
    setAddingMetadata(null);
  };

  const MetadataSelect = ({ label, value, options, onAdd, addingKey, fieldPath }: any) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {addingMetadata !== addingKey ? (
        <div className="flex gap-2">
          <select 
            value={value} 
            onChange={e => {
              const updatedForm = { ...formState };
              let current = updatedForm;
              for (let i = 0; i < fieldPath.length - 1; i++) current = current[fieldPath[i]];
              current[fieldPath[fieldPath.length - 1]] = e.target.value;
              setFormState(updatedForm);
            }} 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none"
          >
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button onClick={() => setAddingMetadata(addingKey)} className="bg-emerald-50 text-emerald-600 px-4 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"><Plus size={18}/></button>
        </div>
      ) : (
        <div className="flex gap-2 animate-in slide-in-from-right duration-300">
          <input type="text" autoFocus value={newValue} onChange={e => setNewValue(e.target.value)} className="flex-1 bg-white border border-emerald-300 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Novo item..." />
          <button onClick={onAdd} className="bg-emerald-600 text-white px-4 rounded-2xl shadow-lg"><Check size={18}/></button>
          <button onClick={() => setAddingMetadata(null)} className="bg-gray-100 text-gray-400 px-4 rounded-2xl"><X size={18}/></button>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" /> Carregando catálogo...</div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo Estratégico</h1>
          <p className="text-sm text-gray-500">Insumos e soluções integradas para o campo</p>
        </div>
        <button onClick={() => handleOpenForm()} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-transform">
          <Plus size={20} /> Cadastrar {activeTab === 'product' ? 'Produto' : 'Serviço'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 self-start">
          <button onClick={() => setActiveTab('product')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'product' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            <Package size={18} /> Produtos
          </button>
          <button onClick={() => setActiveTab('service')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'service' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
            <Wrench size={18} /> Serviços
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder={`Buscar em ${activeTab === 'product' ? 'produtos' : 'serviços'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
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
                  <button onClick={() => handleOpenForm(item)} className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
                    <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[8px] font-bold text-gray-400 uppercase">Dosagem</p><p className="text-[10px] font-bold text-gray-700">{item.productDetails?.dosageRecommended || '-'}</p></div>
                    <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[8px] font-bold text-gray-400 uppercase">Classe</p><p className="text-[10px] font-bold text-gray-700">{item.productDetails?.agronomicClass || '-'}</p></div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[8px] font-bold text-gray-400 uppercase">Cobrança</p><p className="text-[10px] font-bold text-gray-700">{item.serviceDetails?.pricingModel || '-'}</p></div>
                    <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[8px] font-bold text-gray-400 uppercase">Freq.</p><p className="text-[10px] font-bold text-gray-700">{item.serviceDetails?.periodicity || '-'}</p></div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Investimento Base</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">R$ {item.price.toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-400 font-medium">/ {item.type === 'product' ? item.unit : (item.serviceDetails?.pricingModel?.split(' ')[1] || 'un')}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300"><ShoppingBag size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeTab === 'product' ? 'bg-sky-500' : 'bg-orange-500'} text-white`}>{selectedItem ? <Edit3 size={20} /> : <Plus size={20} />}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem ? 'Editar Cadastro' : `Novo ${activeTab === 'product' ? 'Produto' : 'Serviço'}`}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeTab === 'product' ? 'Insumos e Defensivos' : 'Conhecimento e Execução'}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
            </div>

            <div className="flex bg-white border-b border-gray-100 px-6 overflow-x-auto scrollbar-hide">
              {['basic', 'technical', 'commercial'].map(step => (
                <button key={step} onClick={() => setFormStep(step as any)} className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${formStep === step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>
                  {step === 'basic' ? 'Dados Básicos' : step === 'technical' ? 'Técnico & Escopo' : 'Comercial & Regras'}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {formStep === 'basic' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Comercial</label>
                      <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    {activeTab === 'product' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Marca / Fabricante</label>
                        <input type="text" value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Ex: Bayer, BASF, Syngenta" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                    )}

                    <MetadataSelect 
                      label="Categoria"
                      value={formState.category}
                      options={activeTab === 'product' ? productCategories : serviceCategories}
                      addingKey="cat"
                      fieldPath={['category']}
                      onAdd={() => handleAddMetadata(activeTab === 'product' ? 'product_categories' : 'service_categories', activeTab === 'product' ? setProductCategories : setServiceCategories, ['category'])}
                    />

                    {activeTab === 'product' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select value={formState.status} onChange={e => setFormState({...formState, status: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none">
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                    )}

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
                      
                      <MetadataSelect 
                        label="Classe Agronômica"
                        value={formState.productDetails.agronomicClass}
                        options={agronomicClasses}
                        addingKey="ac"
                        fieldPath={['productDetails', 'agronomicClass']}
                        onAdd={() => handleAddMetadata('agronomic_classes', setAgronomicClasses, ['productDetails', 'agronomicClass'])}
                      />

                      <MetadataSelect 
                        label="Formulação"
                        value={formState.productDetails.formulation}
                        options={formulations}
                        addingKey="form"
                        fieldPath={['productDetails', 'formulation']}
                        onAdd={() => handleAddMetadata('formulations', setFormulations, ['productDetails', 'formulation'])}
                      />

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dose Recomendada</label>
                        <input type="text" value={formState.productDetails.dosageRecommended} onChange={e => setFormState({...formState, productDetails: {...formState.productDetails, dosageRecommended: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none" />
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
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Escopo do Serviço</label>
                        <textarea value={formState.serviceDetails.scopeIncluded} onChange={e => setFormState({...formState, serviceDetails: {...formState.serviceDetails, scopeIncluded: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none" />
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

                    {activeTab === 'product' ? (
                      <MetadataSelect 
                        label="Unidade de Medida"
                        value={formState.unit}
                        options={productUnits}
                        addingKey="unit"
                        fieldPath={['unit']}
                        onAdd={() => handleAddMetadata('product_units', setProductUnits, ['unit'])}
                      />
                    ) : (
                      <MetadataSelect 
                        label="Modelo de Cobrança"
                        value={formState.serviceDetails.pricingModel}
                        options={pricingModels}
                        addingKey="model"
                        fieldPath={['serviceDetails', 'pricingModel']}
                        onAdd={() => handleAddMetadata('pricing_models', setPricingModels, ['serviceDetails', 'pricingModel'])}
                      />
                    )}
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-start gap-4">
                    <Info size={24} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">Referência base de preços que pode ser personalizada individualmente nas propostas comerciais.</p>
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