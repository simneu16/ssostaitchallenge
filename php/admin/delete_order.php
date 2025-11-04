<?php
// php/admin/delete_order.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can delete orders

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['order_id'])) {
        throw new Exception("Order ID is required");
    }
    
    $conn = OpenConnection();
    
    // Start transaction
    pg_query($conn, 'BEGIN');
    
    // Delete order items first (foreign key constraint)
    $sql1 = 'DELETE FROM order_items WHERE order_id = $1';
    $result1 = pg_query_params($conn, $sql1, array($data['order_id']));
    
    if (!$result1) {
        pg_query($conn, 'ROLLBACK');
        throw new Exception("Failed to delete order items: " . pg_last_error($conn));
    }
    
    // Delete order
    $sql2 = 'DELETE FROM orders WHERE "ID" = $1';
    $result2 = pg_query_params($conn, $sql2, array($data['order_id']));
    
    if (!$result2) {
        pg_query($conn, 'ROLLBACK');
        throw new Exception("Failed to delete order: " . pg_last_error($conn));
    }
    
    // Commit transaction
    pg_query($conn, 'COMMIT');
    
    echo json_encode(['success' => true, 'message' => 'Objednávka bola úspešne vymazaná']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>