
import { WeatherData } from '../types';

/**
 * Gets the current user location with a fallback strategy.
 * First tries high accuracy, then falls back to standard accuracy if it fails.
 */
export const getCurrentLocation = (highAccuracy = true): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador.'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 8000 : 15000,
      maximumAge: 60000 // Accept a cached position from the last minute
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      async (error) => {
        // If high accuracy failed, try one more time without it
        if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
          console.warn("High accuracy geolocation failed, trying standard accuracy...");
          try {
            const fallbackPos = await getCurrentLocation(false);
            resolve(fallbackPos);
          } catch (fallbackError) {
            reject(fallbackError);
          }
          return;
        }

        let message = 'Erro desconhecido ao obter localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada pelo usuário.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Informações de localização indisponíveis (GPS/Network).';
            break;
          case error.TIMEOUT:
            message = 'Tempo limite esgotado ao tentar obter localização.';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  let city = "Localização Atual";
  
  // 1. Tenta obter o nome da cidade (Nominatim)
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { 
        headers: { 
          'Accept-Language': 'pt-BR'
        } 
      }
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || "Localização Detectada";
    }
  } catch (error) {
    console.warn("Aviso: Nominatim indisponível. Usando nome genérico.");
  }

  // 2. Busca dados meteorológicos do Open-Meteo
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    
    if (!weatherRes.ok) throw new Error(`Falha no serviço de clima (Status ${weatherRes.status})`);
    
    const weatherData = await weatherRes.json();

    const codeMap: Record<number, string> = {
      0: "Céu limpo",
      1: "Principalmente limpo",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Nevoeiro", 48: "Nevoeiro com geada",
      51: "Garoa leve", 53: "Garoa moderada", 55: "Garoa densa",
      61: "Chuva leve", 63: "Chuva moderada", 65: "Chuva forte",
      80: "Pancadas de chuva leves", 81: "Pancadas de chuva moderadas", 82: "Pancadas de chuva violentas",
      95: "Trovoada",
    };

    return {
      location: city,
      temp: Math.round(weatherData.current.temperature_2m),
      condition: codeMap[weatherData.current.weather_code] || "Condições variáveis",
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
    };
  } catch (error) {
    console.error("Erro crítico ao buscar clima:", error);
    throw new Error(error instanceof Error ? error.message : "Não foi possível conectar ao serviço de clima.");
  }
};
