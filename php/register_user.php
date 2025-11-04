<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1); // Disable error display, handle errors properly

$host = "db.r1.websupport.sk";
$user = "unitadmin";
$pass = ".Lo9,ki8";
$dbname = "unitmate";
$port = 5432;

try {
    $conn_string = "host=$host port=$port dbname=$dbname user=$user password=$pass";
    $conn = pg_connect($conn_string);

    if (!$conn) {
        throw new Exception("Database connection failed");
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
    if (
        empty($data['firstname']) || empty($data['lastname']) ||
        empty($data['login']) || empty($data['password'])
    ) {
        throw new Exception("Missing required fields");
    }

    // Prepare the SQL query
    $sql = 'INSERT INTO users (firstname, lastname, login, password, role, telephone, email, address, date_joined) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);';

    // Parameters array
    $params = array(
        $data['firstname'],
        $data['lastname'],
        $data['login'],
        password_hash($data['password'], PASSWORD_DEFAULT),
        'z', // Default role
        $data['telephone'] ?? null,
        $data['email'] ?? null,
        $data['address'] ?? null,
        date('Y-m-d') // Current timestamp
    );

    // Execute query
    $result = pg_query_params($conn, $sql, $params);

    if (!$result) {
    $err = pg_last_error($conn);
    error_log("DB ERROR: " . $err);
    throw new Exception("Database query failed: " . $err);
}

    echo json_encode(['success' => true, 'message' => 'User registered successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        pg_close($conn);
    }
}
?>
