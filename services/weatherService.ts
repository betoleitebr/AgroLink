
import { WeatherData } from '../types';

export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // 1. Fetch Weather Data from Open-Meteo (Free, no key required)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    // 2. Fetch City Name from Nominatim (Reverse Geocoding)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const geoData = await geoRes.json();
    const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || "Localização Atual";

    // Map weather codes to simple descriptions
    // Full codes: https://open-meteo.com/en/docs
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
    console.error("Error fetching weather:", error);
    throw error;
  }
};
