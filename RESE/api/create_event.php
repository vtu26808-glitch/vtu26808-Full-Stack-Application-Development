<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed'], 405);
}

if (!isLoggedIn()) {
    respond(['success' => false, 'message' => 'Authentication required'], 401);
}

$data = json_decode(file_get_contents('php://input'), true);

$title       = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$category    = $data['category'] ?? 'other';
$event_date  = $data['event_date'] ?? '';
$location    = trim($data['location'] ?? '');

if (empty($title) || empty($event_date)) {
    respond(['success' => false, 'message' => 'Title and event date are required'], 400);
}

$allowed_categories = ['meeting','workshop','webinar','social','other'];
if (!in_array($category, $allowed_categories)) {
    $category = 'other';
}

$db = getDB();

$stmt = $db->prepare(
    'INSERT INTO events (title, description, category, event_date, location, created_by)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$title, $description, $category, $event_date, $location, currentUserId()]);

$eventId = $db->lastInsertId();

// Create a notification for all users about the new event
$users = $db->query('SELECT id FROM users WHERE id != ' . (int)currentUserId())->fetchAll();
$notifStmt = $db->prepare('INSERT INTO notifications (user_id, event_id, message) VALUES (?, ?, ?)');
$msg = currentUserName() . ' created a new event: ' . $title;
foreach ($users as $u) {
    $notifStmt->execute([$u['id'], $eventId, $msg]);
}

// Log the creation in event_updates
$logStmt = $db->prepare(
    'INSERT INTO event_updates (event_id, user_id, old_status, new_status, message) VALUES (?, ?, ?, ?, ?)'
);
$logStmt->execute([$eventId, currentUserId(), null, 'upcoming', 'Event created']);

respond(['success' => true, 'message' => 'Event created', 'event_id' => (int)$eventId]);
