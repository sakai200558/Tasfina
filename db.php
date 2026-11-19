<?php
$host = "127.0.0.1";
$dbname = "Tasfina_db";
$username = "root";
$password = "password";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(["status" => "error", "message" => "DB接続失敗: " . $e->getMessage()]);
    exit;
}
