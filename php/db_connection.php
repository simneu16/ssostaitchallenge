<?php
function OpenConnection()
{
    $host = 'db.r1.websupport.sk';
    $port = '5432';
    $dbname = 'unitmate';
    $user = 'unitadmin';
    $password = '.Lo9,ki8';

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
