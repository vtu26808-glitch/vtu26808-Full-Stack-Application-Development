<?php
$pdo = new PDO('mysql:host=localhost;charset=utf8mb4', 'root', 'Krishna@123', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

echo "Dropping old database...\n";
$pdo->exec('DROP DATABASE IF EXISTS event_sync_engine');
echo "Database dropped.\n";

// Now re-import schema.sql
$sql = file_get_contents(__DIR__ . '/schema.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

foreach ($statements as $stmt) {
    if (empty($stmt)) continue;
    try {
        $pdo->exec($stmt);
        $preview = substr(preg_replace('/\s+/', ' ', $stmt), 0, 60);
        echo "OK: $preview...\n";
    } catch (PDOException $e) {
        echo "ERR: " . $e->getMessage() . "\n";
    }
}

echo "\nDone! Fresh database created.\n";

// Verify
$pdo->exec('USE event_sync_engine');
$tables = ['users','events','event_updates','notifications'];
foreach ($tables as $t) {
    echo "\n=== $t ===\n";
    $cols = $pdo->query("DESCRIBE $t")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "  " . $c['Field'] . " (" . $c['Type'] . ") " . $c['Key'] . "\n";
    }
}
