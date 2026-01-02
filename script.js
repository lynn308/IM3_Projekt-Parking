console.log("Script gestartet");

const CHART_POS = {
  // Beispiel: parkhaus_id -> { left, top } in Prozent
  // Diese Werte musst du 1x feinjustieren, dann passt es immer.
  "P21": { left: 80, top: 5},
  "P22": { left: 20, top: 10 },
  "P23": { left: 25, top: 18 },
  "P24": { left: 60, top: 18 },

  "P25": { left: 35, top: 29 },
  "P31": { left: 66, top: 20},

  "P32": { left: 58, top: 43 },

  "P33": { left: 70, top: 52 },
  "P41": { left: 34, top: 52 },

  "P42": { left: 55, top: 62 },

  "P43": { left: 32, top: 71 },
  "P44": { left: 66, top: 71 },

  "P51": { left: 55, top: 82 },

  "P52": { left: 32, top: 90 },
  "P53": { left: 66, top: 90 },
  "P54": { left: 40, top: 90 },
};

const overlay = document.getElementById('overlay');
const overlayTitle = overlay.querySelector('.overlay-title');
const closeBtn = overlay.querySelector('.close-btn');
const mapFrame = document.getElementById('mapFrame');

closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  mapFrame.src = ''; // stoppt Google Maps
});

function openOverlay(row, anchorEl)

 {
  overlayTitle.textContent = row.parkhaus_name ?? 'Details';

  const lat = row.lat;
  const lon = row.lon;

  if (lat != null && lon != null) {
    const zoom = 16;
    mapFrame.src =
      `https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lon)}&z=${zoom}&output=embed`;
  } else {
    mapFrame.src = '';
  }

  overlay.style.display = 'block';
  const r = anchorEl.getBoundingClientRect();

  // Erst NACH display:block messen
  const oh = overlay.offsetHeight;

  // Ziel: Overlay oben auf Chart-Höhe, aber im Viewport bleiben
 let top = window.scrollY + r.top + 10;

const minTop = window.scrollY + 20;
const maxTop = window.scrollY + window.innerHeight - oh - 20;


  if (top < minTop) top = minTop;
  if (top > maxTop) top = maxTop;

  overlay.style.top = `${top}px`;
}



// DATEN LADEN UND CHARTS ERSTELLEN

const chartsContainer = document.getElementById('charts');
const toInt = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };

function renderCharts(rows) {
  chartsContainer.innerHTML = ""; // alte Charts entfernen

  rows.forEach(row => {
    const freie = toInt(row.freie_plaetze ?? 0);
    const belegte = toInt(row.belegte_plaetze ?? 0);
    const name = row.parkhaus_name ?? `Parkhaus ${row.parkhaus_id ?? ''}`;

    const card = document.createElement('div');
    card.className = 'chart-card';

    // (Deine Positionierung bleibt gleich)
    const id = String(row.parkhaus_id ?? "");
    const pos = CHART_POS[id];
    if (pos) {
      card.style.left = pos.left + "%";
      card.style.top  = pos.top + "%";
    }

    const title = document.createElement('h2');
    title.textContent = name;

    const canvas = document.createElement('canvas');

    const button = document.createElement('button');
button.textContent = 'Details';
button.className = 'details-btn';

button.addEventListener('click', () => {
  openOverlay(row, card);
});

card.appendChild(button);


    // optional: sample-Info anzeigen
    const small = document.createElement('div');
    small.style.fontSize = "14px";
    small.style.color = "#666";
    small.textContent = row.samples ? `${row.samples} Messwerte` : "Keine Daten";

    card.appendChild(title);
    card.appendChild(canvas);
    card.appendChild(small);
    chartsContainer.appendChild(card);

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Belegt', 'Frei'],
        datasets: [{
          data: [belegte, freie],
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } }
      }
    });
  });
}

