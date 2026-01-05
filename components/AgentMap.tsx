
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { getCurrentLocation } from '../services/weatherService';
import { MOCK_PRODUCERS } from '../constants';

const AgentMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const agentMarker = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Inicializa o mapa focado no centro do Brasil ou localização inicial
    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-15.7801, -47.9292], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // Adiciona as propriedades dos produtores ao mapa
    MOCK_PRODUCERS.forEach(producer => {
      producer.properties.forEach(prop => {
        const marker = L.circleMarker([prop.coordinates.lat, prop.coordinates.lng], {
          radius: 8,
          fillColor: '#10b981',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(leafletMap.current!);
        
        marker.bindPopup(`<b>${producer.name}</b><br>${prop.name} (${prop.cropType})`);
      });
    });

    // Tenta obter a localização real
    const trackLocation = async () => {
      try {
        const position = await getCurrentLocation();
        const { latitude, longitude } = position.coords;
        setCoords([latitude, longitude]);

        if (leafletMap.current) {
          leafletMap.current.setView([latitude, longitude], 13);
          
          // Ícone personalizado para o Consultor (Agente)
          const agentIcon = L.divIcon({
            className: 'custom-agent-icon',
            html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg animate-pulse">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          agentMarker.current = L.marker([latitude, longitude], { icon: agentIcon })
            .addTo(leafletMap.current)
            .bindPopup('Você está aqui (Consultor de Campo)');
        }
      } catch (err) {
        console.error("Erro ao rastrear localização para o mapa:", err);
      }
    };

    trackLocation();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-[24px] overflow-hidden" />
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={() => {
            if (coords && leafletMap.current) {
              leafletMap.current.flyTo(coords, 15);
            }
          }}
          className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          title="Minha Localização"
        >
          <Navigation size={20} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default AgentMap;
