
import React, { useEffect, useRef, useState } from 'react';
import { 
  X, Map as MapIcon, Loader2, Navigation, Activity, Leaf, 
  Beaker, TrendingUp, ChevronLeft, ChevronRight, Check, Plus, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { dataStore } from '../services/dataStore';
import { getCurrentLocation } from '../services/weatherService';
import { Property, Producer } from '../types';

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [pendingLayer, setPendingLayer] = useState<any>(null);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [isAddingNewCrop, setIsAddingNewCrop] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [isCropsLoading, setIsCropsLoading] = useState(false);
  
  useEffect(() => {
    const loadInitialData = async () => {
      const [prodData, cropData] = await Promise.all([
        dataStore.getProducers(),
        dataStore.getAvailableCrops()
      ]);
      setProducers(prodData);
      setAvailableCrops(cropData);
    };
    loadInitialData();
  }, []);

  const [formData, setFormData] = useState<any>({
    name: '',
    producerId: '',
    cropType: '',
    areaM2: 0,
    physical: {
      soilType: 'Latossolo Vermelho',
      texture: 'Argilosa',
      declivity: 'Suave Ondulado',
      altitude: 0,
      waterRetention: 'Média',
      drainage: 'Boa',
      erosion: 'Inexistente'
    },
    soilFertility: {
      analysisDate: new Date().toISOString().split('T')[0],
      ph: 6.2, organicMatter: 3.5, phosphorus: 12, potassium: 0.45,
      calcium: 4.5, magnesium: 1.2, sulfur: 8, ctc: 12, vPercentage: 65,
      micronutrients: '', recommendations: ''
    },
    cropHistory: {
      safra: '2025/26',
      variety: '',
      plantingSystem: 'Plantio Direto',
      plantingDate: '',
      harvestDate: '', 
      actualHarvestDate: '', 
      plantPopulation: 320000,
      spacing: '0.45m'
    },
    management: {
      soilPrep: 'Nenhum (Direto)',
      fertilization: '',
      liming: '',
      applications: '',
      applicationType: 'Cobertura',
      irriciency: 'Sequeiro',
      operator: ''
    },
    climate: {
      accumulatedRain: 0,
      avgTemp: 24,
      extremeEvents: 'Nenhum',
      climateRisk: 'Baixo'
    },
    economic: {
      inputCost: 4500,
      operationalCost: 1200,
      costPerHa: 5700,
      estimatedRevenue: 12000,
      grossMargin: 6300,
      profitability: 0
    }
  });

  useEffect(() => {
    if (producers.length > 0 && !formData.producerId) {
      setFormData(prev => ({ ...prev, producerId: producers[0].id }));
    }
    if (availableCrops.length > 0 && !formData.cropType) {
      setFormData(prev => ({ ...prev, cropType: availableCrops[0] }));
    }
  }, [producers, availableCrops]);

  const calculateArea = (layer: any): number => {
    if (!layer) return 0;

    // Cálculo para Círculos (Circunferências)
    if (typeof layer.getRadius === 'function') {
      const radius = layer.getRadius();
      return Math.PI * Math.pow(radius, 2);
    }

    // Cálculo para Polígonos e Retângulos
    if (typeof layer.getLatLngs === 'function') {
      let latlngs = layer.getLatLngs();
      if (Array.isArray(latlngs[0])) latlngs = latlngs[0];
      if (!latlngs || latlngs.length < 3) return 0;
      
      let area = 0;
      const radius = 6378137;
      const degToRad = Math.PI / 180;
      
      for (let i = 0; i < latlngs.length; i++) {
        const p1 = latlngs[i];
        const p2 = latlngs[(i + 1) % latlngs.length];
        const dLon = (p2.lng - p1.lng) * degToRad;
        area += dLon * (2 + Math.sin(p1.lat * degToRad) + Math.sin(p2.lat * degToRad));
      }
      return Math.abs(area * radius * radius / 2.0);
    }
    return 0;
  };

  const handleLocateMe = async () => {
    if (!mapInstance.current) return;
    setIsLocating(true);
    try {
      const pos = await getCurrentLocation();
      mapInstance.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
    } catch (err) {
      alert("Localização indisponível.");
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;
    const map = L.map(mapContainer.current, { zoomControl: false, attributionControl: false }).setView([-15.7801, -47.9292], 4);
    mapInstance.current = map;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);

    const initMapData = async () => {
      const producersData = await dataStore.getProducers();
      producersData.forEach(producer => {
        producer.properties.forEach(prop => {
          if (prop.polygonCoords?.length) {
            const poly = L.polygon(prop.polygonCoords.map(c => [c.lat, c.lng]), { color: '#10b981', weight: 3 }).addTo(map);
            poly.on('click', () => navigate(`/field/${prop.id}`));
            poly.bindTooltip(prop.name, { permanent: false, direction: 'center', className: 'bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-lg border-none' });
          }
        });
      });
    };
    initMapData();

    map.pm.addControls({ 
      position: 'topleft', 
      drawRectangle: true, 
      drawPolygon: true, 
      drawCircle: true, // Habilitado para circunferências
      editMode: true, 
      removalMode: true 
    });

    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      setPendingLayer(layer);
      setFormData(prev => ({ ...prev, areaM2: calculateArea(layer) }));
      setFormStep(1);
      setShowForm(true);
    });
  }, []);

  const handleAddNewCrop = async () => {
    if (!newCropName.trim()) return;
    setIsCropsLoading(true);
    try {
      const updated = await dataStore.addAvailableCrop(newCropName.trim());
      setAvailableCrops(updated);
      setFormData(prev => ({ ...prev, cropType: newCropName.trim() }));
      setNewCropName('');
      setIsAddingNewCrop(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCropsLoading(false);
    }
  };

  const totalCost = formData.economic.inputCost + formData.economic.operationalCost;
  const projectedMargin = formData.economic.estimatedRevenue - totalCost;
  const currentProfitability = totalCost > 0 
    ? ((projectedMargin / totalCost) * 100).toFixed(1)
    : "0.0";

  const handleConfirm = async () => {
    if (!formData.name) return alert("Dê um nome ao talhão");
    let center = { lat: 0, lng: 0 };
    
    // Suporte para centro de círculos e polígonos
    if (pendingLayer.getBounds) center = pendingLayer.getBounds().getCenter();
    else if (pendingLayer.getLatLng) center = pendingLayer.getLatLng();

    let polygonCoords: {lat: number, lng: number}[] = [];
    if (typeof pendingLayer.getLatLngs === 'function') {
      let rawCoords = pendingLayer.getLatLngs();
      if (Array.isArray(rawCoords[0])) rawCoords = rawCoords[0];
      polygonCoords = rawCoords.map((c: any) => ({ lat: c.lat, lng: c.lng }));
    }

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      name: formData.name,
      area: Number((formData.areaM2 / 10000).toFixed(2)), // Convertendo m2 para Hectares
      cropType: formData.cropType,
      coordinates: { lat: center.lat, lng: center.lng },
      polygonCoords: polygonCoords.length > 0 ? polygonCoords : undefined,
      physical: formData.physical,
      soilFertility: formData.soilFertility,
      soilHistory: [formData.soilFertility],
      cropHistory: formData.cropHistory,
      management: formData.management,
      climate: formData.climate,
      economic: {
        ...formData.economic,
        profitability: Number(currentProfitability)
      }
    };

    await dataStore.addProperty(formData.producerId, newProperty);
    setShowForm(false);
    pendingLayer.bindTooltip(formData.name, { permanent: true, direction: 'center', className: 'bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-lg border-none' });
    alert("Talhão configurado com sucesso!");
  };

  const STEPS = [
    { id: 1, label: 'Físico', icon: MapIcon },
    { id: 2, label: 'Solo', icon: Beaker },
    { id: 3, label: 'Ciclo', icon: Leaf },
    { id: 4, label: 'Financeiro', icon: TrendingUp }
  ];

  return (
    <div className="relative -mx-4 -mt-4 h-[calc(100vh-140px)] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapContainer} className="w-full h-full" />
      <button 
        onClick={handleLocateMe} 
        disabled={isLocating}
        className="absolute top-4 left-14 z-[1000] bg-white p-3 rounded-2xl shadow-xl text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
      >
        {isLocating ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
      </button>

      {showForm && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-3xl sm:rounded-[48px] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-3">
                 <div className="p-2 sm:p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Activity size={20} className="sm:w-6 sm:h-6" /></div>
                 <div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tighter">Configuração do Talhão</h3>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Criação Estratégica</p>
                 </div>
               </div>
               <button 
                onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }} 
                className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
               >
                 <X size={20}/>
               </button>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="flex px-4 sm:px-8 py-3 bg-gray-50 border-b border-gray-100 items-center justify-between overflow-x-auto scrollbar-hide shrink-0">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = formStep === step.id;
                const isCompleted = formStep > step.id;
                return (
                  <div key={step.id} className="flex items-center group">
                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                       <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                         isActive ? 'bg-emerald-600 text-white shadow-lg scale-110' : 
                         isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-300 border border-gray-100'
                       }`}>
                         {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                       </div>
                       <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                         {step.label}
                       </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="w-6 sm:w-12 h-0.5 mx-1 bg-gray-200 rounded-full">
                         <div className={`h-full bg-emerald-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar bg-white">
              {formStep === 1 && (
                <div className="animate-in slide-in-from-right duration-300 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Talhão</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Talhão Norte"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                          />
                       </div>

                       <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cultura Principal</label>
                             <button 
                              onClick={() => setIsAddingNewCrop(!isAddingNewCrop)}
                              className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"
                             >
                               {isAddingNewCrop ? 'Voltar' : 'Nova +'}
                             </button>
                          </div>
                          {!isAddingNewCrop ? (
                            <select 
                              value={formData.cropType} 
                              onChange={e => setFormData({...formData, cropType: e.target.value})} 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            >
                              <option value="" disabled>Cultura...</option>
                              {availableCrops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                            </select>
                          ) : (
                            <div className="flex gap-2">
                               <input 
                                type="text" 
                                value={newCropName} 
                                onChange={e => setNewCropName(e.target.value)} 
                                placeholder="Nova cultura"
                                className="flex-1 bg-white border border-emerald-100 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none" 
                               />
                               <button 
                                onClick={handleAddNewCrop}
                                disabled={isCropsLoading || !newCropName.trim()}
                                className="bg-emerald-600 text-white px-4 rounded-2xl font-black text-[9px] uppercase shadow-lg disabled:opacity-50"
                               >
                                 {isCropsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                               </button>
                            </div>
                          )}
                       </div>

                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Produtor</label>
                          <select 
                            value={formData.producerId} 
                            onChange={e => setFormData({...formData, producerId: e.target.value})} 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none"
                          >
                            {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100 border-dashed flex flex-col items-center justify-center text-center">
                       <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-2">Área Mapeada</p>
                       <div className="flex items-baseline gap-1">
                          <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">{(formData.areaM2 / 10000).toFixed(2)}</p>
                          <p className="text-xl font-black text-emerald-600">ha</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="animate-in slide-in-from-right duration-300 space-y-6">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">pH</label>
                        <input type="number" step="0.1" value={formData.soilFertility.ph} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, ph: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">MO (%)</label>
                        <input type="number" step="0.1" value={formData.soilFertility.organicMatter} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, organicMatter: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">V%</label>
                        <input type="number" value={formData.soilFertility.vPercentage} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, vPercentage: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 text-sm font-black text-emerald-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">P (mg)</label>
                        <input type="number" value={formData.soilFertility.phosphorus} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, phosphorus: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">K (cmolc)</label>
                        <input type="number" step="0.01" value={formData.soilFertility.potassium} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, potassium: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CTC</label>
                        <input type="number" step="0.1" value={formData.soilFertility.ctc} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, ctc: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                   </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="animate-in slide-in-from-right duration-300 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Safra</label>
                        <input type="text" value={formData.cropHistory.safra} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, safra: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Variedade</label>
                        <input type="text" value={formData.cropHistory.variety} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, variety: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">População (pl/ha)</label>
                        <input type="number" value={formData.cropHistory.plantPopulation} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, plantPopulation: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Sistema</label>
                        <select value={formData.cropHistory.plantingSystem} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, plantingSystem: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-bold">
                           <option value="Plantio Direto">Plantio Direto</option>
                           <option value="Convencional">Convencional</option>
                           <option value="Cultivo Mínimo">Cultivo Mínimo</option>
                        </select>
                      </div>
                   </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="animate-in slide-in-from-right duration-300 space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Insumos (R$/ha)</label>
                        <input type="number" value={formData.economic.inputCost} onChange={e => setFormData({...formData, economic: {...formData.economic, inputCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-black" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Operacional (R$/ha)</label>
                        <input type="number" value={formData.economic.operationalCost} onChange={e => setFormData({...formData, economic: {...formData.economic, operationalCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-black" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Receita Esperada (R$/ha)</label>
                        <input type="number" value={formData.economic.estimatedRevenue} onChange={e => setFormData({...formData, economic: {...formData.economic, estimatedRevenue: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 text-xl sm:text-2xl font-black text-emerald-900 outline-none" />
                      </div>
                   </div>
                   <div className="bg-gray-900 p-4 sm:p-6 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-center shadow-xl gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Margem Bruta / ha</p>
                        <h5 className="text-xl sm:text-2xl font-black text-emerald-400">R$ {projectedMargin.toLocaleString('pt-BR')}</h5>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Lucratividade (ROI)</p>
                        <h5 className="text-xl sm:text-2xl font-black">{currentProfitability}%</h5>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 sm:p-8 border-t border-gray-100 bg-white shrink-0">
               <div className="flex flex-col sm:flex-row gap-3 items-center">
                 <div className="flex w-full sm:w-auto gap-2">
                   <button 
                    onClick={() => setFormStep(prev => Math.max(1, prev - 1))}
                    disabled={formStep === 1}
                    className="flex-1 sm:flex-none px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-gray-100 disabled:opacity-30 transition-all"
                   >
                     <ChevronLeft size={16} /> Voltar
                   </button>
                   {formStep < STEPS.length ? (
                     <button 
                      onClick={() => setFormStep(prev => prev + 1)}
                      disabled={formStep === 1 && (!formData.name || !formData.cropType || !formData.producerId)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-xl hover:bg-emerald-600 disabled:opacity-30 active:scale-95 transition-all"
                     >
                       Próximo <ChevronRight size={16} />
                     </button>
                   ) : (
                     <button 
                      onClick={handleConfirm}
                      className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                     >
                       Finalizar <Check size={16} />
                     </button>
                   )}
                 </div>
                 
                 <div className="hidden sm:block ml-auto text-center">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Passo {formStep} de {STEPS.length}</p>
                 </div>

                 <button 
                  onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }}
                  className="w-full sm:w-auto px-4 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
                 >
                   Cancelar
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
