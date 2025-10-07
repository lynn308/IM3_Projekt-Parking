<?php
// load.php
require_once 'config.php'; // $dsn, $username, $password, $options

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0777, true);
}

// Holt das bereits transformierte Array
$dataArray = include(__DIR__ . '/transform.php');

if (!is_array($dataArray)) {
    $msg = date('c') . " transform.php lieferte kein Array." . PHP_EOL;
    file_put_contents($logDir . '/load_errors.log', $msg, FILE_APPEND);
    die("Fehler: transform.php lieferte kein Array. Siehe logs/load_errors.log");
}

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "INSERT INTO parking_data (parkhaus_id, phstate, shortfree, belegung_prozent, shortoccupied)
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    foreach ($dataArray as $index => $item) {
        // Normalisiere nochmals — auf Nummer sicher (kein NULL)
        $parkhaus_id = isset($item['parkhaus_id']) ? (string)$item['parkhaus_id'] : null;
        $phstate = isset($item['phstate']) ? (string)$item['phstate'] : 'unbekannt';
        $shortfree = isset($item['shortfree']) ? (int)$item['shortfree'] : 0;
        $belegung = isset($item['belegung_prozent']) && $item['belegung_prozent'] !== null
                    ? (int)$item['belegung_prozent']
                    : 0;
        $shortoccupied = isset($item['shortoccupied']) ? (int)$item['shortoccupied'] : 0;

        // Safety-check: falls belegung noch NULL wäre, setze 0
        if ($belegung === null) {
            $belegung = 0;
        }

        try {
            $stmt->execute([$parkhaus_id, $phstate, $shortfree, $belegung, $shortoccupied]);
        } catch (PDOException $e) {
            // Logge das fehlerhafte Item inkl. Fehlermeldung und fahre fort
            $logEntry = date('c') . ' Fehler beim Einfügen (Index ' . $index . "): " .
                        $e->getMessage() . ' | Item: ' . json_encode($item, JSON_UNESCAPED_UNICODE) . PHP_EOL;
            file_put_contents($logDir . '/load_errors.log', $logEntry, FILE_APPEND);
            // continue, damit wir sehen, ob weitere Datensätze problematisch sind
            continue;
        }
    }

    echo "Datenverarbeitung abgeschlossen.";
} catch (PDOException $e) {
    $msg = date('c') . " Verbindung zur DB fehlgeschlagen: " . $e->getMessage() . PHP_EOL;
    file_put_contents($logDir . '/load_errors.log', $msg, FILE_APPEND);
    die("Verbindung zur Datenbank konnte nicht hergestellt werden: " . $e->getMessage());
}
