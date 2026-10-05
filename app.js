/* ==========================================================================
   AERO-AGRI // MISSION CONTROL OS 26 - Real-time Cockpit Controller
   Font Family: Helvetica Neue | Architecture: iOS 26 Liquid Glass
   ========================================================================== */

const DIURNAL_CYCLE = [
  { h: "00", temp: 8.2 }, { h: "01", temp: 7.6 }, { h: "02", temp: 6.9 },
  { h: "03", temp: 6.1 }, { h: "04", temp: 5.4 }, { h: "05", temp: 4.8 },
  { h: "06", temp: 5.2 }, { h: "07", temp: 7.4 }, { h: "08", temp: 10.8 },
  { h: "09", temp: 13.5 }, { h: "10", temp: 16.2 }, { h: "11", temp: 18.7 },
  { h: "12", temp: 20.4 }, { h: "13", temp: 21.6 }, { h: "14", temp: 22.1 },
  { h: "15", temp: 21.8 }, { h: "16", temp: 20.5 }, { h: "17", temp: 18.6 },
  { h: "18", temp: 16.1 }, { h: "19", temp: 13.8 }, { h: "20", temp: 11.9 },
  { h: "21", temp: 10.4 }, { h: "22", temp: 9.3 }, { h: "23", temp: 8.6 }
];

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sliderTemp = document.getElementById("ios-slider-temp");
  const sliderHum = document.getElementById("ios-slider-hum");
  const sliderPress = document.getElementById("ios-slider-press");
  const sliderHour = document.getElementById("ios-slider-hour");

  const valTemp = document.getElementById("slide-val-temp");
  const valHum = document.getElementById("slide-val-hum");
  const valPress = document.getElementById("slide-val-press");
  const valHour = document.getElementById("slide-val-hour");

  const centerPredTemp = document.getElementById("center-pred-temp");
  const centerPredDelta = document.getElementById("center-pred-delta");
  const currentHourStat = document.getElementById("current-hour-stat");
  const histogramContainer = document.getElementById("diurnal-histogram");
  const btnActuate = document.getElementById("btn-trigger-actuator");

  // Render Volume Histogram
  function renderHistogram(selectedHour = 14) {
    if (!histogramContainer) return;
    histogramContainer.innerHTML = "";

    const maxTemp = 25;
    DIURNAL_CYCLE.forEach((item, idx) => {
      const bar = document.createElement("div");
      bar.className = `hist-bar ${idx === selectedHour ? 'active' : ''}`;
      const heightPercent = Math.max(15, (item.temp / maxTemp) * 100);
      bar.style.height = `${heightPercent}%`;
      bar.title = `${item.h}:00 — ${item.temp}°C`;

      bar.addEventListener("click", () => {
        sliderHour.value = idx;
        updateSimulation();
      });

      histogramContainer.appendChild(bar);
    });
  }

  // Real-time Thermodynamic Prediction
  function updateSimulation() {
    const temp = parseFloat(sliderTemp.value);
    const hum = parseFloat(sliderHum.value);
    const press = parseFloat(sliderPress.value);
    const hour = parseInt(sliderHour.value);

    // Update badges
    valTemp.textContent = `${temp.toFixed(1)}°C`;
    valHum.textContent = `${hum}%`;
    valPress.textContent = `${press} mbar`;
    valHour.textContent = `${String(hour).padStart(2, '0')}:00`;
    currentHourStat.innerHTML = `${temp.toFixed(1)}<span>°C</span>`;

    // Radiative diurnal physics
    const isNight = hour >= 20 || hour <= 6;
    const coolingDelta = isNight ? -0.75 * (1 - (hum / 220)) : +0.95 * (1 - (hum / 320));
    const pressDelta = (press - 1013.25) * 0.004;

    const nextTemp = temp + coolingDelta + pressDelta;
    const delta = nextTemp - temp;

    centerPredTemp.innerHTML = `${nextTemp.toFixed(1)}<span>°C</span>`;
    const sign = delta >= 0 ? "+" : "";
    centerPredDelta.textContent = `Expected Delta: ${sign}${delta.toFixed(2)}°C (${isNight ? 'Radiative Cooling' : 'Solar Heating Phase'})`;

    // Re-render histogram highlight
    renderHistogram(hour);
  }

  [sliderTemp, sliderHum, sliderPress, sliderHour].forEach(slider => {
    slider.addEventListener("input", updateSimulation);
  });

  // Actuation Trigger Button
  if (btnActuate) {
    btnActuate.addEventListener("click", () => {
      const originalText = btnActuate.textContent;
      btnActuate.textContent = "⚡ ACTUATORS ENGAGED (Thermal Screens Deployed)";
      btnActuate.style.background = "#10B981";
      setTimeout(() => {
        btnActuate.textContent = originalText;
        btnActuate.style.background = "";
      }, 3000);
    });
  }

  // Model card click highlights
  const modelCards = document.querySelectorAll(".model-schematic-card");
  modelCards.forEach(card => {
    card.addEventListener("click", () => {
      modelCards.forEach(c => c.classList.remove("featured"));
      card.classList.add("featured");
    });
  });

  // Navigation tab clicks
  const tabs = document.querySelectorAll(".cockpit-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Initial draw
  renderHistogram(14);
  updateSimulation();
});
