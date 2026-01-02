<?php
require_once 'config.php';
header('Content-Type: application/json');

$day  = $_GET['day']  ?? null;   // z.B. "Montag"
$hour = $_GET['hour'] ?? null;   // z.B. "13:00"

if (!$day || !$hour) {
  echo json_encode(['error' => 'Bitte day und hour übergeben. Beispiel: ?day=Montag&hour=13:00']);
  exit;
}

// Wochentag Mapping -> MySQL WEEKDAY(): Montag=0 ... Sonntag=6
$map = [
  'Montag' => 0,
  'Dienstag' => 1,
  'Mittwoch' => 2,
  'Donnerstag' => 3,
  'Freitag' => 4,
  'Samstag' => 5,
  'Sonntag' => 6,
];

if (!isset($map[$day])) {
  echo json_encode(['error' => 'Ungültiger Wochentag']);
  exit;
}

$weekday = $map[$day];

// Stunde aus "HH:00" extrahieren
$hourInt = (int)substr($hour, 0, 2);

try {
  $pdo = new PDO($dsn, $username, $password, $options);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // Durchschnitt pro Parkhaus für gewählten Wochentag + Stunde
  $sql = "
    SELECT
      ph.id AS parkhaus_id,
      ph.phname AS parkhaus_name,
      ph.lat,
      ph.lon,
      ph.shortmax AS max_plaetze,

      COUNT(pd.id) AS samples,
      ROUND(AVG(pd.shortfree)) AS freie_plaetze,
      ROUND(AVG(pd.shortoccupied)) AS belegte_plaetze,
      ROUND(AVG(pd.belegung_prozent)) AS belegung_prozent
    FROM parkhaeuser ph
    LEFT JOIN parking_data pd
      ON ph.id = pd.parkhaus_id
      AND WEEKDAY(pd.time) = ?
      AND HOUR(pd.time) = ?
    GROUP BY ph.id, ph.phname, ph.lat, ph.lon, ph.shortmax
    ORDER BY ph.id
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([$weekday, $hourInt]);

  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]);
}
