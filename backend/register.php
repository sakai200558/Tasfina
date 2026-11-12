
<?php

<<<<<<< HEAD
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

$pdo = null;

try {

    // JSON取得
    $query = json_decode(file_get_contents("php://input"), true);

    if (!is_array($query)) {
        throw new Exception("不正なJSONです");
    }

    $useremail = trim($query["email"] ?? "");
    $rawPassword = $query["password"] ?? "";
    $username2 = trim($query["username"] ?? "");
    $group_id = $query["deptCode"] ?? null;
    $specialCode = $query["specialCode"] ?? "";

    if ($useremail === "" || $username2 === "" || $rawPassword === "") {
        throw new Exception("必須項目が入力されていません");
    }

    // パスワードを安全にハッシュ化
    $userpassword = password_hash($rawPassword, PASSWORD_DEFAULT);

    // グループIDの形式確認
    if (!empty($group_id)) {
        $group_id = filter_var($group_id, FILTER_VALIDATE_INT);

        if ($group_id === false || $group_id <= 0) {
            throw new Exception("企業IDが不正です");
        }
    } else {
        $group_id = null;
    }

    $date = date("Y-m-d H:i:s");
=======
header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "Tasfina_db";
$dbUsername = "root";
$dbPassword = "password";
$charset = "utf8mb4";

function sendJson($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJson(405, [
        "success" => false,
        "comment" => "POSTで送信してください。"
    ]);
}

$query = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($query)) {
    sendJson(400, [
        "success" => false,
        "comment" => "送信データが不正です。"
    ]);
}

$displayName = trim($query["username"] ?? "");
$email = trim($query["email"] ?? "");
$userPassword = $query["password"] ?? "";
$deptCode = trim($query["deptCode"] ?? "");

