<?php
header("Content-Type: application/json; charset=utf-8");

try {
    // データベース接続ファイルの読み込み
    require_once __DIR__ . '/db.php';

     // tasks と users を結合して担当者名を取得するSQL
        $sql = "SELECT tasks.*, 
                   u_assigned.display_name AS user_name,
                   u_created.display_name AS creator_name
            FROM tasks 
            LEFT JOIN users AS u_assigned ON tasks.assigned_user_id = u_assigned.user_id 
            LEFT JOIN users AS u_created ON tasks.created_by = u_created.user_id 
            ORDER BY tasks.due_date ASC";


            
    $stmt = $pdo->query($sql);
    $rawTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $tasks = [];
    foreach ($rawTasks as $row) {
        $tasks[] = [
            "id" => $row['id'],
            "title" => $row['title'] ?? '',
            "assigned_user_id" => $row['assigned_user_id'],
             "created_by" => $row['created_by'], // ★ この1行を追加
            "user_name" => $row['user_name'] ?? null, // 担当者名をフロントに渡す
            "creator_name" => $row['creator_name'] ?? '不明', // ★ この1行を追加
            "due_date" => $row['due_date'] ?? '',
            "status" => $row['status'] ?? '未着手',
            "estimated_hours" => $row['estimated_hours'] ?? 0,
            "calculated_burden_pts" => $row['calculated_burden_pts'] ?? 0,
            "work_type" => $row['work_type'] ?? '-',
            "evidence" => $row['evidence'] ?? '未提出',
                 "requested_hours" => $row['requested_hours'] ?? null,         // ★ 追加
            "hours_change_reason" => $row['hours_change_reason'] ?? ''    // ★ 追加
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