<?php
require_once 'db.php';

try {
    // ユーザー（u）とタスク（t）を結合し、スタッフごとのタスク数と負担ポイントを合算する
    $sql = "SELECT 
                u.user_id, 
                u.display_name, 
                COUNT(t.id) AS task_count, 
                COALESCE(SUM(t.calculated_burden_pts), 0) AS total_burden_pts 
            FROM users u 
            LEFT JOIN tasks t ON u.user_id = t.assigned_user_id 
            GROUP BY u.user_id, u.display_name";

    $stmt = $pdo->query($sql);
    $workload = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $workload
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "集計失敗: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>