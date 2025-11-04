<?php
// php/admin/delete_product.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can delete products

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['name'])) {
        throw new Exception("Product name is required");
    }
    
    $conn = OpenConnection();
    
    $sql = 'DELETE FROM products WHERE name = $1';
    $result = pg_query_params($conn, $sql, array($data['name']));
    
    if (!$result) {
        throw new Exception("Delete failed: " . pg_last_error($conn));
    }
    
    $rowsAffected = pg_affected_rows($result);
    
    if ($rowsAffected === 0) {
        throw new Exception("Produkt nebol nájdený");
    }
    
    echo json_encode(['success' => true, 'message' => 'Produkt bol úspešne vymazaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>