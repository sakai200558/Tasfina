<?php
// backend/api_users.php
session_start();
header("Content-Type: application/json; charset=utf-8");

try {
    require_once __DIR__ . '/db.php';
    $currentUserId = $_SESSION['user_id'] ?? null;
    $groupId = $_SESSION['group_id'] ?? null;

    if ($groupId !== null) {
        $stmt = $pdo->prepare("SELECT user_id AS id, display_name AS name FROM users WHERE group_id = :group_id ORDER BY user_id ASC");
        $stmt->execute([':group_id' => $groupId]);
    } else {
        $stmt = $pdo->query("SELECT user_id AS id, display_name AS name FROM users ORDER BY user_id ASC");
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "current_user_id" => $currentUserId,
        "users" => $users
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>