async function loadAverage(day, hour) {
  const url = `https://im3-projekt.lynnhartmann.ch/unload_avg.php?day=${encodeURIComponent(day)}&hour=${encodeURIComponent(hour)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data?.error) {
    chartsContainer.textContent = data.error;
    return;
  }

  renderCharts(data);
}




// DROPDOWN FÜR UHRZEIT (SCROLLBAR)

(function () {
  const timeSelect = document.querySelector('.select-uhrzeit');
  if (!timeSelect) return;

  let panel = null;
  let onDocClick, onScroll, onResize;

  // Position des Dropdowns unter dem Button berechnen
  function positionPanel() {
    if (!panel) return;
    const r = timeSelect.getBoundingClientRect();
    const cs = getComputedStyle(timeSelect);
    panel.style.width = Math.round(r.width) + 'px';
    panel.style.fontSize = cs.fontSize;
    panel.style.fontFamily = cs.fontFamily;
    panel.style.fontWeight = cs.fontWeight;
    panel.style.left = (window.scrollX + r.left) + 'px';
    panel.style.top = (window.scrollY + r.bottom + 6) + 'px';
  }

  // Dropdown schließen
  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
    document.removeEventListener('click', onDocClick, true);
    window.removeEventListener('scroll', onScroll, { passive: true });
    window.removeEventListener('resize', onResize);
  }

  // Dropdown öffnen
  function openPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'uhrzeit-dropdown';

    // Uhrzeiten aus dem <select> übernehmen
    for (const opt of timeSelect.options) {
      if (opt.disabled || opt.hidden || opt.value === '') continue;
      const item = document.createElement('div');
      item.className = 'uhrzeit-dropdown__item';
      item.textContent = opt.textContent;
      item.addEventListener('click', () => {
        timeSelect.value = opt.value || opt.textContent;
        timeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        closePanel();
      });
      panel.appendChild(item);
    }

    document.body.appendChild(panel);
    positionPanel();

    // Klick außerhalb schließt das Menü
    onDocClick = (e) => {
      if (!panel) return;
      if (e.target === timeSelect || panel.contains(e.target)) return;
      closePanel();
    };
    onScroll = () => positionPanel();
    onResize = () => positionPanel();

    setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  // Klick auf den Button öffnet/schließt das Menü
  timeSelect.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (panel) closePanel(); else openPanel();
  });

  // Tastatursteuerung
  timeSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (panel) closePanel(); else openPanel();
    }
  });
})();



// DROPDOWN FÜR WOCHENTAG (OHNE SCROLLBAR)

(function () {
  const daySelect = document.querySelector('.select-wochentag');
  if (!daySelect) return;

  let panel = null;
  let onDocClick, onScroll, onResize;

  function positionPanel() {
    if (!panel) return;
    const r = daySelect.getBoundingClientRect();
    const cs = getComputedStyle(daySelect);
    panel.style.width = Math.round(r.width) + 'px';
    panel.style.fontSize = cs.fontSize;
    panel.style.fontFamily = cs.fontFamily;
    panel.style.fontWeight = cs.fontWeight;
    panel.style.left = (window.scrollX + r.left) + 'px';
    panel.style.top = (window.scrollY + r.bottom + 6) + 'px';
  }

  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
    document.removeEventListener('click', onDocClick, true);
    window.removeEventListener('scroll', onScroll, { passive: true });
    window.removeEventListener('resize', onResize);
  }

  function openPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'wochentag-dropdown';

    for (const opt of daySelect.options) {
      if (opt.disabled || opt.hidden || opt.value === '') continue;
      const item = document.createElement('div');
      item.className = 'wochentag-dropdown__item';
      item.textContent = opt.textContent;
      item.addEventListener('click', () => {
        daySelect.value = opt.value || opt.textContent;
        daySelect.dispatchEvent(new Event('change', { bubbles: true }));
        closePanel();
      });
      panel.appendChild(item);
    }

    document.body.appendChild(panel);
    positionPanel();

    onDocClick = (e) => {
      if (!panel) return;
      if (e.target === daySelect || panel.contains(e.target)) return;
      closePanel();
    };
    onScroll = () => positionPanel();
    onResize = () => positionPanel();

    setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  daySelect.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (panel) closePanel(); else openPanel();
  });

  daySelect.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (panel) closePanel(); else openPanel();
    }
  });
})();



// Belegung-Anzeige-BUTTON: SCROLLT ZU DEN CHARTS

document.addEventListener('DOMContentLoaded', () => {
  const scrollButton = document.querySelector('.belegung-anzeige-button');
  const strassenbereich = document.querySelector('.strassenbereich');

  if (!scrollButton || !strassenbereich) return;

  scrollButton.addEventListener('click', () => {
    const offsetTop =
      strassenbereich.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const scrollButton = document.querySelector('.belegung-anzeige-button');
  const strassenbereich = document.querySelector('.strassenbereich');
  const daySelect = document.querySelector('.select-wochentag');
  const timeSelect = document.querySelector('.select-uhrzeit');

  if (!scrollButton || !strassenbereich) return;

  scrollButton.addEventListener('click', async () => {
    const day = daySelect?.value;
    const hour = timeSelect?.value;

    if (!day || !hour) {
      alert("Bitte Wochentag und Uhrzeit auswählen.");
      return;
    }

    await loadAverage(day, hour);

    const offsetTop = strassenbereich.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  });
});
