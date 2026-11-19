<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "Tasfina_db";
$dbUsername = "root";
$dbPassword = "password";
$charset = "utf8mb4";



$query = json_decode(file_get_contents("php://input"), true);

$system_name = $query["systemName"];
$company_name = $query["companyName"];
$time_zone = $query["timeZone"];
$week_start = $query["weekStart"];
$date_format = $query["dateFormat"];



                

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

    $pdo = new PDO(
        $dsn,
        $dbUsername,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    $sql  = "select * from system_settings where id = :user_id";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':user_id', $_SESSION["user_id"], PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode([
    "success" => true,
    "settings" => $rows
], JSON_UNESCAPED_UNICODE);

?>