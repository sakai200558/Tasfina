
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "Tasfina_db";
$dbUsername = "root";
$dbPassword = "password";
$charset = "utf8mb4";

function sendJson($status, $data)
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// POST以外は拒否
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJson(405, [
        "login" => false,
        "comment" => "POSTで送信してください。"
    ]);
}

// JSON取得
$query = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($query)) {
    sendJson(400, [
        "login" => false,
        "comment" => "送信データが不正です。"
    ]);
}

// 入力値取得
$email = trim($query["email"] ?? "");
$userPassword = $query["password"] ?? "";

// 入力チェック
if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !is_string($userPassword) ||
    $userPassword === ""
) {
    sendJson(400, [
        "login" => false,
        "comment" => "メールアドレスとパスワードを確認してください。"
    ]);
}

try {

    // DB接続
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

    // ユーザー取得
    $sql = "
        SELECT
            user_id,
            display_name,
            email,
            password_hash,
            role_code
        FROM users
        WHERE email = :email
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":email" => $email
    ]);

    $user = $stmt->fetch();

    // ユーザーが存在しない場合
    if (!$user) {
        sendJson(401, [
            "login" => false,
            "comment" => "メールアドレスまたはパスワードが違います。"
        ]);
    }

    // 保存済みハッシュ
    $storedHash = $user["password_hash"];

    // 新方式の検証
    $validPassword = password_verify(
        $userPassword,
        $storedHash
    );

    // 旧SHA-256方式にも対応
    $legacyPassword = false;

    if (!$validPassword) {

        $legacyPassword = hash_equals(
            $storedHash,
            hash("sha256", $userPassword)
        );

        $validPassword = $legacyPassword;
    }

    // パスワード不一致
    if (!$validPassword) {
        sendJson(401, [
            "login" => false,
            "comment" => "メールアドレスまたはパスワードが違います。"
        ]);
    }

    // 旧SHA-256なら新方式に更新
    if ($legacyPassword) {

        $newHash = password_hash(
            $userPassword,
            PASSWORD_DEFAULT
        );

        $update = $pdo->prepare("
            UPDATE users
            SET password_hash = :password_hash
            WHERE user_id = :user_id
        ");

        $update->execute([
            ":password_hash" => $newHash,
            ":user_id" => $user["user_id"]
        ]);
    }

    // セッション固定攻撃対策
    session_regenerate_id(true);

    // ログイン情報を保存
    $_SESSION["user_id"] = (int)$user["user_id"];

    $_SESSION["role_code"] = $user["role_code"];

    // ログイン成功
    sendJson(200, [
        "login" => true,
        "comment" => "ログイン成功"
    ]);

} catch (PDOException $e) {

    error_log(
        "ログインDBエラー: " . $e->getMessage()
    );

    sendJson(500, [
        "login" => false,
        "comment" => "サーバーでエラーが発生しました。"
    ]);

} catch (Throwable $e) {

    error_log(
        "ログインエラー: " . $e->getMessage()
    );

    sendJson(500, [
        "login" => false,
        "comment" => "ログイン処理に失敗しました。"
    ]);
}
