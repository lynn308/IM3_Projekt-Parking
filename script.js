console.log("hello world");

// Optional: debug fetches
fetch('https://im3-projekt.lynnhartmann.ch/unload.php')
    .then(response => response.json())
    .then(data => {
        console.log('Unload.php Daten:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });

fetch('https://im3-projekt.lynnhartmann.ch/unload_single.php')
    .then(response => response.json())
    .then(data => {
        console.log('Unload_single.php Daten:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });

document.addEventListener('DOMContentLoaded', async () => {
  const chartsContainer = document.getElementById('charts');

  // Hilfsfunktion, um sicher Zahlen zu parsen
  const toInt = v => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };

  try {
    const res = await fetch('https://im3-projekt.lynnhartmann.ch/unload.php');
    const raw = await res.json();
    console.log('API response:', raw);

    if (!Array.isArray(raw) || raw.length === 0) {
      chartsContainer.textContent = 'Keine Daten vorhanden.';
      return;
    }

    // Map: parkhaus_id -> aktuellster Eintrag
    const latestById = new Map();
    raw.forEach(row => {
      const id = row.parkhaus_id ?? row.parkhausId ?? row.id;
      const timeVal = row.messzeit ?? row.time ?? null;
      const time = timeVal ? new Date(timeVal).getTime() : 0;

      if (!latestById.has(id)) {
        latestById.set(id, { row, time });
      } else {
        const existing = latestById.get(id);
        if (time > existing.time) {
          latestById.set(id, { row, time });
        }
      }
    });

    // Für jeden neuesten Eintrag Chart erstellen
    latestById.forEach(({ row }) => {
      const freie = toInt(row.freie_plaetze ?? row.shortfree ?? 0);
      const belegte = toInt(row.belegte_plaetze ?? row.shortoccupied ?? 0);

      // Parkhaus "nicht verfügbar" überspringen
      const status = row.phstate ?? '';
      if (status.toLowerCase() === 'nicht verfügbar') return;

      // Card + Titel + Canvas
      const card = document.createElement('div');
      card.className = 'chart-card';

      const title = document.createElement('h2');
      const parkhausId = row.parkhaus_id ?? '';
      const parkhausName = row.parkhaus_name ?? 'Unbekannt';
      title.textContent = `${parkhausId} – ${parkhausName}`; // Titel mit ID + Name

      const canvas = document.createElement('canvas');

      card.appendChild(title);
      card.appendChild(canvas);
      chartsContainer.appendChild(card);

      // Chart.js Pie-Chart
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
