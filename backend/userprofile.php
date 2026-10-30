<?php

session_start();

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

$userid = $_SESSION["user_id"];

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    // 例:名前付きプレースホルダ
    $sql  = "select display_name, email, role_code, job_title, level_factor from users where user_id = :user_id";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':user_id', $userid, PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode($rows);
    

} catch (PDOException $e) {
    echo $e->getMessage();
}

?>