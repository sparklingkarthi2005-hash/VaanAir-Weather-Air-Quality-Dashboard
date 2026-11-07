const API_KEY = "5e87adf4038a1409ddbb84d0a2addeed"; // Inga ungaloda actual API key-a substitute pannunga

/* ---------- Elements ---------- */
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const emptyMsg = document.getElementById("emptyMsg");
const dashboard = document.getElementById("dashboard");

const cityNameEl = document.getElementById("cityName");
const countryNameEl = document.getElementById("countryName");
const localTimeEl = document.getElementById("localTime");
const tempEl = document.getElementById("temp");
const weatherDescEl = document.getElementById("weatherDesc");
const weatherIconEl = document.getElementById("weatherIcon");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("windSpeed");
const feelsLikeEl = document.getElementById("feelsLike");
const sunTimesEl = document.getElementById("sunTimes");
const aqiBadgeEl = document.getElementById("aqiBadge");
const aqiMarkerEl = document.getElementById("aqiMarker");

const pollutantEls = {
    pm2_5: document.getElementById("pm25"),
    pm10: document.getElementById("pm10"),
    no2: document.getElementById("no2"),
    o3: document.getElementById("o3"),
    so2: document.getElementById("so2"),
    co: document.getElementById("co")
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =====================================================
   SEARCH
   ===================================================== */
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
});

async function getWeatherData(city) {
    hideError();
    setLoading(true);
    try {
        // Step 1: Latitude & longitude from Geocoding API
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        const geoResponse = await fetch(geoUrl);

        if (geoResponse.status === 401) {
            showError("API key is not valid yet. Check the key in script.js (new keys can take up to 2 hours to activate).");
            return;
        }
        const geoData = await geoResponse.json();

        if (!Array.isArray(geoData) || !geoData.length) {
            showError("City not found. Check the spelling and try again.");
            return;
        }

        const { lat, lon, name, country } = geoData[0];

        // Step 2: Weather + air pollution in parallel
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

        const [weatherRes, pollutionRes] = await Promise.all([fetch(weatherUrl), fetch(pollutionUrl)]);
        if (!weatherRes.ok || !pollutionRes.ok) {
            throw new Error("API request failed");
        }

        const weatherData = await weatherRes.json();
        const pollutionData = await pollutionRes.json();

        // Step 3: Render
        updateUI(name, country, weatherData, pollutionData);
    } catch (err) {
        console.error(err);
        showError("Could not load data. Check your internet connection and API key.");
    } finally {
        setLoading(false);
    }
}

/* =====================================================
   UI UPDATE
   ===================================================== */
function updateUI(city, country, weather, pollution) {
    cityNameEl.textContent = city;
    countryNameEl.textContent = country;
    localTimeEl.textContent = formatCityTime(weather.dt, weather.timezone) + " local time";

    weatherDescEl.textContent = weather.weather[0].description;
    weatherIconEl.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

    humidityEl.textContent = `${weather.main.humidity}%`;
    windSpeedEl.textContent = `${weather.wind.speed} m/s`;
    feelsLikeEl.textContent = `${Math.round(weather.main.feels_like)}°C`;
    sunTimesEl.textContent = `${formatCityTime(weather.sys.sunrise, weather.timezone)} / ${formatCityTime(weather.sys.sunset, weather.timezone)}`;

    countUp(tempEl, Math.round(weather.main.temp), "°");

    // Air quality (note: OpenWeatherMap key is "pm2_5", not "pm25")
    const aqiIndex = pollution.list[0].main.aqi;
    const components = pollution.list[0].components;
    for (const key in pollutantEls) {
        const v = components[key];
        pollutantEls[key].textContent = v === undefined ? "--" : Number(v).toFixed(1);
    }
    setAqiBadge(aqiIndex);

    // Background reacts to the weather
    applyScene(weather.weather[0].id, weather.weather[0].icon);

    // Show + replay reveal animation
    emptyMsg.classList.add("hidden");
    dashboard.classList.remove("hidden", "show");
    void dashboard.offsetWidth; // restart CSS animation
    dashboard.classList.add("show");
}

