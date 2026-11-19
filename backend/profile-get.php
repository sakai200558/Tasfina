
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

function sendJson($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    sendJson(405, [
        "success" => false,
        "comment" => "GETでアクセスしてください。"
    ]);
}

if (!isset($_SESSION["user_id"])) {
    sendJson(401, [
        "success" => false,
        "comment" => "ログインしてください。"
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

    $stmt = $pdo->prepare("
        SELECT
            user_id,
            display_name,
            email,
            role_code
        FROM users
        WHERE user_id = :user_id
        LIMIT 1
    ");

    $stmt->execute([
        ":user_id" => $_SESSION["user_id"]
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        sendJson(404, [
            "success" => false,
            "comment" => "ユーザーが見つかりません。"
        ]);
    }

    sendJson(200, [
        "success" => true,
        "user" => [
            "name" => $user["display_name"],
            "email" => $user["email"],
            "role_code" => $user["role_code"],
            "department" => "未設定"
        ]
    ]);

} catch (Throwable $e) {

    error_log("プロフィール取得エラー: " . $e->getMessage());

    sendJson(500, [
        "success" => false,
        "comment" => "プロフィールの取得に失敗しました。"
    ]);
}
