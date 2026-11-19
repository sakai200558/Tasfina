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

$departmentName = $query["name"];
$parentDepartment = $query["parentDepartment"];
$departmentDescription = $query["description"];
$bi_bi_check_lg = $query["icon"];
$departmentIcon = $query["color"];
$departmentManager = $query["manager"];
$memberSearch = $query["members"];
$date = date("Y-m-d H:i:s");



try {
    $pdo = new PDO($dsn, $username, $password, $options);

    $sql  = "INSERT INTO member(group_name, owner_id, created_at) VALUES(:group_name, :owner_id, :created_at)";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':group_name', $departmentName, PDO::PARAM_STR);
    $stmt->bindParam(':owner_id', $useremail, PDO::PARAM_STR);
    $stmt->bindParam(':created_at', $useremail, PDO::PARAM_STR);

    $stmt->execute();
    

} catch (PDOException $e) {
    error_log($e->getMessage());
    exit('DB error');
}

?>