<?php

// Datenbankkonfiguration einbinden
require_once 'config.php';

// Header setzen, um JSON-Inhaltstyp zurückzugeben
header('Content-Type: application/json');



try {
    // Erstellt eine neue PDO-Instanz mit der Konfiguration aus config.php
    $pdo = new PDO($dsn, $username, $password, $options);

    // SQL-Query, um nur die neuesten Daten pro Parkhaus zu erhalten
    $sql = "SELECT
    ph.id   AS parkhaus_id,
    ph.phname              AS parkhaus_name,
    ph.lat,
    ph.lon,
    ph.shortmax            AS max_plaetze,
    pd.id                  AS daten_id,
    pd.time                AS messzeit,
    pd.phstate             AS status,
    pd.shortfree           AS freie_plaetze,
    pd.shortoccupied       AS belegte_plaetze,
    pd.belegung_prozent    AS belegung_prozent
FROM
    parkhaeuser AS ph
LEFT JOIN
    parking_data AS pd ON ph.id = pd.parkhaus_id
    AND pd.time = (
        SELECT MAX(time) 
        FROM parking_data 
        WHERE parkhaus_id = ph.id
    )
ORDER BY ph.id
";

    // Bereitet die SQL-Anweisung vor
    $stmt = $pdo->prepare($sql);

    // Führt die Abfrage mit der Standortvariablen aus, die in einem Array übergeben wird
    // Die Standortvariable ersetzt das erste Fragezeichen in der SQL-Anweisung
    $stmt->execute();

    // Holt alle passenden Einträge
    $results = $stmt->fetchAll();

    // Gibt die Ergebnisse im JSON-Format zurück
    echo json_encode($results);

} catch (PDOException $e) {
    // Gibt eine Fehlermeldung zurück, wenn etwas schiefgeht
    echo json_encode(['error' => $e->getMessage()]);
}