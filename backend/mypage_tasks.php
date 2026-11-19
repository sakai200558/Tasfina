
<?php
/* ========================================
   Tasfina マイページ用タスク取得API
======================================== */

session_start();

header("Content-Type: application/json; charset=utf-8");

try {

    /* =====================================
       ログイン確認
    ===================================== */

    if (!isset($_SESSION["user_id"])) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "ログインしてください。"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    /* =====================================
       データベース接続
    ===================================== */

    require_once __DIR__ . "/db.php";

    /* =====================================
       ログイン中のユーザーID
    ===================================== */

    $userId = $_SESSION["user_id"];

    /* =====================================
       自分の担当タスクを取得
    ===================================== */

    $sql = "
        SELECT
            id,
            title,
            assigned_user_id,
            due_date,
            status,
            estimated_hours,
            calculated_burden_pts
        FROM tasks
        WHERE assigned_user_id = :user_id
        ORDER BY due_date ASC, id DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* =====================================
       件数の集計
    ===================================== */

    $assignedCount = 0;
    $pendingCount = 0;

    foreach ($tasks as $task) {

        $status = $task["status"] ?? "";

        // 完了していない担当タスク
        if (!in_array(
            $status,
            ["completed", "done", "closed", "完了"],
            true
        )) {
            $assignedCount++;
        }

        // 承認待ち
        if (
            $status === "pending" ||
            $status === "承認待ち"
        ) {
            $pendingCount++;
        }
    }

    /* =====================================
       JSONを返す
    ===================================== */

    echo json_encode([
        "success" => true,

        "assigned_count" => $assignedCount,

        "pending_count" => $pendingCount,

        "tasks" => $tasks

    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    error_log(
        "mypage_tasks.php: " . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "タスク情報を取得できませんでした。"
    ], JSON_UNESCAPED_UNICODE);
}
