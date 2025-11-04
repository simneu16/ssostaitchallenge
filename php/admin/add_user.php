<?php
// php/admin/add_user.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireSuperAdmin(); // Only super admin can add users

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate required fields
    if (empty($data['firstname']) || empty($data['lastname']) || 
        empty($data['login']) || empty($data['password']) || 
        empty($data['role'])) {
        throw new Exception("All required fields must be filled");
    }
    
    // Validate role
    if (!in_array($data['role'], ['z', 'a', 's'])) {
        throw new Exception("Invalid role specified");
    }
    
    $conn = OpenConnection();
    
    // Check if login already exists
    $checkSql = 'SELECT login FROM users WHERE login = $1';
    $checkResult = pg_query_params($conn, $checkSql, array($data['login']));
    
    if (pg_num_rows($checkResult) > 0) {
        throw new Exception("Používateľské meno už existuje");
    }
    
    $sql = 'INSERT INTO users (firstname, lastname, login, password, role, telephone, email, address) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    
    $params = array(
        $data['firstname'],
        $data['lastname'],
        $data['login'],
        password_hash($data['password'], PASSWORD_DEFAULT),
        $data['role'],
        $data['telephone'] ?? null,
        $data['email'] ?? null,
        $data['address'] ?? null
    );
    
    $result = pg_query_params($conn, $sql, $params);
    
    if (!$result) {
        throw new Exception("Insert failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Používateľ bol úspešne pridaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>