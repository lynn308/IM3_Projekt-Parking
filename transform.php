<?php
// transform.php
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0777, true);
}

// Holt Rohdaten aus extract.php (extract.php sollte ein PHP-Array zurückgeben)
$rawData = include(__DIR__ . '/extract.php');

if (!is_array($rawData) || !isset($rawData['results']) || !is_array($rawData['results'])) {
    $err = date('c') . " Ungültiges Datenformat aus extract.php: " . gettype($rawData) . PHP_EOL;
    file_put_contents($logDir . '/transform_errors.log', $err, FILE_APPEND);
    die("Fehler: extract.php liefert kein erwartetes Array. Siehe logs/transform_errors.log");
}

$transformedData = [];

foreach ($rawData['results'] as $item) {
    // Erzwinge sichere Typen und setze Defaults (kein NULL)
    $parkhaus_id = isset($item['phid']) ? (string)$item['phid'] : null;
    $phstate = isset($item['phstate']) ? (string)$item['phstate'] : 'unbekannt';
    $shortfree = isset($item['shortfree']) ? (int)$item['shortfree'] : 0;
    $shortoccupied = isset($item['shortoccupied']) ? (int)$item['shortoccupied'] : 0;
    $belegung_prozent = (isset($item['belegung_prozent']) && $item['belegung_prozent'] !== null)
                        ? (int)$item['belegung_prozent']
                        : 0; // HIER: zwingend 0 statt NULL

    $transformedData[] = [
        'parkhaus_id'      => $parkhaus_id,
        'phstate'          => $phstate,
        'shortfree'        => $shortfree,
        'belegung_prozent' => $belegung_prozent,
        'shortoccupied'    => $shortoccupied,
    ];
}

// Schreibe Debug-Datei (lesbar)
file_put_contents($logDir . '/transform_debug.json', json_encode($transformedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

return $transformedData;
