<?php
require_once __DIR__ . '/db.php';

if (isLoggedIn()) {
    $db = getDB();
    $stmt = $db->prepare('SELECT id, username, email, avatar_color FROM users WHERE id = ?');
    $stmt->execute([currentUserId()]);
    $user = $stmt->fetch();
    respond(['loggedIn' => true, 'user' => $user]);
} else {
    respond(['loggedIn' => false]);
}
