<?php
session_start(); // ★ 先頭に追加
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "POSTのみ許可されています"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

// どっちのキー名で来ても対応できるようにする
$id = $input["id"] ?? $input["taskId"] ?? null;
$requestedHours = $input["requestedHours"] ?? null;
$reason = $input["reason"] ?? "";

// IDがなかったら「IDがありません」を返す
if (empty($id)) {
    echo json_encode(["success" => false, "message" => "IDがありません"]);
    exit;
}

try {
    // 担当者本人かチェックする
    $currentUserId = $_SESSION["user_id"] ?? null;
    $stmt = $pdo->prepare("SELECT assigned_user_id FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task || (int)$task['assigned_user_id'] !== (int)$currentUserId) {
        echo json_encode(["success" => false, "message" => "担当者本人のみ工数変更を申請できます"]);
        exit;
    }

    // 本番の工数やポイントは変えず、希望工数・理由を仮保存してステータスを「工数変更承認待ち(hours_pending)」にする
    $updateStmt = $pdo->prepare("UPDATE tasks SET requested_hours = ?, hours_change_reason = ?, status = 'hours_pending' WHERE id = ?");
    $updateStmt->execute([$requestedHours, $reason, $id]);
    
    echo json_encode(["success" => true, "message" => "工数変更申請を送信しました（承認待ち）"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>