<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include 'db_connection.php';

try {
    if (!isset($_SESSION["user_id"])) {
        throw new Exception("User not authenticated");
    }

    $conn = OpenConnection();

    // Query to get orders with user info and products
    $sql = 'SELECT 
                o."ID" as order_id,
                o.status,
                o.created_date,
                o.preferred_date,
                o.total_price,
                o.install_package,
                u.firstname,
                u.lastname,
                o.delivery_adress,
                string_agg(CONCAT(p.name, \' (\', op.qty, \'x)\'), \', \') as products
            FROM orders o
            JOIN users u ON o.user_id = u."ID"
            JOIN order_items op ON o."ID" = op.order_id
            JOIN products p ON op.product_id = p."ID"
            WHERE o.user_id = ' . $_SESSION["user_id"] . '
            GROUP BY 
                o."ID",
                o.status,
                o.created_date,
                o.preferred_date,
                o.total_price,
                o.install_package,
                u.firstname,
                u.lastname,
                o.delivery_adress
            ORDER BY o.created_date DESC';


    $result = pg_query($conn, $sql);

    if (!$result) {
        throw new Exception("Query failed: " . pg_last_error($conn));
    }

    $orders = array();
    while ($row = pg_fetch_assoc($result)) {
        // Format the data for frontend
        $orders[] = array(
            'id' => 'ORD-' . str_pad($row['order_id'], 3, '0', STR_PAD_LEFT),
            'customerName' => $row['firstname'] . ' ' . $row['lastname'],
            'deliveryAddress' => $row['delivery_adress'],
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