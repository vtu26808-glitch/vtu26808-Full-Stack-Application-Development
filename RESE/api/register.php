<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validation
if (empty($username) || empty($email) || empty($password)) {
    respond(['success' => false, 'message' => 'All fields are required'], 400);
}

if (strlen($username) < 3) {
    respond(['success' => false, 'message' => 'Username must be at least 3 characters'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['success' => false, 'message' => 'Invalid email address'], 400);
}

if (strlen($password) < 6) {
    respond(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
}

$db = getDB();

// Check for existing user
$stmt = $db->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
$stmt->execute([$username, $email]);
if ($stmt->fetch()) {
    respond(['success' => false, 'message' => 'Username or email already exists'], 409);
}

// Generate random avatar colour
$colors = ['#6C63FF','#FF6584','#43B581','#FAA61A','#F04747','#7289DA','#2ECC71'];
$avatar_color = $colors[array_rand($colors)];

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $db->prepare('INSERT INTO users (username, email, password, avatar_color) VALUES (?, ?, ?, ?)');
$stmt->execute([$username, $email, $hash, $avatar_color]);

$userId = $db->lastInsertId();

// Auto-login after registration
$_SESSION['user_id']  = (int)$userId;
$_SESSION['username'] = $username;
$_SESSION['email']    = $email;

respond(['success' => true, 'message' => 'Registration successful', 'user' => [
    'id'       => (int)$userId,
    'username' => $username,
    'email'    => $email,
    'avatar_color' => $avatar_color,
]]);
