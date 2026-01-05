
import React, { useEffect, useRef, useState } from 'react';
import { 
  Maximize, X, Ruler, Calendar, ArrowUpRight, Save, Trash2, Edit3, Check, 
  ChevronDown, User, Leaf, Activity, Beaker, Cloud, TrendingUp, ShieldCheck, 
  Map as MapIcon, Loader2, Info, Thermometer, Wind, Droplets, LayoutGrid,
  ArrowRight, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { dataStore } from '../services/dataStore';
import { getCurrentLocation } from '../services/weatherService';
import { Property } from '../types';

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [activeTab, setActiveTab] = useState<'fisico' | 'solo' | 'cultura' | 'manejo' | 'clima' | 'economico'>('fisico');
  const [pendingLayer, setPendingLayer] = useState<any>(null);

  const producers = dataStore.getProducers();
  const activeProperty = producers.flatMap(p => p.properties).find(prop => prop.id === activeFieldId);
  const activeProducer = producers.find(p => p.properties.some(prop => prop.id === activeFieldId));

  const [formData, setFormData] = useState<any>({
    name: '',
    producerId: producers[0]?.id || '',
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
      analysisDate: '',
      ph: 6.2,
      organicMatter: 3.5,
      phosphorus: 12,
      potassium: 0.45,
      calcium: 4.5,
      magnesium: 1.2,
      sulfur: 8,
      ctc: 12,
      vPercentage: 65,
      micronutrients: '',
      recommendations: ''
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
      operator: 'João Silva'
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

  /**
   * Calcula a área de um polígono em metros quadrados usando a fórmula de área esférica.
   * Ajustado para converter corretamente todos os componentes de graus para radianos.
   */
  const calculateArea = (layer: any): number => {
    if (!layer || typeof layer.getLatLngs !== 'function') return 0;
    let latlngs = layer.getLatLngs();
    
    // GeoMan/Leaflet podem retornar arrays aninhados para polígonos
    if (Array.isArray(latlngs[0])) latlngs = latlngs[0];
    if (!latlngs || latlngs.length < 3) return 0;
    
    let area = 0;
    const radius = 6378137; // Raio da Terra em metros
    const degToRad = Math.PI / 180;

    for (let i = 0; i < latlngs.length; i++) {
      const p1 = latlngs[i];
      const p2 = latlngs[(i + 1) % latlngs.length];
      
      // Diferença de longitude convertida para radianos
      const dLon = (p2.lng - p1.lng) * degToRad;
      
      // Soma dos senos das latitudes
      area += dLon * (2 + Math.sin(p1.lat * degToRad) + Math.sin(p2.lat * degToRad));
    }
    
    // Multiplica pelo quadrado do raio e divide por 2 para obter m²
    return Math.abs(area * radius * radius / 2.0);
  };

  const fetchAutoData = async (lat: number, lng: number) => {
    setIsAutoFilling(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        physical: {
          ...prev.physical,
          altitude: Math.round(data.elevation[0]),
          declivity: data.elevation[0] > 800 ? 'Ondulado' : 'Suave Ondulado'
        }
      }));
    } catch (e) {
      console.error("Erro auto-fill", e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-15.7801, -47.9292], 4);

    mapInstance.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(map);

    dataStore.getProducers().forEach(producer => {
      producer.properties.forEach(prop => {
        if (prop.polygonCoords && prop.polygonCoords.length > 0) {
          const poly = L.polygon(prop.polygonCoords.map(c => [c.lat, c.lng]), {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.3,
            weight: 3
          }).addTo(map);

          poly.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setActiveFieldId(prop.id);
          });

          poly.bindTooltip(prop.name, {
            permanent: true,
            direction: 'center',
            className: 'bg-emerald-600 border-none text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-lg opacity-90'
          }).openTooltip();

        } else {
          L.circleMarker([prop.coordinates.lat, prop.coordinates.lng], {
            radius: 10,
            fillColor: '#10b981',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map).on('click', () => setActiveFieldId(prop.id));
        }
      });
    });

    map.pm.addControls({
      position: 'topleft',
      drawRectangle: true,
      drawPolygon: true,
      editMode: true,
      removalMode: true,
    });

    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      const areaM2 = calculateArea(layer);
      let center;
      if (typeof layer.getBounds === 'function') center = layer.getBounds().getCenter();
      else if (typeof layer.getLatLng === 'function') center = layer.getLatLng();

      setPendingLayer(layer);
      setFormData(prev => ({ ...prev, areaM2 }));
      setShowForm(true);
      if (center) fetchAutoData(center.lat, center.lng);
      
      // Correção do erro: verifica se setStyle existe (Polígonos possuem, Marcadores simples não)
      if (layer.setStyle) {
        layer.setStyle({ fillColor: '#10b981', fillOpacity: 0.3, color: '#10b981', weight: 3 });
      }
    });

    getCurrentLocation().then(pos => map.setView([pos.coords.latitude, pos.coords.longitude], 14));

    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  const handleConfirm = () => {
    if (!formData.name) return alert("Dê um nome ao talhão");
    
    let center = { lat: 0, lng: 0 };
    if (pendingLayer.getBounds) center = pendingLayer.getBounds().getCenter();
    else if (pendingLayer.getLatLng) center = pendingLayer.getLatLng();

    let rawCoords = pendingLayer.getLatLngs();
    if (Array.isArray(rawCoords[0])) rawCoords = rawCoords[0];
    const polygonCoords = rawCoords.map((c: any) => ({ lat: c.lat, lng: c.lng }));

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      name: formData.name,
      area: Number((formData.areaM2 / 10000).toFixed(2)),
      cropType: formData.cropType,
      coordinates: { lat: center.lat, lng: center.lng },
      polygonCoords: polygonCoords,
      physical: formData.physical,
      soilFertility: formData.soilFertility,
      cropHistory: formData.cropHistory,
      management: formData.management,
      climate: formData.climate,
      economic: formData.economic
    };

    dataStore.addProperty(formData.producerId, newProperty);
    
    setShowForm(false);
    pendingLayer.bindPopup(`<b>${formData.name}</b><br>${formData.cropType}`).openPopup();
    
    pendingLayer.bindTooltip(formData.name, {
      permanent: true,
      direction: 'center',
      className: 'bg-emerald-600 border-none text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-lg'
    }).openTooltip();

    alert("Talhão salvo com sucesso e vinculado ao cliente!");
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
    <div className="relative -mx-4 -mt-4 h-[calc(100vh-140px)] rounded-[32px] overflow-hidden shadow-2xl border border-white">
      <div ref={mapContainer} className="w-full h-full" />

      {showForm && (
        <div className="absolute inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-t-[40px] sm:rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Configuração Técnica do Talhão</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">{formData.name || 'Novo Talhão'}</p>
                </div>
              </div>
              <button onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }} className="p-2 bg-white rounded-full border border-gray-100"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
              <TabButton id="fisico" label="Físico" icon={MapIcon} />
              <TabButton id="solo" label="Solo" icon={Beaker} />
              <TabButton id="cultura" label="Histórico" icon={Leaf} />
              <TabButton id="manejo" label="Manejo" icon={ShieldCheck} />
              <TabButton id="clima" label="Clima" icon={Cloud} />
              <TabButton id="economico" label="Finanças" icon={TrendingUp} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'fisico' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Nome do Talhão</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Cultura Principal</label>
                      <select value={formData.cropType} onChange={e => setFormData({...formData, cropType: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">
                        <option>Soja</option><option>Milho</option><option>Algodão</option><option>Café</option><option>Pasto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Vincular Cliente</label>
                      <select value={formData.producerId} onChange={e => setFormData({...formData, producerId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">
                        {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-center">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Área Calculada</p>
                        <p className="font-bold text-gray-900">{(formData.areaM2 / 10000).toFixed(2)} ha</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Altitude</p>
                        <p className="font-bold text-gray-900">{formData.physical.altitude} m</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Textura Solo</label>
                        <select value={formData.physical.texture} onChange={e => setFormData({...formData, physical: {...formData.physical, texture: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none font-bold">
                          <option value="Argilosa">Argilosa</option>
                          <option value="Arenosa">Arenosa</option>
                          <option value="Média">Média</option>
                          <option value="Siltosa">Siltosa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Drenagem</label>
                        <select value={formData.physical.drainage} onChange={e => setFormData({...formData, physical: {...formData.physical, drainage: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">
                          <option value="Boa">Boa</option>
                          <option value="Média">Média</option>
                          <option value="Ruim">Ruim</option>
                          <option value="Excessiva">Excessiva</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Classificação do Solo</label>
                      <input type="text" value={formData.physical.soilType} onChange={e => setFormData({...formData, physical: {...formData.physical, soilType: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="Ex: Latossolo Vermelho" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'solo' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">pH (H2O)</label>
                      <input type="number" step="0.1" value={formData.soilFertility.ph} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, ph: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Mat. Orgânica (%)</label>
                      <input type="number" step="0.1" value={formData.soilFertility.organicMatter} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, organicMatter: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Fósforo (P)</label>
                      <input type="number" value={formData.soilFertility.phosphorus} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, phosphorus: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Saturação Bases (V%)</label>
                      <input type="number" value={formData.soilFertility.vPercentage} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, vPercentage: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">CTC</label>
                      <input type="number" value={formData.soilFertility.ctc} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, ctc: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Data Análise</label>
                      <input type="date" value={formData.soilFertility.analysisDate} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, analysisDate: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Micronutrientes / Notas</label>
                      <textarea value={formData.soilFertility.micronutrients} onChange={e => setFormData({...formData, soilFertility: {...formData.soilFertility, micronutrients: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm h-32 outline-none resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cultura' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Safra Vigente</label>
                      <input type="text" value={formData.cropHistory.safra} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, safra: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Variedade / Híbrido</label>
                      <input type="text" value={formData.cropHistory.variety} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, variety: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sistema de Plantio</label>
                      <select value={formData.cropHistory.plantingSystem} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, plantingSystem: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">
                        <option>Plantio Direto</option><option>Convencional</option><option>Mínimo</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Data Plantio</label>
                        <input type="date" value={formData.cropHistory.plantingDate} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, plantingDate: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Data Colheita Prev.</label>
                        <input type="date" value={formData.cropHistory.harvestDate} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, harvestDate: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">População (pl/ha)</label>
                      <input type="number" value={formData.cropHistory.plantPopulation} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, plantPopulation: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Espaçamento (m)</label>
                      <input type="text" value={formData.cropHistory.spacing} onChange={e => setFormData({...formData, cropHistory: {...formData.cropHistory, spacing: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'manejo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                   <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Preparo de Solo</label>
                      <input type="text" value={formData.management.soilPrep} onChange={e => setFormData({...formData, management: {...formData.management, soilPrep: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Adubação Programada</label>
                      <textarea value={formData.management.fertilization} onChange={e => setFormData({...formData, management: {...formData.management, fertilization: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm h-24 outline-none resize-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Sistema de Irrigação</label>
                      <select value={formData.management.irrigation} onChange={e => setFormData({...formData, management: {...formData.management, irrigation: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none">
                        <option>Sequeiro</option><option>Pivô Central</option><option>Gotejamento</option><option>Aspersão</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Operador Responsável</label>
                      <input type="text" value={formData.management.operator} onChange={e => setFormData({...formData, management: {...formData.management, operator: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'clima' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                  <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex items-center gap-4">
                    <Droplets className="text-sky-500" size={32} />
                    <div>
                      <p className="text-[10px] text-sky-600 font-bold uppercase">Risco Climático</p>
                      <select value={formData.climate.climateRisk} onChange={e => setFormData({...formData, climate: {...formData.climate, climateRisk: e.target.value}})} className="bg-transparent font-bold text-sky-900 border-none p-0 outline-none">
                        <option>Baixo</option><option>Médio</option><option>Alto</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center gap-4">
                    <Thermometer className="text-orange-500" size={32} />
                    <div>
                      <p className="text-[10px] text-orange-600 font-bold uppercase">Temp. Média Programada</p>
                      <input type="number" value={formData.climate.avgTemp} onChange={e => setFormData({...formData, climate: {...formData.climate, avgTemp: Number(e.target.value)}})} className="bg-transparent font-bold text-orange-900 border-none p-0 outline-none w-16" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Eventos Climáticos Extremos (Histórico)</label>
                    <textarea value={formData.climate.extremeEvents} onChange={e => setFormData({...formData, climate: {...formData.climate, extremeEvents: e.target.value}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm h-24 outline-none resize-none" />
                  </div>
                </div>
              )}

              {activeTab === 'economico' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                   <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Custo Insumos (R$/ha)</label>
                      <input type="number" value={formData.economic.inputCost} onChange={e => setFormData({...formData, economic: {...formData.economic, inputCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Custo Operacional (R$/ha)</label>
                      <input type="number" value={formData.economic.operationalCost} onChange={e => setFormData({...formData, economic: {...formData.economic, operationalCost: Number(e.target.value)}})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-gray-900 p-6 rounded-[32px] text-white space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Receita Estimada (R$/ha)</p>
                      <input type="number" value={formData.economic.estimatedRevenue} onChange={e => setFormData({...formData, economic: {...formData.economic, estimatedRevenue: Number(e.target.value)}})} className="bg-transparent border-none p-0 text-2xl font-bold text-emerald-400 outline-none w-full" />
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Margem Bruta Projetada</p>
                      <p className="text-xl font-bold">R$ {formData.economic.estimatedRevenue - (formData.economic.inputCost + formData.economic.operationalCost)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={() => { if (pendingLayer && mapInstance.current) mapInstance.current.removeLayer(pendingLayer); setShowForm(false); }} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-3xl font-bold text-sm">Descartar</button>
              <button onClick={handleConfirm} className="flex-[2] py-4 bg-gray-900 text-white rounded-3xl font-bold text-sm shadow-xl flex items-center justify-center gap-2">
                <Check size={18} /> Salvar e Vincular Talhão
              </button>
            </div>
          </div>
        </div>
      )}

      {activeProperty && !showForm && (
        <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:top-24 lg:w-96 z-[1000] animate-in slide-in-from-right duration-300">
          <div className="bg-white rounded-[40px] p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">{activeProperty.cropType}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{activeProperty.name}</h3>
                <p className="text-xs text-gray-500 font-medium uppercase mt-1">{activeProducer?.name}</p>
              </div>
              <button onClick={() => setActiveFieldId(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>
            <button onClick={() => navigate(`/field/${activeProperty.id}`)} className="w-full bg-gray-900 text-white py-4 rounded-3xl text-sm font-bold flex items-center justify-center gap-2">Painel de Controle <ArrowUpRight size={16}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
