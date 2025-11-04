<?php
// php/admin/get_all_orders.php
header('Content-Type: application/json');
require_once '../auth_middleware.php';

requireAdmin(); // Admin or Super Admin can view all orders

include '../db_connection.php';

try {
    $conn = OpenConnection();
    
    $sql = 'SELECT 
                o."ID" as order_id,
                o.status,
                o.created_date,
                o.preferred_date,
                o.total_price,
                o.install_package,
                u.firstname,
                u.lastname,
                u.address,
                string_agg(CONCAT(p.name, \' (\', op.qty, \'x)\'), \', \') as products
            FROM orders o
            JOIN users u ON o.user_id = u."ID"
            JOIN order_items op ON o."ID" = op.order_id
            JOIN products p ON op.product_id = p."ID"
            GROUP BY 
                o."ID",
                o.status,
                o.created_date,
                o.preferred_date,
                o.total_price,
                o.install_package,
                u.firstname,
                u.lastname,
                u.address
            ORDER BY o.created_date DESC';
    
    $result = pg_query($conn, $sql);
    
    if (!$result) {
        throw new Exception("Query failed: " . pg_last_error($conn));
    }
    
    $orders = array();
    while ($row = pg_fetch_assoc($result)) {
        $orders[] = array(
            'order_id' => $row['order_id'],
            'id' => 'ORD-' . str_pad($row['order_id'], 3, '0', STR_PAD_LEFT),
            'customerName' => $row['firstname'] . ' ' . $row['lastname'],
            'deliveryAddress' => $row['address'],
            'products' => $row['products'],
            'status' => $row['status'],
            'price' => $row['total_price'] . '€',
            'deliveryDate' => date('d.m.Y', strtotime($row['preferred_date'])),
            'deliveryTime' => date('H:i', strtotime($row['preferred_date']))
        );
    }
    
    echo json_encode($orders);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>