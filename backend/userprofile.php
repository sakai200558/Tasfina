
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

// データベース接続情報
$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

// JSONレスポンスを返す関数
function sendResponse($statusCode, $data)
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// ログイン確認
if (!isset($_SESSION["user_id"])) {

    sendResponse(401, [
        "success" => false,
        "message" => "ログインが必要です。"
    ]);

}

$userid = $_SESSION["user_id"];

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];

try {

    // データベース接続
    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        $options
    );

    // ログイン中のユーザー情報取得
    $sql = "
        SELECT
            display_name,
            email,
            role_code,
            job_title,
            level_factor
        FROM users
        WHERE user_id = :user_id
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->bindValue(
        ':user_id',
        $userid,
        PDO::PARAM_INT
    );

    $stmt->execute();

    // 1件だけ取得
    $user = $stmt->fetch();

    if (!$user) {

        sendResponse(404, [
            "success" => false,
            "message" => "ユーザーが見つかりません。"
        ]);

    }

    // 成功レスポンス
    sendResponse(200, [
        "success" => true,
        "user" => [
            "name" => $user["display_name"],
            "email" => $user["email"],
            "role_code" => $user["role_code"],
            "job_title" => $user["job_title"],
            "level_factor" => $user["level_factor"]
        ]
    ]);

} catch (PDOException $e) {

    // 詳細なDBエラーはサーバーログに記録
    error_log($e->getMessage());

    sendResponse(500, [
        "success" => false,
        "message" => "ユーザー情報の取得に失敗しました。"
    ]);

}
