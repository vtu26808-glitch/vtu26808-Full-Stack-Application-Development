<?php
$pdo = new PDO('mysql:host=localhost;dbname=event_sync_engine;charset=utf8mb4', 'root', 'Krishna@123', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);
$tables = ['users','events','event_updates','notifications'];
foreach ($tables as $t) {
    echo "\n=== $t ===\n";
    $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo $c['Field'] . ' (' . $c['Type'] . ') ' . $c['Key'] . "\n";
    }
}
