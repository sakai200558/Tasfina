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

$query = json_decode(file_get_contents("php://input"), true);



try {

    $pdo = new PDO($dsn, $username, $password, $options);

    // 例:名前付きプレースホルダ
    $sql  = "SELECT user_id FROM workload_scores where group_id = :group_id order by total_score DESC";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':group_id', $_SESSION["group_id"], PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll();

    $user_list = [];

    
    foreach($rows as $row)
    {

        $user_id = $row['user_id'];

    // usersからユーザー情報を取得
        $sql = "SELECT display_name
                FROM users
                WHERE user_id = :user_id";

        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);

        $stmt->execute();

        $user = $stmt->fetch();

        if ($user) {
            $user_list[] = $user;
        }


    }


    echo json_encode([
    "success" => true,
    "users" => $user_list
], JSON_UNESCAPED_UNICODE);
    

} catch (PDOException $e) {
    error_log($e->getMessage());
    exit('DB error');
}

?>