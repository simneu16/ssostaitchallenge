<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$host = "db.r1.websupport.sk";
$user = "unitadmin";
$pass = ".Lo9,ki8";
$dbname = "unitmate";
$port = 5432;

try {
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
    if (empty($data['login']) || empty($data['password'])) {
        throw new Exception("Missing login credentials");
    }

    // Connect to database
    $conn_string = "host=$host port=$port dbname=$dbname user=$user password=$pass";
    $conn = pg_connect($conn_string);

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // Prepare SQL query to fetch user
    $sql = 'SELECT "ID", firstname, lastname, "login", "password", "role" FROM users WHERE login = $1';
    $result = pg_query_params($conn, $sql, array($data['login']));

    if (!$result) {
        throw new Exception("Query failed");
    }

    $user = pg_fetch_assoc($result);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Nesprávne používateľské meno alebo heslo']);
        exit;
    }

    // Verify password
    if (password_verify($data['password'], $user['password'])) {
        // Start session and store user data
        session_start();
        $_SESSION['user_id'] = $user['ID'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['firstname'] . ' ' . $user['lastname'];

        echo json_encode([
            'success' => true,
            'message' => 'Prihlásenie úspešné',
            'user' => [
                'id' => $user['ID'],
                'name' => $user['firstname'] . ' ' . $user['lastname'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'login' => $user['login'],
                'role' => $user['role']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Nesprávne používateľské meno alebo heslo']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri prihlásení: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        pg_close($conn);
    }
}
?>