
<?php

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

    $stmt->execute([
        ":display_name" => $displayName
    ]);

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

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
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
