const apiKey = "bde4f47d0672636e06782e9e948d2883";
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city");
const weatherInfo = document.getElementById("weather-info");
const locationElement = document.getElementById("location");
const flagElement = document.getElementById("flag");
const temperatureElement = document.getElementById("temperature");
const feelsLikeElement = document.getElementById("feels-like");
const humidityElement = document.getElementById("humidity");
const windSpeedElement = document.getElementById("wind-speed");
const uvIndexElement = document.getElementById("uv-index");
const iconElement = document.getElementById("icon");
const forecastElement = document.getElementById("forecast");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const unitToggle = document.getElementById("unit-toggle");
const searchHistoryContainer = document.querySelector(".history-buttons");
const favoritesContainer = document.querySelector(".favorites-buttons");
const errorMessage = document.getElementById("error-message");
const loadingIndicator = document.getElementById("loading");
const currentLocationBtn = document.getElementById("current-location-btn");
const addFavoriteBtn = document.getElementById("add-favorite-btn");
const sideCommentElement = document.getElementById("side-comment");
const tipElement = document.getElementById("tip");

let currentUnit = 'metric';
const comments = {
  Clear: ["It's a clear day! Perfect for outdoor activities.", "Enjoy the sunshine!"],
  Clouds: ["It's cloudy today. A perfect day for a cozy indoor activity.", "Overcast skies ahead."],
  Rain: ["Don't forget your umbrella today.", "It's raining outside. Stay dry!"],
  Drizzle: ["Light rain is expected. A good day for a walk with a raincoat.", "Drizzle showers today."],
  Thunderstorm: ["Stay safe during the thunderstorm.", "Thunderstorms in the area. Avoid outdoor activities."],
  Snow: ["It's snowing! Time for some winter fun.", "Snowfall today. Drive safely."],
  Mist: ["Misty conditions today. Drive carefully.", "Low visibility due to mist."]
};

const tips = [
  "Stay hydrated by drinking plenty of water.",
  "Wear sunscreen to protect your skin from UV rays.",
  "Dress in layers to adjust to changing temperatures.",
  "Keep an emergency kit in your car during winter.",
  "Use a humidifier to add moisture to dry indoor air.",
  "Check the weather forecast before planning outdoor activities.",
  "Stay informed about weather alerts in your area."
];

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", darkModeToggle.checked);
  localStorage.setItem("darkMode", darkModeToggle.checked);
});

unitToggle.addEventListener("change", () => {
  currentUnit = unitToggle.checked ? 'imperial' : 'metric';
  const lastCity = localStorage.getItem("lastCity") || '';
  if (lastCity) {
    searchWeather(lastCity);
  }
  localStorage.setItem("unit", currentUnit);
});

document.addEventListener("DOMContentLoaded", () => {
  const darkMode = JSON.parse(localStorage.getItem("darkMode"));
  if (darkMode) {
    darkModeToggle.checked = true;
    document.body.classList.add("dark-mode");
  }
  
  const savedUnit = localStorage.getItem("unit");
  if (savedUnit) {
    currentUnit = savedUnit;
    unitToggle.checked = currentUnit === 'imperial';
  }
  
  renderSearchHistory();
  renderFavorites();
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    searchWeather(city);
  }
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  searchWeather(city);
});

currentLocationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoordinates(latitude, longitude);
    }, error => {
      hideLoading();
      displayError("Unable to retrieve your location.");
    });
  } else {
    displayError("Geolocation is not supported by your browser.");
  }
});

addFavoriteBtn.addEventListener("click", () => {
  const city = locationElement.textContent.replace("Location: ", "").split(",")[0];
  if (city) {
    addFavorite(city);
  }
});

function displayError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("d-none");
}

function showLoading() {
  loadingIndicator.classList.remove("d-none");
}

function hideLoading() {
  loadingIndicator.classList.add("d-none");
}

function addSearchHistory(city) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 10) history.pop();
    localStorage.setItem("searchHistory", JSON.stringify(history));
    renderSearchHistory();
  }
}

function renderSearchHistory() {
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  searchHistoryContainer.innerHTML = history.map(city => `
    <button class="btn btn-history d-flex align-items-center" data-city="${city}">
      ${city}
      <i class="fa-solid fa-times-circle text-danger ms-2"></i>
    </button>
  `).join("");

  document.querySelectorAll(".btn-history").forEach(button => {
    button.addEventListener("click", (e) => {
      if (e.target.classList.contains('fa-times-circle')) {
        removeFromSearchHistory(button.getAttribute("data-city"));
      } else {
        const city = button.getAttribute("data-city");
        cityInput.value = city;
        searchWeather(city);
      }
    });
  });
}

function removeFromSearchHistory(city) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  history = history.filter(item => item !== city);
  localStorage.setItem("searchHistory", JSON.stringify(history));
  renderSearchHistory();
}

function addFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
  }
}

function removeFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(item => item !== city);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favoritesContainer.innerHTML = favorites.map(city => `
    <button class="btn btn-favorite d-flex align-items-center" data-city="${city}">
      ${city}
      <i class="fa-solid fa-trash text-danger ms-2"></i>
    </button>
  `).join("");

  document.querySelectorAll(".btn-favorite").forEach(button => {
    button.addEventListener("click", (e) => {
      if (e.target.classList.contains('fa-trash')) {
        removeFavorite(button.getAttribute("data-city"));
      } else {
        const city = button.getAttribute("data-city");
        cityInput.value = city;
        searchWeather(city);
      }
    });
  });
}

async function searchWeather(city = cityInput.value.trim()) {
  clearError();
  if (!city) {
    displayError("Please enter a city name.");
    return;
  }

  showLoading();
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${apiKey}`;

  try {
    const [currentWeatherResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    const currentWeatherData = await currentWeatherResponse.json();
    const forecastData = await forecastResponse.json();

    if (currentWeatherResponse.ok && forecastResponse.ok) {
      updateCurrentWeather(currentWeatherData);
      updateForecast(forecastData);
      addSearchHistory(currentWeatherData.name);
      localStorage.setItem("lastCity", currentWeatherData.name);
      weatherInfo.classList.remove("d-none");
    } else {
      displayError(currentWeatherData.message || forecastData.message || "Error fetching data.");
    }
  } catch (error) {
    displayError("Error fetching data. Please try again later.");
  } finally {
    hideLoading();
  }
}

async function fetchWeatherByCoordinates(lat, lon) {
  clearError();
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;

  try {
    const [currentWeatherResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    const currentWeatherData = await currentWeatherResponse.json();
    const forecastData = await forecastResponse.json();

    if (currentWeatherResponse.ok && forecastResponse.ok) {
      updateCurrentWeather(currentWeatherData);
      updateForecast(forecastData);
      addSearchHistory(currentWeatherData.name);
      localStorage.setItem("lastCity", currentWeatherData.name);
      weatherInfo.classList.remove("d-none");
    } else {
      displayError(currentWeatherData.message || forecastData.message || "Error fetching data.");
    }
  } catch (error) {
    displayError("Error fetching data. Please try again later.");
  } finally {
    hideLoading();
  }
}

function updateCurrentWeather(data) {
  const countryCode = data.sys.country;
  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
  locationElement.innerHTML = `<i class="fa-solid fa-location-dot"></i> Location: ${data.name}, ${countryCode}`;
  flagElement.innerHTML = `<img src="https://flagcdn.com/w80/${countryCode.toLowerCase()}.png" alt="${countryCode} Flag" class="img-fluid">`;
  temperatureElement.innerHTML = `<i class="fa-solid fa-temperature-high"></i> Temperature: ${data.main.temp}${unitSymbol}`;
  feelsLikeElement.innerHTML = `<i class="fa-solid fa-thermometer"></i> Feels Like: ${data.main.feels_like}${unitSymbol}`;
  humidityElement.innerHTML = `<i class="fa-solid fa-droplet"></i> Humidity: ${data.main.humidity}%`;
  windSpeedElement.innerHTML = `<i class="fa-solid fa-wind"></i> Wind Speed: ${data.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
  iconElement.innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" class="img-fluid">`;

  const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${apiKey}`;
  fetch(uvUrl)
    .then(response => response.json())
    .then(uvData => {
      const uv = uvData.value;
      uvIndexElement.textContent = `UV Index: ${uv}`;
      if (uv < 3) {
        uvIndexElement.className = "uv-low";
      } else if (uv < 6) {
        uvIndexElement.className = "uv-moderate";
      } else if (uv < 8) {
        uvIndexElement.className = "uv-high";
      } else if (uv < 11) {
        uvIndexElement.className = "uv-very-high";
      } else {
        uvIndexElement.className = "uv-extreme";
      }
    })
    .catch(() => {
      uvIndexElement.textContent = "UV Index: N/A";
      uvIndexElement.className = "";
    });

  const weatherMain = data.weather[0].main;
  sideCommentElement.textContent = comments[weatherMain] ? comments[weatherMain][Math.floor(Math.random() * comments[weatherMain].length)] : "";
  tipElement.textContent = tips[Math.floor(Math.random() * tips.length)];
}

function updateForecast(data) {
  forecastElement.innerHTML = "";
  const forecastList = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  forecastList.forEach(forecast => {
    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-card";
    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    forecastCard.innerHTML = `
      <p>${new Date(forecast.dt_txt).toLocaleDateString()}</p>
      <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}" class="img-fluid">
      <p>${forecast.main.temp}${unitSymbol}</p>
      <p>${forecast.weather[0].description}</p>
    `;
    forecastElement.appendChild(forecastCard);
  });
}

function updateBackground(weatherMain) {
  const validClasses = ['clear', 'clouds', 'rain', 'snow', 'thunderstorm', 'drizzle', 'mist'];
  validClasses.forEach(cls => {
    document.body.classList.remove(cls);
  });
  const weatherClass = weatherMain.toLowerCase();
  if (validClasses.includes(weatherClass)) {
    document.body.classList.add(weatherClass);
  }
}
