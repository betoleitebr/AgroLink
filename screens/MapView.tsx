
import React, { useEffect, useRef, useState } from 'react';
import { 
  Maximize, X, Ruler, Calendar, ArrowUpRight, Save, Trash2, Edit3, Check, 
  ChevronDown, User, Leaf, Activity, Beaker, Cloud, TrendingUp, ShieldCheck, 
  Map as MapIcon, Loader2, Info, Thermometer, Wind, Droplets, LayoutGrid,
  ArrowRight, Target, Plus, Navigation, Layers
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
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<'fisico' | 'solo' | 'cultura' | 'manejo' | 'clima' | 'economico'>('fisico');
  const [pendingLayer, setPendingLayer] = useState<any>(null);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [isAddingNewCrop, setIsAddingNewCrop] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [isLoadingCrops, setIsLoadingCrops] = useState(false);
  
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

  const activeProperty = producers.flatMap(p => p.properties).find(prop => prop.id === activeFieldId);
  const activeProducer = producers.find(p => p.properties.some(prop => prop.id === activeFieldId));

  const [formData, setFormData] = useState<any>({
    name: '',
    producerId: '',
    cropType: 'Soja',
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
      profitability: 52
    }
  });

  useEffect(() => {
    if (producers.length > 0 && !formData.producerId) {
      setFormData(prev => ({ ...prev, producerId: producers[0].id }));
    }
  }, [producers]);

  const calculateArea = (layer: any): number => {
    if (!layer) return 0;
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
            poly.on('click', () => setActiveFieldId(prop.id));
            poly.bindTooltip(prop.name, { permanent: true, direction: 'center', className: 'bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded' });
          }
        });
      });
    };
    initMapData();

    map.pm.addControls({ position: 'topleft', drawRectangle: true, drawPolygon: true, editMode: true, removalMode: true });
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      setPendingLayer(layer);
      setFormData(prev => ({ ...prev, areaM2: calculateArea(layer) }));
      setShowForm(true);
    });
  }, []);

  const handleConfirm = async () => {
    if (!formData.name) return alert("Dê um nome ao talhão");
    let center = { lat: 0, lng: 0 };
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
      area: Number((formData.areaM2 / 10000).toFixed(2)),
      cropType: formData.cropType,
      coordinates: { lat: center.lat, lng: center.lng },
      polygonCoords: polygonCoords.length > 0 ? polygonCoords : undefined,
      physical: formData.physical,
      soilFertility: formData.soilFertility,
      soilHistory: [formData.soilFertility],
      cropHistory: formData.cropHistory,
      management: formData.management,
      climate: formData.climate,
      economic: formData.economic
    };

    await dataStore.addProperty(formData.producerId, newProperty);
    setShowForm(false);
    pendingLayer.bindTooltip(formData.name, { permanent: true, direction: 'center', className: 'bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded' });
    alert("Talhão configurado!");
  };

  const TabButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border-2 ${
        activeTab === id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'
      }`}
    >
      <Icon size={18} />
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="relative -mx-4 -mt-4 h-[calc(100vh-140px)] rounded-[32px] overflow-hidden shadow-2xl">
      <div ref={mapContainer} className="w-full h-full" />
      <button onClick={handleLocateMe} className="absolute top-4 left-14 z-[1000] bg-white p-3 rounded-2xl shadow-xl text-emerald-600"><Navigation size={20} /></button>

      {showForm && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Activity size={24} /></div>
                 <div><h3 className="text-xl font-bold text-gray-900">Configuração Inicial do Talhão</h3><p className="text-[10px] text-emerald-600 font-bold uppercase">Criação Estratégica</p></div>
               </div>
               <button onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }} className="p-2 hover:bg-white rounded-full"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
              <TabButton id="fisico" label="Físico" icon={MapIcon} />
              <TabButton id="solo" label="Solo" icon={Beaker} />
              <TabButton id="cultura" label="Ciclo" icon={Leaf} />
              <TabButton id="economico" label="Financeiro" icon={TrendingUp} />
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {activeTab === 'fisico' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Talhão</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cultura Principal</label><select value={formData.cropType} onChange={e => setFormData({...formData, cropType: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">{availableCrops.map(crop => <option key={crop} value={crop}>{crop}</option>)}</select></div>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 text-center"><p className="text-[10px] text-emerald-600 font-bold uppercase mb-2">Área Mapeada</p><p className="text-3xl font-black text-gray-900">{(formData.areaM2 / 10000).toFixed(2)} <span className="text-lg">ha</span></p></div>
                </div>
              )}

              {activeTab === 'solo' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">pH</label><input type="number" step="0.1" value={formData.soilFertility.ph} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, ph: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mat. Orgânica (%)</label><input type="number" step="0.1" value={formData.soilFertility.organicMatter} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, organicMatter: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">V% (Alvo)</label><input type="number" value={formData.soilFertility.vPercentage} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, vPercentage: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-bold" /></div>
                </div>
              )}

              {activeTab === 'cultura' && (
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Safra</label><input type="text" value={formData.cropHistory.safra} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, safra: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Variedade</label><input type="text" value={formData.cropHistory.variety} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, variety: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm" /></div>
                </div>
              )}

              {activeTab === 'economico' && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Investimento Insumos (R$/ha)</label><input type="number" value={formData.economic.inputCost} onChange={e => setFormData({...formData, economic: {...formData.economic, inputCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Receita Esperada (R$/ha)</label><input type="number" value={formData.economic.estimatedRevenue} onChange={e => setFormData({...formData, economic: {...formData.economic, estimatedRevenue: Number(e.target.value)}})} className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-black text-emerald-900" /></div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-gray-100 flex gap-4">
               <button onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-3xl font-bold uppercase text-xs">Cancelar</button>
               <button onClick={handleConfirm} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">Salvar Talhão com Dados Iniciais</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
