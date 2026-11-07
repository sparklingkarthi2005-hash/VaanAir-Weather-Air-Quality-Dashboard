# VaanAir: Weather & Air Quality Dashboard :-

A responsive web dashboard that shows live weather and air quality for any city. The background changes with the real weather and time of day, with animated rain, snow, stars, clouds, and lightning over illustrated skylines and hills.

"Vaan" (வான்) means sky in Tamil.

## Features :-

City search with loading state and clear error messages (city not found, invalid API key, network failure)
Current weather: temperature, weather description and icon, feels like, humidity, wind speed, sunrise and sunset, local time of the searched city
Air Quality Index on a 5-level scale (Good to Very Poor) with a colour gauge
Six pollutant readings: PM2.5, PM10, NO₂, O₃, SO₂, CO (µg/m³)
Weather-reactive background with day and night variants
Canvas animations: twinkling stars, drifting clouds, rain, snow, thunderstorm lightning
Glassmorphism UI built with Tailwind CSS
Accessible: respects the prefers-reduced-motion setting, keyboard focus styles, ARIA labels
Animations pause when the browser tab is hidden to save battery

## Weather scenes - Condition & Scene :-

Clear (day) - Sun glow over green hills
Clear (night)	- Moon and stars over a city skyline
Clouds (day / night) - Grey hills / dark skyline with drifting clouds
Drizzle and rain - City skyline with falling rain
Thunderstorm - Dark skyline, heavy rain, lightning flashes
Snow - Snowy hills and pine trees with falling snow
Mist, fog, haze - Faded hills with slow fog

## Tech stack :-

HTML5, CSS3, JavaScript (ES6+)
Tailwind CSS (CDN)
HTML Canvas for particle effects
SVG for scene illustrations
OpenWeatherMap APIs: Geocoding, Current Weather, Air Pollution

## Project structure :-

vaanair/
├── index.html        # Page structure
├── style.css         # Scenes, glass card, gauge, animations
├── script.js         # API calls, UI updates, scene and particle engine
├── images/           # SVG scene illustrations
│   ├── clear-day.svg
│   ├── clear-night.svg
│   ├── clouds-day.svg
│   ├── clouds-night.svg
│   ├── rain.svg
│   ├── thunder.svg
│   ├── snow.svg
│   └── mist.svg
└── README.md

## How it works :-

The city name is converted to latitude and longitude using the Geocoding API.
Current Weather and Air Pollution requests run in parallel with Promise.all.
The UI is updated, and the weather condition code plus the day/night icon suffix pick the matching scene.
The canvas engine draws the scene's particles (rain, snow, stars) and clouds, and lightning is scheduled for thunderstorms.

## AQI scale (OpenWeatherMap) Index	& Level

1 - Good
2	- Fair
3	- Moderate
4	- Poor
5	- Very Poor

## Pollutants	& Main sources

PM2.5 - Vehicle exhaust, burning, industry
PM10 - Road dust, construction
NO₂ - Vehicles (diesel), power plants
O₃ - Forms from NO₂ and sunlight
SO₂ - Coal and oil burning, industry
CO - Incomplete combustion, vehicle exhaust

## Customisation

Scene images :- replace any file in images/ with your own .svg, .jpg, or .png using the same name, and set IMAGE_EXT in script.js to match. If an image is missing, the animated gradient is used.
Scene colours :- edit the #scene[data-scene="..."] rules in style.css.
Effects :- adjust the SCENES object in script.js (number of clouds, raindrops, lightning on or off).
