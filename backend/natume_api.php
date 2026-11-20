<?php

/* ========================================
   Tasfina ガントチャートAPI
   created_at ～ due_date 期間取得版
======================================== */

session_start();

header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

try {

    /* =====================================
       ログイン確認
    ===================================== */

    if (!isset($_SESSION["user_id"])) {

        throw new Exception(
            "ログインしてください"
        );
    }

    /* =====================================
       データベース接続
    ===================================== */

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

    /* =====================================
       表示期間の取得
    ===================================== */

    $before = $_POST["before"] ?? "";
    $after = $_POST["after"] ?? "";

    /* =====================================
       日付形式チェック
    ===================================== */

    $startDate = DateTime::createFromFormat(
        '!Y-m-d',
        $before
    );

    $endDate = DateTime::createFromFormat(
        '!Y-m-d',
        $after
    );

    if (
        !$startDate ||
        !$endDate ||
        $startDate->format('Y-m-d') !== $before ||
        $endDate->format('Y-m-d') !== $after ||
        $startDate > $endDate
    ) {

        throw new Exception(
            "期間の指定が不正です"
        );
    }

    /* =====================================
       タスク取得

       開始日：created_at
       終了日：due_date

       表示期間と重なるタスクを取得
    ===================================== */

    $sql = "
        SELECT
            id,
            title,
            status,
            DATE(created_at) AS start_date,
            due_date AS end_date
        FROM tasks
        WHERE
            DATE(created_at) <= :after
            AND due_date >= :before
        ORDER BY
            created_at ASC,
            due_date ASC,
            id ASC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':before' => $before,
        ':after' => $after
    ]);

    $rows = $stmt->fetchAll();

    /* =====================================
       正常レスポンス
    ===================================== */

    echo json_encode(
        [
            "success" => true,
            "tasks" => $rows
        ],
        JSON_UNESCAPED_UNICODE
    );

} catch (Throwable $e) {

    /* =====================================
       エラー処理
    ===================================== */

    error_log(
        "ガントチャートAPIエラー: " .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "comment" => $e->getMessage()
        ],
        JSON_UNESCAPED_UNICODE
    );
}

?>