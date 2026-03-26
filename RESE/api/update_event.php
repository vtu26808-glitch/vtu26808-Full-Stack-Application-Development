<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed'], 405);
}

if (!isLoggedIn()) {
    respond(['success' => false, 'message' => 'Authentication required'], 401);
}

$data = json_decode(file_get_contents('php://input'), true);

$event_id   = (int)($data['event_id'] ?? 0);
$new_status = $data['status'] ?? '';
$message    = trim($data['message'] ?? '');

if (!$event_id) {
    respond(['success' => false, 'message' => 'Event ID is required'], 400);
}

$allowed = ['upcoming','ongoing','completed','cancelled'];
if (!in_array($new_status, $allowed)) {
    respond(['success' => false, 'message' => 'Invalid status'], 400);
}

$db = getDB();

// Get current event
$stmt = $db->prepare('SELECT * FROM events WHERE id = ?');
$stmt->execute([$event_id]);
$event = $stmt->fetch();

if (!$event) {
    respond(['success' => false, 'message' => 'Event not found'], 404);
}

$old_status = $event['status'];

// Update event
$stmt = $db->prepare('UPDATE events SET status = ? WHERE id = ?');
$stmt->execute([$new_status, $event_id]);

// Log the update
$logStmt = $db->prepare(
    'INSERT INTO event_updates (event_id, user_id, old_status, new_status, message) VALUES (?, ?, ?, ?, ?)'
);
$logStmt->execute([$event_id, currentUserId(), $old_status, $new_status, $message ?: 'Status updated']);

// Notify all users except the updater
$users = $db->query('SELECT id FROM users WHERE id != ' . (int)currentUserId())->fetchAll();
$notifStmt = $db->prepare('INSERT INTO notifications (user_id, event_id, message) VALUES (?, ?, ?)');
$notifMsg = currentUserName() . ' updated "' . $event['title'] . '" → ' . ucfirst($new_status);
foreach ($users as $u) {
    $notifStmt->execute([$u['id'], $event_id, $notifMsg]);
}

respond(['success' => true, 'message' => 'Event updated']);
