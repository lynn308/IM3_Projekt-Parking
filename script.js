console.log("Script gestartet");


// DATEN LADEN UND CHARTS ERSTELLEN

document.addEventListener('DOMContentLoaded', async () => {
  const chartsContainer = document.getElementById('charts');
  const toInt = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };

  try {
    const res = await fetch('https://im3-projekt.lynnhartmann.ch/unload.php');
    const raw = await res.json();
    console.log('API Antwort:', raw);

    // Wenn keine Daten vorhanden sind
    if (!Array.isArray(raw) || raw.length === 0) {
      chartsContainer.textContent = 'Keine Daten vorhanden.';
      return;
    }

    // Für jedes Parkhaus den aktuellsten Eintrag finden
    const latestById = new Map();
    raw.forEach(row => {
      const id = row.parkhaus_id ?? row.parkhausId ?? row.id;
      const timeVal = row.messzeit ?? row.time ?? null;
      const time = timeVal ? new Date(timeVal).getTime() : 0;

      if (!latestById.has(id) || time > latestById.get(id).time) {
        latestById.set(id, { row, time });
      }
    });

    // Charts für die neuesten Einträge erstellen
    latestById.forEach(({ row }) => {
      const freie = toInt(row.freie_plaetze ?? row.shortfree ?? 0);
      const belegte = toInt(row.belegte_plaetze ?? row.shortoccupied ?? 0);
      const name = row.parkhaus_name ?? `Parkhaus ${row.parkhaus_id ?? ''}`;

      const card = document.createElement('div');
      card.className = 'chart-card';

      const title = document.createElement('h2');
      title.textContent = name;

      const canvas = document.createElement('canvas');

      const button = document.createElement('button');
      button.textContent = 'Details';
      button.addEventListener('click', () => {
        alert(`Details für ${name}`);
      });

      // Elemente in die Karte einfügen
      card.appendChild(title);
      card.appendChild(canvas);
      card.appendChild(button);
      chartsContainer.appendChild(card);

      // Kreisdiagramm erstellen (Belegt / Frei)
      new Chart(canvas, {
        type: 'pie',
        data: {
          labels: ['Belegt', 'Frei'],
          datasets: [{
            data: [belegte, freie],
            backgroundColor: [
              'rgba(255, 99, 132, 0.9)', // rot = Belegt
              'rgba(75, 192, 192, 0.9)'  // grün = Frei
            ],
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    });

  } catch (err) {
    console.error('Fehler beim Laden der Daten:', err);
    chartsContainer.textContent = 'Fehler beim Laden der Daten — siehe Konsole.';
  }
});



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