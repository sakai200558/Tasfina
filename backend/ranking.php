<?php

session_start();

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

$host = "localhost";
$dbname = "Tasfina_db";
$username = "root";
$password = "password";
$charset = "utf8mb4";

function sendResponse($status, $data)
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

// GETリクエストのみ許可
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    sendResponse(405, [
        "success" => false,
        "message" => "GETでアクセスしてください。"
    ]);
}

// ログイン確認
if (!isset($_SESSION["user_id"])) {
    sendResponse(401, [
        "success" => false,
        "message" => "ログインが必要です。"
    ]);
}

// 所属グループ確認
$groupId = $_SESSION["group_id"] ?? null;

if (
    $groupId === null ||
    filter_var(
        $groupId,
        FILTER_VALIDATE_INT,
        ["options" => ["min_range" => 1]]
    ) === false
) {
    sendResponse(200, [
        "success" => true,
        "users" => [],
        "message" => "所属グループがありません。"
    ]);
}

try {

    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false
        ]
    );

    // ログイン中のユーザーが所属するグループか確認
    $checkStmt = $pdo->prepare("
        SELECT 1
        FROM user_groups
        WHERE user_id = :user_id
          AND group_id = :group_id
        LIMIT 1
    ");

    $checkStmt->execute([
        ":user_id" => $_SESSION["user_id"],
        ":group_id" => $groupId
    ]);

    if (!$checkStmt->fetchColumn()) {
        sendResponse(403, [
            "success" => false,
            "message" => "このグループのランキングを閲覧できません。"
        ]);
    }

    // ランキングデータ取得
    $sql = "
        SELECT
            ws.user_id,
            u.display_name,
            SUM(ws.total_score) AS total_score
        FROM workload_scores AS ws
        INNER JOIN users AS u
            ON ws.user_id = u.user_id
        WHERE ws.group_id = :group_id
        GROUP BY
            ws.user_id,
            u.display_name
        ORDER BY
            total_score DESC,
            ws.user_id ASC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->bindValue(
        ":group_id",
        (int)$groupId,
        PDO::PARAM_INT
    );

    $stmt->execute();

    $rows = $stmt->fetchAll();

    $users = [];

    foreach ($rows as $index => $row) {

        $users[] = [
            "rank" => $index + 1,
            "user_id" => (int)$row["user_id"],
            "display_name" => $row["display_name"],
            "total_score" => (float)$row["total_score"]
        ];

    }

    sendResponse(200, [
        "success" => true,
        "users" => $users
    ]);

} catch (PDOException $e) {

    error_log(
        "ランキングDBエラー: " . $e->getMessage()
    );

    sendResponse(500, [
        "success" => false,
        "message" => "ランキングの取得に失敗しました。"
    ]);

} catch (Throwable $e) {

    error_log(
        "ランキングエラー: " . $e->getMessage()
    );

    sendResponse(500, [
        "success" => false,
        "message" => "サーバーエラーが発生しました。"
    ]);

}