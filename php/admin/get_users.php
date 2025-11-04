<?php
// php/admin/get_users.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireSuperAdmin(); // Only super admin can view users

include '../db_connection.php';

try {
    $conn = OpenConnection();
    
    $sql = 'SELECT "ID", firstname, lastname, login, role, telephone, email, address 
            FROM users 
            ORDER BY "ID" ASC';
    
    $result = pg_query($conn, $sql);
    
    if (!$result) {
        throw new Exception("Query failed: " . pg_last_error($conn));
    }
    
    $users = pg_fetch_all($result);
    
    if (!$users) {
        $users = [];
    }
    
    echo json_encode($users);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>