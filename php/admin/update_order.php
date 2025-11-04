<?php
// php/admin/update_order.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can update orders

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['order_id'])) {
        throw new Exception("Order ID is required");
    }
    
    if (!isset($data['status'])) {
        throw new Exception("Status is required");
    }
    
    $conn = OpenConnection();
    
    $sql = 'UPDATE orders SET status = $1 WHERE "ID" = $2';
    $result = pg_query_params($conn, $sql, array($data['status'], $data['order_id']));
    
    if (!$result) {
        throw new Exception("Update failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Stav objednávky bol úspešne zmenený']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>