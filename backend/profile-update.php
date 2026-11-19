
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

function sendJson($status, $data)
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// POSTのみ許可
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJson(405, [
        "success" => false,
        "comment" => "POSTで送信してください。"
    ]);
}

// ログイン確認
if (!isset($_SESSION["user_id"])) {
    sendJson(401, [
        "success" => false,
        "comment" => "ログインしてください。"
    ]);
}

// JSON取得
$data = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($data)) {
    sendJson(400, [
        "success" => false,
        "comment" => "送信データが不正です。"
    ]);
}

// 入力値
$name = $data["name"] ?? "";
$email = $data["email"] ?? "";

if (!is_string($name) || !is_string($email)) {
    sendJson(400, [
        "success" => false,
        "comment" => "入力データが不正です。"
    ]);
}

$name = trim($name);
$email = trim($email);

// 必須チェック
if ($name === "" || $email === "") {
    sendJson(400, [
        "success" => false,
        "comment" => "ユーザー名とメールアドレスは必須です。"
    ]);
}

// 文字数チェック
// 現在のDBはvarchar(30)
if (
    strlen($name) > 120 ||
    strlen($email) > 30
) {
    sendJson(400, [
        "success" => false,
        "comment" => "入力文字数が上限を超えています。"
    ]);
}

// UTF-8文字数チェック
// mbstringが使用できない環境にも対応
if (
    preg_match_all('/./us', $name) > 30 ||
    preg_match_all('/./us', $email) > 30
) {
    sendJson(400, [
        "success" => false,
        "comment" => "30文字以内で入力してください。"
    ]);
}

// メールアドレス形式
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, [
        "success" => false,
        "comment" => "メールアドレスが不正です。"
    ]);
}

try {

    $pdo = new PDO(
        "mysql:host=localhost;dbname=Tasfina_db;charset=utf8mb4",
        "root",
        "password",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $userId = (int)$_SESSION["user_id"];

    // 現在の権限をDBから確認
    $stmt = $pdo->prepare("
        SELECT role_code
        FROM users
        WHERE user_id = :user_id
        LIMIT 1
    ");

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        sendJson(404, [
            "success" => false,
            "comment" => "ユーザーが見つかりません。"
        ]);
    }

    // 権限1000〜3000のみ
    if (!in_array(
        (string)$user["role_code"],
        ["1000", "2000", "3000"],
        true
    )) {
        sendJson(403, [
            "success" => false,
            "comment" => "プロフィール編集権限がありません。"
        ]);
    }

    // メールアドレス重複チェック
    $check = $pdo->prepare("
        SELECT user_id
        FROM users
        WHERE email = :email
          AND user_id <> :user_id
        LIMIT 1
    ");

    $check->execute([
        ":email" => $email,
        ":user_id" => $userId
    ]);

    if ($check->fetch()) {
        sendJson(409, [
            "success" => false,
            "comment" => "このメールアドレスは既に使用されています。"
        ]);
    }

    // プロフィール更新
    $update = $pdo->prepare("
        UPDATE users
        SET
            display_name = :display_name,
            email = :email,
            updated_at = NOW()
        WHERE user_id = :user_id
    ");

    $update->execute([
        ":display_name" => $name,
        ":email" => $email,
        ":user_id" => $userId
    ]);

    sendJson(200, [
        "success" => true,
        "comment" => "プロフィールを更新しました。"
    ]);

} catch (PDOException $e) {

    error_log("プロフィール更新DBエラー: " . $e->getMessage());

    sendJson(500, [
        "success" => false,
        "comment" => "プロフィールの更新に失敗しました。"
    ]);

} catch (Throwable $e) {

    error_log("プロフィール更新エラー: " . $e->getMessage());

    sendJson(500, [
        "success" => false,
        "comment" => "サーバーでエラーが発生しました。"
    ]);
}
