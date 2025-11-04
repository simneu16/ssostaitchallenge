<?php
// php/admin/update_product.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can update products

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['name'])) {
        throw new Exception("Product name is required");
    }
    
    $conn = OpenConnection();
    
    $updateFields = [];
    $params = [];
    $paramCount = 1;
    
    if (isset($data['category'])) {
        $updateFields[] = "category = $$paramCount";
        $params[] = $data['category'];
        $paramCount++;
    }
    
    if (isset($data['base_price'])) {
        $updateFields[] = "base_price = $$paramCount";
        $params[] = $data['base_price'];
        $paramCount++;
    }
    
    if (isset($data['status'])) {
        $updateFields[] = "status = $$paramCount";
        $params[] = $data['status'];
        $paramCount++;
    }
    
    if (isset($data['description'])) {
        $updateFields[] = "description = $$paramCount";
        $params[] = $data['description'];
        $paramCount++;
    }
    
    if (isset($data['params'])) {
        $updateFields[] = "params = $$paramCount";
        $params[] = json_encode($data['params']);
        $paramCount++;
    }
    
    if (isset($data['photo_link'])) {
        $updateFields[] = "photo_link = $$paramCount";
        $params[] = $data['photo_link'];
        $paramCount++;
    }
    
    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }
    
    $params[] = $data['name'];
    $sql = 'UPDATE products SET ' . implode(', ', $updateFields) . ' WHERE name = $' . $paramCount;
    
    $result = pg_query_params($conn, $sql, $params);
    
    if (!$result) {
        throw new Exception("Update failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Produkt bol úspešne aktualizovaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>