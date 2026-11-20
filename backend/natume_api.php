
<?php

/* ========================================
   Tasfina ガントチャートAPI
   タスク詳細情報対応版
======================================== */

session_start();

header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "Tasfina_db";
$username = "root";
$password = "password";
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

try {

    if (!isset($_SESSION["user_id"])) {
        http_response_code(401);
        throw new Exception("ログインしてください");
    }

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    $before = $_POST["before"] ?? "";
    $after = $_POST["after"] ?? "";

    $startDate = DateTime::createFromFormat("!Y-m-d", $before);
    $endDate = DateTime::createFromFormat("!Y-m-d", $after);

    if (
        !$startDate ||
        !$endDate ||
        $startDate->format("Y-m-d") !== $before ||
        $endDate->format("Y-m-d") !== $after ||
        $startDate > $endDate
    ) {
        http_response_code(400);
        throw new Exception("期間の指定が不正です");
    }

    /*
       現在確認できているtasksテーブルのカラムを使用。

       priority と start_date は実際の保存カラムが
       未確認のため、ここでは取得しません。

       開始日は従来どおり created_at を使用します。
    */

    $sql = "
        SELECT
            id,
            title,
            description,
            assigned_user_id,
            difficulty_level,
            discomfort_level,
            estimated_hours,
            calculated_burden_pts,
            status,
            DATE(created_at) AS start_date,
            DATE(due_date) AS end_date
        FROM tasks
        WHERE
            DATE(created_at) <= :after
            AND DATE(due_date) >= :before
        ORDER BY
            created_at ASC,
            due_date ASC,
            id ASC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":before" => $before,
        ":after" => $after
    ]);

    $rows = $stmt->fetchAll();

    echo json_encode(
        [
            "success" => true,
            "tasks" => $rows
        ],
        JSON_UNESCAPED_UNICODE
    );

} catch (Throwable $e) {

    error_log(
        "ガントチャートAPIエラー: " .
        $e->getMessage()
    );

    if (http_response_code() === 200) {
        http_response_code(500);
    }

    echo json_encode(
        [
            "success" => false,
            "comment" => $e->getMessage()
        ],
        JSON_UNESCAPED_UNICODE
    );
}
