<?php

$host = 'localhost';
$dbname = 'Tasfina_db'; // 実際のデータベース名に変更してください
$username = 'root';     // 実際のユーザー名に変更してください
$password = 'password';     // 実際のパスワードに変更してください
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    // 例:名前付きプレースホルダ
    $sql  = "SELECT * FROM users WHERE status = :status AND age >= :age";
    $stmt = $pdo->prepare($sql);

    $status = 'active';
    $age    = 20;

    $stmt->bindParam(':status', $status, PDO::PARAM_STR);
    $stmt->bindParam(':age',    $age,    PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll();

} catch (PDOException $e) {
    error_log($e->getMessage());
    exit('DB error');
}

?>