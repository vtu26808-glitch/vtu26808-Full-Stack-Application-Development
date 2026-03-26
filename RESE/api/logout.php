<?php
require_once __DIR__ . '/db.php';

session_destroy();
respond(['success' => true, 'message' => 'Logged out successfully']);
