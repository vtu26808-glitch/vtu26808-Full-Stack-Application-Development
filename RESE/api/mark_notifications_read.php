<?php
require_once __DIR__ . '/db.php';

if (!isLoggedIn()) {
    respond(['success' => false, 'message' => 'Authentication required'], 401);
}

$db = getDB();

$stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
$stmt->execute([currentUserId()]);

respond(['success' => true, 'message' => 'Notifications marked as read']);
