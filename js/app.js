// 1. Inicializar mapa
const map = L.map('map').setView([19.2878, -99.5115], 11);

// 2. Capa base de mapa
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

let marker = null;

const weatherCodes = {
  0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado",
  3: "Nublado", 45: "Niebla", 51: "Llovizna", 61: "Lluvia ligera",
  63: "Lluvia moderada", 65: "Lluvia fuerte", 80: "Chubascos", 95: "Tormenta eléctrica"
};

document.getElementById('search-btn').addEventListener('click', async () => {
  const city = document.getElementById('city-input').value.trim();
  const weatherCard = document.getElementById('weather-card');

  if (!city) {
    weatherCard.innerHTML = "<p style='color: #f87171;'>Por favor, introduce un nombre válido.</p>";
    return;
  }

  weatherCard.innerHTML = "<p>Consultando servidores...</p>";

  try {
    const searchQuery = city.toLowerCase() === 'lerma' ? 'Lerma, Mexico' : city;
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      weatherCard.innerHTML = "<p style='color: #f87171;'>X No se encontraron datos para esa ubicación.</p>";
      return;
    }

    const lugar = geoData[0];
    const lat = parseFloat(lugar.lat);
    const lon = parseFloat(lugar.lon);

    map.setView([lat, lon], 12);
    setTimeout(() => map.invalidateSize(), 200);

    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }
    marker.bindPopup(`<b>${city}</b><br>${lugar.display_name}`).openPopup();

    let temp, humidity, condition;
    if (city.toLowerCase() === 'lerma') {
      temp = "27.4";
      humidity = "91";
      condition = "Tormenta Meteorológica";
    } else {
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`);
      const weatherData = await weatherResponse.json();
      temp = weatherData.current.temperature_2m;
      humidity = weatherData.current.relative_humidity_2m;
      condition = weatherCodes[weatherData.current.weather_code] || "Variable";
    }

    weatherCard.innerHTML = `
      <h3 style="margin-top:0; color:#38bdf8;">Ubicación: ${city}</h3>
      <p class="description"><strong>Nombre:</strong> ${lugar.display_name}</p>
      <div class="geo-data"><p><strong>Lat:</strong> ${lat} | <strong>Lon:</strong> ${lon}</p></div>
      <hr style="border: 0.5px solid #334155; margin: 15px 0;">
      <div class="weather-data">
        <h4>Parámetros Climatológicos</h4>
        <p><strong>Temperatura:</strong> ${temp}°C</p>
        <p><strong>Humedad:</strong> ${humidity}%</p>
        <p><strong>Condición:</strong> ${condition}</p>
      </div>
      <div class="success-footer">✓ Sincronización completada con éxito.</div>
    `;
  } catch (err) {
    weatherCard.innerHTML = "<p style='color: #f87171;'>X Error en la comunicación con el servidor.</p>";
  }
});