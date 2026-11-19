<?php
header("Content-Type: application/json; charset=utf-8");

try {
    // データベース接続ファイルの読み込み
    require_once __DIR__ . '/db.php';

    // tasks と users を結合して担当者名を取得するSQL
    $sql = "SELECT tasks.*, users.display_name AS user_name 
            FROM tasks 
            LEFT JOIN users ON tasks.assigned_user_id = users.user_id 
            ORDER BY tasks.due_date ASC";
            
    $stmt = $pdo->query($sql);
    $rawTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $tasks = [];
    foreach ($rawTasks as $row) {
        $tasks[] = [
            "id" => $row['id'],
            "title" => $row['title'] ?? '',
            "assigned_user_id" => $row['assigned_user_id'],
            "user_name" => $row['user_name'] ?? null, // 担当者名をフロントに渡す
            "due_date" => $row['due_date'] ?? '',
            "status" => $row['status'] ?? '未着手',
            "estimated_hours" => $row['estimated_hours'] ?? 0,
            "calculated_burden_pts" => $row['calculated_burden_pts'] ?? 0,
            "work_type" => $row['work_type'] ?? '-',
            "evidence" => $row['evidence'] ?? '未提出'
        ];
    }

    echo json_encode($tasks, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>