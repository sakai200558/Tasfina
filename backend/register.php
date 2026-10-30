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

$pdo = new PDO($dsn, $username, $password, $options);

$sql  = ("select display_name from users where display_name = :display_name");
$stmt = $pdo->prepare($sql);

$stmt->bindParam(':dispaly_name', $username2, PDO::PARAM_STR);

$stmt->execute();
$rows = $stmt->fetchAll();
if(count($rows) === 0)
{
    echo json_encode(["comment" => "そのユーザー名はもう使われています。", "success" => false]);
    exit();
}



try {

    if($group_id)
    {
        $pdo = new PDO($dsn, $username, $password, $options);

        $sql  = ("select group_id, group_name from member where group_id = :group_id");
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':group_id', $useremail, PDO::PARAM_STR);

        $stmt->execute();
        $rows = $stmt->fetchAll();
        $group_name = $rows["group_name"];

        if(!$rows["group_id"])
        {
            echo json_encode(["comment" => "企業idが無効です", "success" => false]);
            exit(); 
        }

        // 例:名前付きプレースホルダ
        $sql  = "insert into users(display_name, email, password_hash, role_code, level_factor, created_at, group_id) Values(:display_name, :email, :password_hash, :role_code, :level_factor, :created_at, :group_id)";
        $stmt = $pdo->prepare($sql);


        $stmt->bindParam(':display_name', $username2, PDO::PARAM_STR);
        $stmt->bindParam(':email', $useremail, PDO::PARAM_STR);
        $stmt->bindParam(':password_hash',$userpassword, PDO::PARAM_STR);
        $stmt->bindParam(':role_code', $specialCode, PDO::PARAM_STR);
        $stmt->bindParam(':level_factor',$aaa , PDO::PARAM_STR);
        $stmt->bindParam(':created_at', $date, PDO::PARAM_STR);
        $stmt->bindParam(':group_id', $group_id, PDO::PARAM_INT);

        $stmt->execute();


        $sql  = "select * from users where email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $useremail ,PDO::PARAM_STR);
        $stmt->execute();
        $rows = $stmt->fetchAll();


        $sql  = "INSERT INTO user_groups(group_id, user_id, group_name, created_at) VALUE(:group_id, :user_id, :group_name, :created_at)";
        $stmt->bindParam(':group_id', $group_id, PDO::PARAM_STR);
        $stmt->bindParam(':user_id', $rows["user_id"], PDO::PARAM_STR);
        $stmt->bindParam(':group_name',$group_name, PDO::PARAM_STR);
        $stmt->bindParam(':created_at', $date, PDO::PARAM_STR);

        $stmt->execute();


        echo json_encode(["comment" => "成功しました。", "success" => true]);
        exit();
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