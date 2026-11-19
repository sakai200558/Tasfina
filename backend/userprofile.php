
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

// ========================================
// データベース接続情報
// ========================================

$host = "localhost";
$dbname = "Tasfina_db";
$username = "root";
$password = "password";
$charset = "utf8mb4";


// ========================================
// JSONレスポンス
// ========================================

function sendResponse($statusCode, $data)
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


// ========================================
// GETリクエスト確認
// ========================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    sendResponse(405, [
        "success" => false,
        "message" => "GETでアクセスしてください。"
    ]);

}


// ========================================
// ログイン確認
// ========================================

if (!isset($_SESSION["user_id"])) {

    sendResponse(401, [
        "success" => false,
        "message" => "ログインが必要です。"
    ]);

}

$userid = (int)$_SESSION["user_id"];


// ========================================
// データベース接続設定
// ========================================

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];


try {

    // ========================================
    // データベース接続
    // ========================================

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        $options
    );


    // ========================================
    // ログイン中のユーザー情報取得
    // ========================================

    $sql = "
        SELECT
            user_id,
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
        ":user_id",
        $userid,
        PDO::PARAM_INT
    );

    $stmt->execute();

    $user = $stmt->fetch();


    // ========================================
    // ユーザーが存在しない場合
    // ========================================

    if (!$user) {

        sendResponse(404, [
            "success" => false,
            "message" => "ユーザーが見つかりません。"
        ]);

    }


    // ========================================
    // 所属部門情報
    // ========================================

    /*
       現時点では所属部門テーブルの
       正確な構造が未確認のため、
       存在しないテーブルへのSQLを
       実行しないようにしています。

       部門テーブルとの関連が確認できたら
       ここに取得処理を追加します。
    */

    $departmentName = null;
    $departmentCode = null;


    // ========================================
    // 成功レスポンス
    // ========================================

    sendResponse(200, [
        "success" => true,
        "user" => [
            "name" => $user["display_name"],
            "email" => $user["email"],
            "role_code" => $user["role_code"],
            "job_title" => $user["job_title"],
            "level_factor" => $user["level_factor"],

            // 所属部門
            "department_name" => $departmentName,
            "department_code" => $departmentCode
        ]
    ]);

} catch (PDOException $e) {

    error_log(
        "ユーザープロフィールDBエラー: " .
        $e->getMessage()
    );

    sendResponse(500, [
        "success" => false,
        "message" => "ユーザー情報の取得に失敗しました。"
    ]);

} catch (Throwable $e) {

    error_log(
        "ユーザープロフィールエラー: " .
        $e->getMessage()
    );

    sendResponse(500, [
        "success" => false,
        "message" => "サーバーでエラーが発生しました。"
    ]);

}
