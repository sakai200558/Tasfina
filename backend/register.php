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

$useremail = $query["email"];
$userpassword = hash("sha256", $query["password"]);
$username2 = $query["username"];
$group_id = $query["deptCode"];
$specialCode = $query["specialCode"];
$date = date("Y-m-d H:i:s");

try {

    if($group_id)
    {
        $pdo = new PDO($dsn, $username, $password, $options);

        $sql  = ("select group_id from member where group_id = :group_id");
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':group_id', $useremail, PDO::PARAM_STR);

        $stmt->execute();
        $rows = $stmt->fetchAll();

        if(!$rows["group_id"])
        {
            echo json_encode(["comment" => "企業idが無効です", "success" => false]);
            exit(); 
        }
    }

    $aaa = 0;

    $pdo = new PDO($dsn, $username, $password, $options);

    // 例:名前付きプレースホルダ
    $sql  = "insert into users(display_name, email, password_hash, role_code, level_factor ,created_at) Values(:display_name, :email, :password_hash, :role_code, :level_factor, :created_at)";
    $stmt = $pdo->prepare($sql);



    $stmt->bindParam(':display_name', $username2, PDO::PARAM_STR);
    $stmt->bindParam(':email', $useremail, PDO::PARAM_STR);
    $stmt->bindParam(':password_hash',$userpassword, PDO::PARAM_STR);
    $stmt->bindParam(':role_code', $specialCode, PDO::PARAM_STR);
    $stmt->bindParam(':level_factor',$aaa , PDO::PARAM_STR);
    $stmt->bindParam(':created_at', $date, PDO::PARAM_STR);

    $stmt->execute();

    echo json_encode(["comment" => "成功しました。", "success" => true]);

} catch (PDOException $e) {
    error_log($e->getMessage());
    echo $e->getmessage();
}

?>