<?php
// auth_middleware.php - Role-based authorization middleware
session_start();

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Musíte byť prihlásený']);
        exit;
    }
}

function requireRole($allowedRoles) {
    requireLogin();
    
    if (!isset($_SESSION['user_role'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Nemáte oprávnenie']);
        exit;
    }
    
    if (!in_array($_SESSION['user_role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Nemáte dostatočné oprávnenia']);
        exit;
    }
}

function requireAdmin() {
    requireRole(['a', 's']);
}

function requireSuperAdmin() {
    requireRole(['s']);
}

function canEditHomepage() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 's';
}

function canEditUsers() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 's';
}

function canEditProducts() {
    return isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['a', 's']);
}

function canEditOrders() {
    return isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['a', 's']);
}

function getUserRole() {
    return $_SESSION['user_role'] ?? 'z';
}

function isAdmin() {
    return isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['a', 's']);
}
?>