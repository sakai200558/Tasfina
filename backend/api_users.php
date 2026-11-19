<?php
// backend/api_users.php
header("Content-Type: application/json; charset=utf-8");

try {
    require_once __DIR__ . '/db.php';

    // usersテーブルの実際のカラム名 (user_id, display_name) に合わせて取得
    $stmt = $pdo->query("SELECT user_id AS id, display_name AS name FROM users ORDER BY user_id ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($users, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>