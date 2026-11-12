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

$query = json_decode(file_get_contents("php://input"), true);



try {
    $pdo = new PDO($dsn, $username, $password, $options);

    // 例:名前付きプレースホルダ
    $sql  = "SELECT * FROM workload_scores where ranking_id = :";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':email', $useremail, PDO::PARAM_STR);

    $stmt->execute();
    $rows = $stmt->fetch();

    

} catch (PDOException $e) {
    error_log($e->getMessage());
    exit('DB error');
}

?>