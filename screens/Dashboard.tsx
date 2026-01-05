
import React, { useState, useEffect } from 'react';
import { Sun, CloudRain, Thermometer, Wind, Droplets, ArrowRight, CheckCircle2, Clock, MapPin, Loader2, Cloud, Navigation } from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { Link } from 'react-router-dom';
import { getCurrentLocation, fetchWeather } from '../services/weatherService';
import { WeatherData } from '../types';
import AgentMap from '../components/AgentMap';

const Dashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingVisits = dataStore.getVisits().filter(v => v.status === 'pending');
  const producers = dataStore.getProducers();

  useEffect(() => {
    const loadRealTimeData = async () => {
      try {
        setLoadingWeather(true);
        const position = await getCurrentLocation();
        const data = await fetchWeather(position.coords.latitude, position.coords.longitude);
        setWeather(data);
      } catch (err) {
        console.error("Falha ao carregar clima:", err);
        setError("Não foi possível carregar o clima atual.");
      } finally {
        setLoadingWeather(false);
      }
    };
    loadRealTimeData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Widget de Clima */}
      <section className="bg-gradient-to-br from-white to-gray-50 rounded-[32px] p-6 shadow-sm border border-white min-h-[140px] flex flex-col justify-center">
        {loadingWeather ? (
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Detectando clima...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        ) : weather ? (
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin size={14} className="text-emerald-500" />
                <h2 className="text-sm font-medium">{weather.location}</h2>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-bold text-gray-900">{weather.temp}°C</span>
                <CloudRain className="text-sky-400" size={32} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 p-2 rounded-xl text-center border border-white/40">
                <Wind size={16} className="text-gray-400 mx-auto" />
                <p className="text-[10px] font-bold">{weather.windSpeed} km/h</p>
              </div>
              <div className="bg-white/50 p-2 rounded-xl text-center border border-white/40">
                <Droplets size={16} className="text-sky-400 mx-auto" />
                <p className="text-[10px] font-bold">{weather.humidity}%</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100">
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-xs text-gray-500">Visitas Realizadas</p>
        </div>
        <div className="bg-sky-50 rounded-3xl p-5 border border-sky-100">
          <p className="text-3xl font-bold text-gray-900">{pendingVisits.length}</p>
          <p className="text-xs text-gray-500">Agendadas</p>
        </div>
      </section>

      {/* Monitoramento */}
      <section className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 h-[300px] relative overflow-hidden">
        <AgentMap />
      </section>

      {/* Próximas Tarefas */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Próximas Visitas</h3>
        {pendingVisits.map((visit) => {
          const producer = producers.find(p => p.id === visit.producerId);
          const property = producer?.properties.find(prop => prop.id === visit.propertyId);
          return (
            <Link key={visit.id} to={`/visit-session/${visit.id}`} className="block bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-900">{producer?.name}</h4>
              <p className="text-sm text-gray-500">{property?.name || 'Localização não definida'}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
};

export default Dashboard;
