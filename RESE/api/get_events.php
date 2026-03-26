<?php
require_once __DIR__ . '/db.php';

if (!isLoggedIn()) {
    respond(['success' => false, 'message' => 'Authentication required'], 401);
}

$db = getDB();

// Optional filters
$status   = $_GET['status'] ?? '';
$category = $_GET['category'] ?? '';
$since    = $_GET['since'] ?? '';   // ISO timestamp for polling – return only events updated after this time

$sql    = 'SELECT e.*, u.username AS creator_name, u.avatar_color
           FROM events e
           JOIN users u ON e.created_by = u.id';
$where  = [];
$params = [];

if ($status && in_array($status, ['upcoming','ongoing','completed','cancelled'])) {
    $where[]  = 'e.status = ?';
    $params[] = $status;
}
if ($category && in_array($category, ['meeting','workshop','webinar','social','other'])) {
    $where[]  = 'e.category = ?';
    $params[] = $category;
}
if ($since) {
    $where[]  = 'e.updated_at > ?';
    $params[] = $since;
}

if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY e.event_date ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$events = $stmt->fetchAll();

respond(['success' => true, 'events' => $events, 'server_time' => date('Y-m-d H:i:s')]);
