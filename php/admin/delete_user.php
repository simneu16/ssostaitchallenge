<?php
// php/admin/delete_user.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireSuperAdmin(); // Only super admin can delete users

include '../db_connection.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['id'])) {
        throw new Exception("User ID is required");
    }
    
    // Prevent deleting yourself
    if ($data['id'] == $_SESSION['user_id']) {
        throw new Exception("Nemôžete vymazať svoj vlastný účet");
    }
    
    $conn = OpenConnection();
    
    $order_items_user = 'DELETE FROM order_items oi USING orders o WHERE oi.order_id = o."ID" AND o.user_id = $1';
    $order_items_result = pg_query_params($conn, $order_items_user, array($data['id']));

    $orders_query = 'DELETE FROM orders WHERE user_id = $1';
    $orders_result = pg_query_params($conn, $orders_query, array($data['id']));

    $user_query = 'DELETE FROM users WHERE "ID" = $1';
    $result = pg_query_params($conn, $user_query, array($data['id']));
    
    if (!$result) {
        throw new Exception("Delete failed: " . pg_last_error($conn));
    }
    
    echo json_encode(['success' => true, 'message' => 'Používateľ bol úspešne vymazaný']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>