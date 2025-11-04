<?php
function OpenConnection()
{
    $host = 'db.r1.websupport.sk';
    $port = '5432'; // Change if your DB runs on a different port
    $dbname = 'unitmate'; // Change to your database name
    $user = 'unitadmin '; // Change to your DB user
    $password = '.Lo9,ki8'; // Change to your DB password

    $conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";
    $dbconn = pg_connect($conn_string);

    if (!$dbconn) {
        throw new Exception('Could not connect to the database.');
    }
    return $dbconn;
}

function CloseConnection($conn)
{
    pg_close($conn);
}
