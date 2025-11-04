<?php
// php/admin/update_user.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireSuperAdmin(); // Only super admin can update users

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id'])) {
        throw new Exception("User ID is required");
    }
    
    $conn = OpenConnection();
    
    $updateFields = [];
    $params = [];
    $paramCount = 1;
    
    if (isset($data['firstname'])) {
        $updateFields[] = "firstname = $$paramCount";
        $params[] = $data['firstname'];
        $paramCount++;
    }
    
    if (isset($data['lastname'])) {
        $updateFields[] = "lastname = $$paramCount";
        $params[] = $data['lastname'];
        $paramCount++;
    }
    
    if (isset($data['login'])) {
        $updateFields[] = "login = $$paramCount";
        $params[] = $data['login'];
        $paramCount++;
    }
    
    if (isset($data['password']) && !empty($data['password'])) {
        $updateFields[] = "password = $$paramCount";
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        $paramCount++;
    }
    
    if (isset($data['role'])) {
        $updateFields[] = "role = $$paramCount";
        $params[] = $data['role'];
        $paramCount++;
    }
    
    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }
    
    $params[] = $data['id'];
    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE "ID" = $' . $paramCount;
    
    $result = pg_query_params($conn, $sql, $params);
    
    if (!$result) {
        throw new Exception("Update failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Používateľ bol úspešne aktualizovaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>