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

    $conn = OpenConnection();

    // Build update query dynamically based on provided fields
    $updateFields = array();
    $params = array();
    $paramCount = 1;

    if (isset($data['firstname']) && !empty($data['firstname'])) {
        $updateFields[] = "firstname = $" . $paramCount;
        $params[] = $data['firstname'];
        $paramCount++;
    }

    if (isset($data['lastname']) && !empty($data['lastname'])) {
        $updateFields[] = "lastname = $" . $paramCount;
        $params[] = $data['lastname'];
        $paramCount++;
    }

    if (isset($data['email'])) {
        $updateFields[] = "email = $" . $paramCount;
        $params[] = $data['email'] ?: null;
        $paramCount++;
    }

    if (isset($data['telephone'])) {
        $updateFields[] = "telephone = $" . $paramCount;
        $params[] = $data['telephone'] ?: null;
        $paramCount++;
    }

    if (isset($data['address'])) {
        $updateFields[] = "address = $" . $paramCount;
        $params[] = $data['address'] ?: null;
        $paramCount++;
    }

    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }

    // Add user_id to params
    $params[] = $_SESSION["user_id"];

    // Build and execute update query
    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE "ID" = $' . $paramCount;

    $result = pg_query_params($conn, $sql, $params);

    if (!$result) {
        throw new Exception("Failed to update user: " . pg_last_error($conn));
    }

    // Fetch updated user data
    $fetchSql = 'SELECT "ID", firstname, lastname, login, role, telephone, email, address FROM users WHERE "ID" = $1';
    $fetchResult = pg_query_params($conn, $fetchSql, array($_SESSION["user_id"]));

    if (!$fetchResult) {
        throw new Exception("Failed to fetch updated user data");
    }

    $updatedUser = pg_fetch_assoc($fetchResult);

    echo json_encode([
        'success' => true,
        'message' => 'User updated successfully',
        'user' => $updatedUser
    ]);

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