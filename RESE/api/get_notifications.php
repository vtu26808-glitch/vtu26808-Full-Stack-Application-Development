<?php
require_once __DIR__ . '/db.php';

if (!isLoggedIn()) {
    respond(['success' => false, 'message' => 'Authentication required'], 401);
}

$db = getDB();

$stmt = $db->prepare(
    'SELECT n.*, e.title AS event_title
     FROM notifications n
     LEFT JOIN events e ON n.event_id = e.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 30'
);
$stmt->execute([currentUserId()]);
$notifications = $stmt->fetchAll();

// Count unread
$countStmt = $db->prepare('SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0');
$countStmt->execute([currentUserId()]);
$unread = $countStmt->fetch()['cnt'];

respond(['success' => true, 'notifications' => $notifications, 'unread_count' => (int)$unread]);
