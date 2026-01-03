<?php
require_once 'config.php';
header('Content-Type: application/json');

$parkhaus_id = $_GET['parkhaus_id'] ?? null; // z.B. "P21"
$day         = $_GET['day'] ?? null;         // z.B. "Mittwoch"

if (!$parkhaus_id || !$day) {
  echo json_encode(['error' => 'Bitte parkhaus_id und day übergeben. Beispiel: ?parkhaus_id=P21&day=Mittwoch']);
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

try {
  $pdo = new PDO($dsn, $username, $password, $options);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // Pro Stunde Durchschnitt für dieses Parkhaus + Wochentag
  $sql = "
    SELECT
      HOUR(pd.time) AS h,
      ROUND(AVG(pd.belegung_prozent)) AS avg_occ
    FROM parking_data pd
    WHERE pd.parkhaus_id = ?
      AND WEEKDAY(pd.time) = ?
    GROUP BY HOUR(pd.time)
    ORDER BY h
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([$parkhaus_id, $weekday]);

  // 24er Array (fehlende Stunden => 0)
  $values = array_fill(0, 24, 0);

  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $h = (int)$row['h'];
    if ($h >= 0 && $h <= 23) {
      $values[$h] = (int)$row['avg_occ'];
    }
  }

  echo json_encode([
    'parkhaus_id' => $parkhaus_id,
    'day' => $day,
    'values' => $values
  ]);

} catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]);
}
