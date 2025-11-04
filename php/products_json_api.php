<?php
header('Content-Type: application/json; charset=UTF-8');

$host = "db.r1.websupport.sk";
$user = "unitadmin";
$pass = ".Lo9,ki8";
$dbname = "unitmate";
$port = 5432;

$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$pass";
$conn = pg_connect($conn_string);

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$sql = 'SELECT "name", category, base_price, "status", photo_link, "description", params FROM products;';
$result = pg_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => pg_last_error($conn)]);
    pg_close($conn);
    exit();
}

$data = pg_fetch_all($result);
if (!$data) {
    $data = [];
}

echo json_encode($data);

pg_close($conn);
?>