/* ==========================================================================
   AERO-AGRI // MISSION CONTROL OS 26 - GSAP-Powered Cockpit Controller
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
  const mainBeaconCard = document.getElementById("main-beacon-card");
  const radarSweepBeam = document.getElementById("radar-sweep-beam");

  // ========================================================================
  // GSAP 1: Staggered Entrance Animations
  // ========================================================================
  if (typeof gsap !== "undefined") {
    // Header slide down
    gsap.from(".cockpit-header", {
      y: -50,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out"
    });

    // Glass cards staggered lift
    gsap.from(".liquid-glass", {
      opacity: 0,
      y: 40,
      duration: 1.0,
      stagger: 0.08,
      ease: "power3.out",
      delay: 0.2
    });

    // ========================================================================
    // GSAP 2: Continuous Radar 360 Sweep Beam
    // ========================================================================
    if (radarSweepBeam) {
      gsap.to(radarSweepBeam, {
        rotation: 360,
        transformOrigin: "410px 240px",
        repeat: -1,
        duration: 7,
        ease: "none"
      });
    }

    // ========================================================================
    // GSAP 3: Floating Physics Levitation on Center Beacon Card
    // ========================================================================
    if (mainBeaconCard) {
      gsap.to(mainBeaconCard, {
        y: "-=10",
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
  }

  // ========================================================================
  // Render Diurnal Volume Histogram
  // ========================================================================
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

      // GSAP bar hover micro-animation
      bar.addEventListener("mouseenter", () => {
        if (typeof gsap !== "undefined") {
          gsap.to(bar, { scaleY: 1.15, transformOrigin: "bottom", duration: 0.2 });
        }
      });
      bar.addEventListener("mouseleave", () => {
        if (typeof gsap !== "undefined") {
          gsap.to(bar, { scaleY: 1.0, duration: 0.2 });
        }
      });

      bar.addEventListener("click", () => {
        sliderHour.value = idx;
        updateSimulation();
      });

      histogramContainer.appendChild(bar);
    });
  }

  // ========================================================================
  // Real-time Thermodynamic Prediction & GSAP Number Tweening
  // ========================================================================
  let currentDisplayTemp = 13.5;

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

    const targetNextTemp = temp + coolingDelta + pressDelta;
    const delta = targetNextTemp - temp;

    // GSAP Smooth Number Counter
    if (typeof gsap !== "undefined") {
      const tempObj = { val: currentDisplayTemp };
      gsap.to(tempObj, {
        val: targetNextTemp,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          centerPredTemp.innerHTML = `${tempObj.val.toFixed(1)}<span>°C</span>`;
        }
      });
      currentDisplayTemp = targetNextTemp;
    } else {
      centerPredTemp.innerHTML = `${targetNextTemp.toFixed(1)}<span>°C</span>`;
    }

    const sign = delta >= 0 ? "+" : "";
    centerPredDelta.textContent = `Expected Delta: ${sign}${delta.toFixed(2)}°C (${isNight ? 'Radiative Cooling' : 'Solar Heating Phase'})`;

    // Re-render histogram highlight
    renderHistogram(hour);
  }

  [sliderTemp, sliderHum, sliderPress, sliderHour].forEach(slider => {
    slider.addEventListener("input", updateSimulation);
  });

  // ========================================================================
  // GSAP 4: Actuation Button Shockwave Pulse
  // ========================================================================
  if (btnActuate) {
    btnActuate.addEventListener("click", () => {
      if (typeof gsap !== "undefined") {
        gsap.timeline()
          .to(btnActuate, { scale: 0.96, duration: 0.1 })
          .to(btnActuate, { scale: 1.04, duration: 0.18 })
          .to(btnActuate, { scale: 1.0, duration: 0.15 });

        // Cockpit aura shockwave flash
        gsap.to(".satellite-map-card", {
          borderColor: "#D2F82E",
          boxShadow: "0 0 60px rgba(210, 248, 46, 0.4)",
          duration: 0.35,
          yoyo: true,
          repeat: 1
        });
      }

      const originalHtml = btnActuate.innerHTML;
      btnActuate.innerHTML = `
        <svg class="ui-icon sm" viewBox="0 0 24 24" style="stroke: #050807;"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Thermal Screens Deployed (+1.5°C Offset Active)</span>
      `;
      btnActuate.style.background = "#10B981";

      setTimeout(() => {
        btnActuate.innerHTML = originalHtml;
        btnActuate.style.background = "";
      }, 3500);
    });
  }

  // Model card click highlights with spring motion
  const modelCards = document.querySelectorAll(".model-schematic-card");
  modelCards.forEach(card => {
    card.addEventListener("click", () => {
      modelCards.forEach(c => c.classList.remove("featured"));
      card.classList.add("featured");

      if (typeof gsap !== "undefined") {
        gsap.fromTo(card, { scale: 0.98 }, { scale: 1.0, duration: 0.3, ease: "back.out(2)" });
      }
    });
  });

  // Navigation tab clicks
  const tabs = document.querySelectorAll(".cockpit-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (typeof gsap !== "undefined") {
        gsap.fromTo(tab, { scale: 0.93 }, { scale: 1.0, duration: 0.25, ease: "back.out(2)" });
      }
    });
  });

  // Initial render
  renderHistogram(14);
  updateSimulation();
});
