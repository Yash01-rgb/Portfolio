console.log("Javascript connected");

const profileImage = document.querySelector(".profile-image");
if (profileImage) {
    function markMissingProfileImage() {
        profileImage.classList.add("is-missing");
    }

    profileImage.addEventListener("error", markMissingProfileImage);

    if (profileImage.complete && profileImage.naturalWidth === 0) {
        markMissingProfileImage();
    }
}

const themeButton = document.getElementById("themeToggle");
const root = document.documentElement;
const THEME_KEY = "portfolio-theme";

function applyTheme(isDark) {
    root.classList.toggle("dark-mode", isDark);

    if (themeButton) {
        themeButton.textContent = isDark
            ? "Switch to Light Mode"
            : "Switch to Dark Mode";
        themeButton.setAttribute(
            "aria-pressed",
            isDark ? "true" : "false"
        );
    }
}

const savedTheme = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme === "dark" || (!savedTheme && prefersDark));

if (themeButton) {
    themeButton.addEventListener("click", function () {
        const isDark = !root.classList.contains("dark-mode");
        applyTheme(isDark);
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    });
}
const cityInput = document.getElementById("cityInput");
const weatherButton = document.getElementById("weatherButton");
const weatherResult = document.getElementById("weatherResult");

function weatherCodeToText(code) {
    if (code === 0) return "clear sky";
    if (code === 1) return "mainly clear";
    if (code === 2) return "partly cloudy";
    if (code === 3) return "overcast";
    if (code === 45 || code === 48) return "fog";
    if (code >= 51 && code <= 57) return "drizzle";
    if (code >= 61 && code <= 67) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain showers";
    if (code >= 85 && code <= 86) return "snow showers";
    if (code >= 95) return "thunderstorm";
    return "unknown conditions";
}

function formatPlaceName(place) {
    const parts = [place.name];

    if (place.admin1 && place.admin1 !== place.name) {
        parts.push(place.admin1);
    }

    if (place.country) {
        parts.push(place.country);
    }

    return parts.join(", ");
}

async function fetchWeatherForCity(city) {
    const geoUrl =
        "https://geocoding-api.open-meteo.com/v1/search" +
        "?name=" + encodeURIComponent(city) +
        "&count=1&language=en&format=json";

    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
        throw new Error("HTTP " + geoResponse.status);
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error("CITY_NOT_FOUND");
    }

    const place = geoData.results[0];
    const weatherUrl =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + place.latitude +
        "&longitude=" + place.longitude +
        "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m";

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
        throw new Error("HTTP " + weatherResponse.status);
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    if (!current) {
        throw new Error("INVALID_RESPONSE");
    }

    return {
        name: formatPlaceName(place),
        main: {
            temp: current.temperature_2m,
            humidity: current.relative_humidity_2m
        },
        weather: [{
            description: weatherCodeToText(current.weather_code)
        }],
        wind: {
            speed: current.wind_speed_10m
        }
    };
}

function formatWeatherMessage(data) {
    return (
        "Current weather in " + data.name + ": " +
        data.main.temp + "°C, " +
        data.weather[0].description +
        ". Humidity " + data.main.humidity +
        "%. Wind " + data.wind.speed + " m/s."
    );
}

async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        weatherResult.textContent = "Please enter a city.";
        return;
    }

    weatherResult.textContent = "Loading weather...";

    try {
        const data = await fetchWeatherForCity(city);

        weatherResult.innerHTML =
            "<h3>" + data.name + "</h3>" +
            "<p>Temperature: " + data.main.temp + "°C</p>" +
            "<p>Condition: " + data.weather[0].description + "</p>" +
            "<p>Humidity: " + data.main.humidity + "%</p>";
    } catch (error) {
        if (error.message === "CITY_NOT_FOUND") {
            weatherResult.textContent =
                "City not found. Try another name.";
        } else {
            weatherResult.textContent =
                "Unable to fetch weather. Please try again.";
        }

        console.error(error);
    }
}

const projectSearch = document.getElementById("projectSearch");
const projectCards = document.querySelectorAll(".project-card");
const projectSearchEmpty = document.getElementById("projectSearchEmpty");

function getCardText(card, selector) {
    const node = card.querySelector(selector);
    return node ? node.textContent : "";
}

function filterProjects() {
    if (!projectSearch) {
        return;
    }

    const query = projectSearch.value.trim().toLowerCase();
    let visibleCount = 0;

    projectCards.forEach(function (card) {
        const haystack = (
            getCardText(card, ".project-title") + " " +
            getCardText(card, ".project-description") + " " +
            getCardText(card, ".project-tech") + " " +
            (card.getAttribute("data-technologies") || "")
        ).toLowerCase();
        const matches = query === "" || haystack.includes(query);

        card.hidden = !matches;

        if (matches) {
            visibleCount += 1;
        }
    });

    if (projectSearchEmpty) {
        projectSearchEmpty.hidden = visibleCount !== 0;
    }
}

if (projectSearch) {
    projectSearch.addEventListener("input", filterProjects);
    projectSearch.addEventListener("search", filterProjects);
}

weatherButton.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
