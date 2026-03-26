<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    respond(['success' => false, 'message' => 'Email and password are required'], 400);
}

$db = getDB();

$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    respond(['success' => false, 'message' => 'Invalid email or password'], 401);
}

$_SESSION['user_id']  = (int)$user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email']    = $user['email'];

respond(['success' => true, 'message' => 'Login successful', 'user' => [
    'id'           => (int)$user['id'],
    'username'     => $user['username'],
    'email'        => $user['email'],
    'avatar_color' => $user['avatar_color'],
]]);
