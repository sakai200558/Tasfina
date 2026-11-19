<?php
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
// ★ 追加①：まずはそのタスクの難易度（difficulty_level）や不快度（discomfort_level）をデータベースから取得する
    $stmt = $pdo->prepare("SELECT difficulty_level, discomfort_level FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    $difficulty_level = (float)($task['difficulty_level'] ?? 1.0);
    $discomfort_level = (float)($task['discomfort_level'] ?? 1.0);

    // ★ 追加②：タスク作成時と同じ計算式でポイントを再計算する
    $base_pts = ($requestedHours * 10) + ($difficulty_level * 5) + ($discomfort_level * 8);
    $calculated_burden_pts = (int)round($base_pts);

    // ★ 追加③：SQL文で estimated_hours と calculated_burden_pts の両方を更新する
    $updateStmt = $pdo->prepare("UPDATE tasks SET estimated_hours = ?, calculated_burden_pts = ? WHERE id = ?");
    $updateStmt->execute([$requestedHours, $calculated_burden_pts, $id]);
    
    echo json_encode(["success" => true, "message" => "工数とポイントを更新しました"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>