if ($displayName === "" || mb_strlen($displayName) > 100) {
    sendJson(400, [
        "success" => false,
        "comment" => "ユーザー名を確認してください。"
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, [
        "success" => false,
        "comment" => "正しいメールアドレスを入力してください。"
    ]);
}

if (!is_string($userPassword) || strlen($userPassword) < 8) {
    sendJson(400, [
        "success" => false,
        "comment" => "パスワードは8文字以上で入力してください。"
    ]);
}

// 権限は利用者が自由に指定できないようにする
$roleCode = 3000;
$levelFactor = 0;

$passwordHash = password_hash(
    $userPassword,
    PASSWORD_DEFAULT
);

$date = date("Y-m-d H:i:s");

try {

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

    // メールアドレス重複チェック
    $stmt = $pdo->prepare("
        SELECT user_id
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $stmt->execute([
        ":email" => $email
    ]);

    if ($stmt->fetch()) {
        sendJson(409, [
            "success" => false,
            "comment" => "このメールアドレスは既に登録されています。"
        ]);
    }

    // ユーザー名重複チェック
    $stmt = $pdo->prepare("
        SELECT user_id
        FROM users
        WHERE display_name = :display_name
        LIMIT 1
    ");
>>>>>>> 9708c0c6a39f92d1b0ba6b93aae905927090f612

    $stmt->execute([
        ":display_name" => $displayName
    ]);

<<<<<<< HEAD
    $pdo->beginTransaction();

    // ユーザー名重複確認
    $sql = "SELECT user_id FROM users
            WHERE display_name = :display_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':display_name' => $username2
    ]);

    if ($stmt->fetch()) {
        throw new Exception("そのユーザー名はもう使われています。");
    }

    // メールアドレス重複確認
    $sql = "SELECT user_id FROM users
            WHERE email = :email";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':email' => $useremail
    ]);

    if ($stmt->fetch()) {
        throw new Exception("そのメールアドレスは既に使用されています。");
    }

    /*
     * 1. ユーザー登録
     */

    $sql = "INSERT INTO users
            (display_name, email, password_hash, role_code,
             level_factor, created_at)
            VALUES
            (:display_name, :email, :password_hash, :role_code,
             :level_factor, :created_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':display_name' => $username2,
        ':email' => $useremail,
        ':password_hash' => $userpassword,
        ':role_code' => $specialCode,
        ':level_factor' => 0,
        ':created_at' => $date
    ]);

    $new_user_id = (int)$pdo->lastInsertId();

    /*
     * 2. グループの確認・作成
     */

    if ($group_id !== null) {

        // 既存グループに参加
        $sql = "SELECT group_id, group_name
                FROM member
                WHERE group_id = :group_id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':group_id' => $group_id
        ]);

        $member = $stmt->fetch();

        if (!$member) {
            throw new Exception("企業IDが無効です");
        }

        $new_group_id = (int)$member['group_id'];
        $group_name = $member['group_name'];

    } else {

        // 新規グループ作成
        $group_name = $username2 . "のグループ";

        $sql = "INSERT INTO member
                (group_name, owner_id, created_at)
                VALUES
                (:group_name, :owner_id, :created_at)";
=======
    if ($stmt->fetch()) {
        sendJson(409, [
            "success" => false,
            "comment" => "そのユーザー名はもう使われています。"
        ]);
    }

    $groupId = null;
    $groupName = null;

    // 部門コードが指定されている場合
    if ($deptCode !== "") {

        $stmt = $pdo->prepare("
            SELECT group_id, group_name
            FROM user_groups
            WHERE group_id = :group_id
            LIMIT 1
        ");

        $stmt->execute([
            ":group_id" => $deptCode
        ]);

        $group = $stmt->fetch();

        if (!$group) {
            sendJson(400, [
                "success" => false,
                "comment" => "指定された部門コードが見つかりません。"
            ]);
        }

        $groupId = $group["group_id"];
        $groupName = $group["group_name"];
    }

    // ここから登録処理
    $pdo->beginTransaction();

    if ($groupId !== null) {

        $sql = "
            INSERT INTO users (
                display_name,
                email,
                password_hash,
                role_code,
                level_factor,
                created_at,
                group_id
            ) VALUES (
                :display_name,
                :email,
                :password_hash,
                :role_code,
                :level_factor,
                :created_at,
                :group_id
            )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ":display_name" => $displayName,
            ":email" => $email,
            ":password_hash" => $passwordHash,
            ":role_code" => $roleCode,
            ":level_factor" => $levelFactor,
            ":created_at" => $date,
            ":group_id" => $groupId
        ]);

    } else {

        $sql = "
            INSERT INTO users (
                display_name,
                email,
                password_hash,
                role_code,
                level_factor,
                created_at
            ) VALUES (
                :display_name,
                :email,
                :password_hash,
                :role_code,
                :level_factor,
                :created_at
            )
        ";
>>>>>>> 9708c0c6a39f92d1b0ba6b93aae905927090f612

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
<<<<<<< HEAD
            ':group_name' => $group_name,
            ':owner_id' => $new_user_id,
            ':created_at' => $date
        ]);

        // memberで発行されたグループIDを取得
        $new_group_id = (int)$pdo->lastInsertId();

    }

    /*
     * 3. usersにgroup_idを設定
     */

    $sql = "UPDATE users
            SET group_id = :group_id
            WHERE user_id = :user_id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id,
        ':user_id' => $new_user_id
    ]);

    /*
     * 4. user_groups登録
     */

    $sql = "INSERT INTO user_groups
            (group_id, user_id, group_name, created_at)
            VALUES
            (:group_id, :user_id, :group_name, :created_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id,
        ':user_id' => $new_user_id,
        ':group_name' => $group_name,
        ':created_at' => $date
    ]);

    /*
     * 5. workload_scores登録
     */

    $sql = "INSERT INTO workload_scores
            (user_id, group_id, task_pt, shift_pt,
             busy_day_pt, total_score)
            VALUES
            (:user_id, :group_id, :task_pt, :shift_pt,
             :busy_day_pt, :total_score)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':group_id' => $new_group_id,
        ':task_pt' => 0,
        ':shift_pt' => 0,
        ':busy_day_pt' => 0,
        ':total_score' => 0
    ]);

    /*
     * 6. departments登録
     *
     * 現在の元コードと同様、ユーザー登録ごとに
     * departmentsのレコードを1件作成する。
     */

    $sql = "INSERT INTO departments
            (group_id)
            VALUES
            (:group_id)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id
    ]);

    $new_dept_id = (int)$pdo->lastInsertId();

    /*
     * 7. department_members登録
     */

    $sql = "INSERT INTO department_members
            (user_id, dept_id, joined_at)
            VALUES
            (:user_id, :dept_id, :joined_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':dept_id' => $new_dept_id,
        ':joined_at' => $date
    ]);

    /*
     * 8. shifts登録
     */

    $sql = "INSERT INTO shifts
            (user_id, created_at, updated_at, group_id)
            VALUES
            (:user_id, :created_at, :updated_at, :group_id)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':created_at' => $date,
        ':updated_at' => $date,
        ':group_id' => $new_group_id
    ]);

    // 全処理成功
    $pdo->commit();

    echo json_encode([
        "comment" => "成功しました。",
        "success" => true,
        "user_id" => $new_user_id,
        "group_id" => $new_group_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->getMessage());

    echo json_encode([
        "comment" => $e->getMessage(),
        "success" => false
    ], JSON_UNESCAPED_UNICODE);

}

?>
=======
            ":display_name" => $displayName,
            ":email" => $email,
            ":password_hash" => $passwordHash,
            ":role_code" => $roleCode,
            ":level_factor" => $levelFactor,
            ":created_at" => $date
        ]);
    }

    $newUserId = $pdo->lastInsertId();

    // 部門コードがある場合は所属情報も登録
    if ($groupId !== null) {

        $stmt = $pdo->prepare("
            INSERT INTO user_groups (
                group_id,
                user_id,
                group_name,
                created_at
            ) VALUES (
                :group_id,
                :user_id,
                :group_name,
                :created_at
            )
        ");

        $stmt->execute([
            ":group_id" => $groupId,
            ":user_id" => $newUserId,
            ":group_name" => $groupName,
            ":created_at" => $date
        ]);
    }

    $pdo->commit();

    sendJson(201, [
        "success" => true,
        "comment" => "新規登録が完了しました。"
    ]);

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("新規登録DBエラー: " . $e->getMessage());

    sendJson(500, [
        "success" => false,
        "comment" => "データベースへの登録に失敗しました。"
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("新規登録エラー: " . $e->getMessage());

    sendJson(500, [
        "success" => false,
        "comment" => "新規登録処理に失敗しました。"
    ]);
}
>>>>>>> 9708c0c6a39f92d1b0ba6b93aae905927090f612
