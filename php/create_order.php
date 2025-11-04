<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

include 'db_connection.php';

try {
    // Check if user is logged in
    if (!isset($_SESSION["user_id"])) {
        throw new Exception("User not authenticated");
    }

    // Get and decode POST data
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception("No input data received");
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON data received");
    }

    // Validate required fields
    if (empty($data['delivery_address']) || empty($data['preferred_date']) || empty($data['items'])) {
        throw new Exception("Missing required fields");
    }

    // Use user_id from session (most reliable) or from data
    $userId = $_SESSION["user_id"];

    $conn = OpenConnection();

    // Begin transaction
    pg_query($conn, "BEGIN");

    try {
        // Calculate total price
        $totalPrice = 0;
        foreach ($data['items'] as $item) {
            $totalPrice += $item['price'] * $item['quantity'];
        }

        // Add installation fee if required
        if (isset($data['install_package']) && $data['install_package']) {
            $totalPrice += 50;
        }

        // Prepare billing information as JSONB
        $billingInfo = json_encode($data['billing_information']);

        // Insert order into orders table
        $orderSql = 'INSERT INTO orders (status, created_date, preferred_date, total_price, install_package, user_id, delivery_adress, billing_information) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "ID"';

        $orderParams = array(
            'pending',  // status
            date('Y-m-d'),  // created_date
            $data['preferred_date'],  // preferred_date
            $totalPrice,  // total_price
            $data['install_package'] ? 't' : 'f',  // install_package
            $userId,  // user_id from session
            $data['delivery_address'],  // delivery_adress
            $billingInfo  // billing_information
        );

        $orderResult = pg_query_params($conn, $orderSql, $orderParams);

        if (!$orderResult) {
            throw new Exception("Failed to create order: " . pg_last_error($conn));
        }

        $orderRow = pg_fetch_assoc($orderResult);
        $orderId = $orderRow['ID'];

        // Insert order items
        foreach ($data['items'] as $item) {
            // First, get the product ID by name
            $productSql = 'SELECT "ID" FROM products WHERE name = $1';
            $productResult = pg_query_params($conn, $productSql, array($item['name']));

            if (!$productResult) {
                throw new Exception("Failed to find product: " . $item['name']);
            }

            $productRow = pg_fetch_assoc($productResult);
            if (!$productRow) {
                throw new Exception("Product not found: " . $item['name']);
            }

            $productId = $productRow['ID'];

            // Insert order item
            $itemSql = 'INSERT INTO order_items (order_id, product_id, qty, price) 
                       VALUES ($1, $2, $3, $4)';

            $itemParams = array(
                $orderId,
                $productId,
                $item['quantity'],
                $item['price']
            );

            $itemResult = pg_query_params($conn, $itemSql, $itemParams);

            if (!$itemResult) {
                throw new Exception("Failed to insert order item: " . pg_last_error($conn));
            }

            // Update product stock (decrease status count)
            $updateStockSql = 'UPDATE products SET status = CAST(CAST(status AS INTEGER) - $1 AS INTEGER) WHERE "ID" = $2';
            $updateStockResult = pg_query_params($conn, $updateStockSql, array($item['quantity'], $productId));

            if (!$updateStockResult) {
                throw new Exception("Failed to update product stock: " . pg_last_error($conn));
            }
        }

        // Commit transaction
        pg_query($conn, "COMMIT");

        echo json_encode([
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $orderId
        ]);

    } catch (Exception $e) {
        // Rollback transaction on error
        pg_query($conn, "ROLLBACK");
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        CloseConnection($conn);
    }
}
?>