function setAqiBadge(aqi) {
    // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
    const aqiLevels = {
        1: { text: "Good", cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" },
        2: { text: "Fair", cls: "bg-blue-500/20 text-blue-300 border border-blue-400/40" },
        3: { text: "Moderate", cls: "bg-amber-500/20 text-amber-300 border border-amber-400/40" },
        4: { text: "Poor", cls: "bg-orange-500/20 text-orange-300 border border-orange-400/40" },
        5: { text: "Very Poor", cls: "bg-red-500/20 text-red-300 border border-red-400/40" }
    };
    const level = aqiLevels[aqi] || { text: "Unknown", cls: "bg-slate-700 text-slate-300" };
    aqiBadgeEl.textContent = level.text;
    aqiBadgeEl.className = `px-3 py-1 rounded-full text-xs font-semibold ${level.cls}`;

    // Gauge marker: centre of the matching fifth of the bar
    const pct = aqiLevels[aqi] ? (aqi - 0.5) * 20 : 50;
    aqiMarkerEl.style.left = `${pct}%`;
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove("hidden");
    dashboard.classList.add("hidden");
    emptyMsg.classList.add("hidden");
}

function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchBtn.classList.toggle("loading", isLoading);
}

function formatCityTime(unixSeconds, tzOffsetSeconds) {
    const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
    return d.toLocaleTimeString("en-IN", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function countUp(el, target, suffix = "") {
    if (reduceMotion) {
        el.textContent = `${target}${suffix}`;
        return;
    }
    const duration = 900;
    const start = performance.now();
    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

/* =====================================================
   SCENE ENGINE (background + animated weather effects)
   ===================================================== */
const sceneEl = document.getElementById("scene");
const sceneImageEl = sceneEl.querySelector(".scene-image");
const flashEl = sceneEl.querySelector(".flash");
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");

/*
  Scene illustrations live in the "images" folder (clear-day.svg, clear-night.svg,
  clouds-day.svg, clouds-night.svg, rain.svg, thunder.svg, snow.svg, mist.svg).
  You can replace any of them with your own .svg/.jpg/.png - just keep the same name
  and change IMAGE_EXT below. If a file is missing, the animated gradient is used.
*/
const IMAGE_FOLDER = "images";
const IMAGE_EXT = "svg";

// fx: particle type, clouds: how many drifting clouds, cloud: [r,g,b,alpha]
const SCENES = {
    "clear-day":     { fx: "none",  clouds: 3, cloud: [255, 255, 255, 0.28] },
    "clear-night":   { fx: "stars", clouds: 0, cloud: [0, 0, 0, 0] },
    "clouds-day":    { fx: "none",  clouds: 8, cloud: [255, 255, 255, 0.30] },
    "clouds-night":  { fx: "stars", clouds: 7, cloud: [150, 165, 195, 0.16] },
    "rain":          { fx: "rain",  clouds: 7, cloud: [35, 45, 60, 0.45], drops: 220 },
    "thunder":       { fx: "rain",  clouds: 8, cloud: [20, 20, 35, 0.55], drops: 300, lightning: true },
    "snow":          { fx: "snow",  clouds: 5, cloud: [255, 255, 255, 0.28] },
    "mist":          { fx: "none",  clouds: 6, cloud: [235, 240, 245, 0.22], big: true }
};

let currentScene = null;
let particles = [];
let clouds = [];
let rafId = null;
let lightningTimer = null;
let W = 0, H = 0;

function pickScene(id, icon) {
    const night = icon.endsWith("n");
    if (id >= 200 && id < 300) return "thunder";
    if (id >= 300 && id < 600) return "rain";
    if (id >= 600 && id < 700) return "snow";
    if (id >= 700 && id < 800) return "mist";
    if (id === 800) return night ? "clear-night" : "clear-day";
    return night ? "clouds-night" : "clouds-day";
}

function applyScene(id, icon) {
    const key = pickScene(id, icon);
    if (key === currentScene) return;
    currentScene = key;
    sceneEl.dataset.scene = key;
    loadSceneImage(key);
    buildParticles();
    startLightning();
    startLoop();
}

function loadSceneImage(key) {
    sceneImageEl.classList.remove("on");
    const url = `${IMAGE_FOLDER}/${key}.${IMAGE_EXT}`;
    const img = new Image();
    img.onload = () => {
        if (currentScene !== key) return;
        sceneImageEl.style.backgroundImage = `url("${url}")`;
        sceneImageEl.classList.add("on");
    };
    img.src = url; // silently ignored if the file doesn't exist
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rand(min, max) { return Math.random() * (max - min) + min; }

function buildParticles() {
    const cfg = SCENES[currentScene];
    const scale = reduceMotion ? 0.4 : 1;
    particles = [];
    clouds = [];

    if (cfg.fx === "stars") {
        for (let i = 0; i < 150; i++) {
            particles.push({ x: rand(0, W), y: rand(0, H * 0.85), r: rand(0.3, 1.6), phase: rand(0, 6.28), speed: rand(0.01, 0.03) });
        }
    } else if (cfg.fx === "rain") {
        const n = Math.round((cfg.drops || 200) * scale);
        for (let i = 0; i < n; i++) {
            particles.push({ x: rand(0, W), y: rand(0, H), len: rand(10, 24), v: rand(16, 28), o: rand(0.15, 0.4) });
        }
    } else if (cfg.fx === "snow") {
        const n = Math.round(140 * scale);
        for (let i = 0; i < n; i++) {
            particles.push({ x: rand(0, W), y: rand(0, H), r: rand(1, 3.4), v: rand(0.5, 1.4), drift: rand(0, 6.28), sway: rand(0.01, 0.03) });
        }
    }

    for (let i = 0; i < cfg.clouds; i++) {
        clouds.push({
            x: rand(-200, W),
            y: rand(0, H * (cfg.big ? 0.9 : 0.45)),
            s: cfg.big ? rand(2.4, 3.6) : rand(0.9, 1.9),
            v: rand(0.08, 0.28)
        });
    }
}

function drawCloud(c, rgba) {
    const [r, g, b, a] = rgba;
    const puffs = [[0, 0, 60], [55, -22, 52], [110, 0, 58], [50, 16, 62]];
    for (const [dx, dy, rad] of puffs) {
        const px = c.x + dx * c.s;
        const py = c.y + dy * c.s;
        const pr = rad * c.s;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
    }
}

function draw(time) {
    const cfg = SCENES[currentScene] || SCENES["clear-night"];
    ctx.clearRect(0, 0, W, H);

    // stars
    if (cfg.fx === "stars") {
        for (const s of particles) {
            const tw = 0.55 + 0.45 * Math.sin(time * s.speed * 0.1 + s.phase);
            ctx.fillStyle = `rgba(255,255,255,${tw})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // clouds (drawn before rain/snow so precipitation falls in front)
    for (const c of clouds) {
        drawCloud(c, cfg.cloud);
        c.x += c.v;
        if (c.x - 100 * c.s > W) c.x = -260 * c.s;
    }

    // rain
    if (cfg.fx === "rain") {
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        for (const p of particles) {
            ctx.strokeStyle = `rgba(190,215,240,${p.o})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.len * 0.18, p.y + p.len);
            ctx.stroke();
            p.y += p.v;
            p.x -= p.v * 0.18;
            if (p.y > H) { p.y = -p.len; p.x = rand(0, W + 100); }
        }
    }

    // snow
    if (cfg.fx === "snow") {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (const p of particles) {
            p.drift += p.sway;
            p.x += Math.sin(p.drift) * 0.6;
            p.y += p.v;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            if (p.y > H + 5) { p.y = -5; p.x = rand(0, W); }
        }
    }
}

function loop(time) {
    draw(time);
    rafId = requestAnimationFrame(loop);
}

function startLoop() {
    cancelAnimationFrame(rafId);
    if (reduceMotion) {
        draw(0); // single static frame
        return;
    }
    rafId = requestAnimationFrame(loop);
}

function startLightning() {
    clearTimeout(lightningTimer);
    if (reduceMotion || !SCENES[currentScene].lightning) return;
    const strike = () => {
        flashEl.classList.remove("on");
        void flashEl.offsetWidth;
        flashEl.classList.add("on");
        lightningTimer = setTimeout(strike, rand(3500, 9000));
    };
    lightningTimer = setTimeout(strike, rand(1500, 4000));
}

// Pause animation when the tab is hidden (saves battery)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else startLoop();
});

window.addEventListener("resize", () => {
    resizeCanvas();
    buildParticles();
    if (reduceMotion) draw(0);
});

/* ---------- Initial scene (before any search) ---------- */
resizeCanvas();
currentScene = "clear-night";
sceneEl.dataset.scene = currentScene;
buildParticles();
startLoop();
