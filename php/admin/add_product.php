<?php
// php/admin/add_product.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can add products

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate required fields
    if (!isset($data['name']) || !isset($data['category']) || !isset($data['base_price'])) {
        throw new Exception("Name, category, and base_price are required");
    }
    
    $conn = OpenConnection();
    
    // Check if product already exists
    $checkSql = 'SELECT name FROM products WHERE name = $1';
    $checkResult = pg_query_params($conn, $checkSql, array($data['name']));
    
    if (pg_num_rows($checkResult) > 0) {
        throw new Exception("Produkt s týmto názvom už existuje");
    }
    
    $sql = 'INSERT INTO products (name, category, base_price, status, description, params, photo_link) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)';
    
    $params = array(
        $data['name'],
        $data['category'],
        $data['base_price'],
        $data['status'] ?? 0,
        $data['description'] ?? '',
        isset($data['params']) ? json_encode($data['params']) : '{}',
        $data['photo_link'] ?? ''
    );
    
    $result = pg_query_params($conn, $sql, $params);
    
    if (!$result) {
        throw new Exception("Insert failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Produkt bol úspešne pridaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>