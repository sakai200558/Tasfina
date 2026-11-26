<?php

/* ========================================
   Tasfina ガントチャートAPI
   タスク詳細・担当者別色分け対応版
======================================== */

session_start();

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

try {

    /* =====================================
       ログイン確認
    ===================================== */

    if (!isset($_SESSION["user_id"])) {

        http_response_code(401);

        throw new Exception("ログインしてください");
    }

    /* =====================================
       ログイン中のユーザーID取得
    ===================================== */

    $currentUserId = (int)$_SESSION["user_id"];

    /* =====================================
       データベース接続
    ===================================== */

    require_once __DIR__ . "/db.php";

    /* =====================================
       表示期間取得
    ===================================== */

    $before = $_POST["before"] ?? "";
    $after = $_POST["after"] ?? "";

    $startDate = DateTime::createFromFormat(
        "!Y-m-d",
        $before
    );

    $endDate = DateTime::createFromFormat(
        "!Y-m-d",
        $after
    );

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

    /* =====================================
       タスク情報取得
    ===================================== */

    /*
       priority と start_date は
       保存カラムが未確認のため取得しません。

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

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* =====================================
       JSONレスポンス
    ===================================== */

    echo json_encode(
        [
            "success" => true,

            // ログイン中のユーザーID
            "current_user_id" => $currentUserId,

            // タスク一覧
            "tasks" => $rows
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

} catch (Throwable $e) {

    error_log(
        "ガントチャートAPIエラー: " .
        $e->getMessage()
    );

    $status = http_response_code();

    if (!$status || $status < 400) {

        http_response_code(500);

    }

    echo json_encode(
        [
            "success" => false,
            "comment" => http_response_code() === 500
                ? "タスク情報の取得に失敗しました"
                : $e->getMessage()
        ],
        JSON_UNESCAPED_UNICODE
    );
}