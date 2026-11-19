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
    // データベースの工数を更新するSQL
    $stmt = $pdo->prepare("UPDATE tasks SET estimated_hours = ? WHERE id = ?");
    $stmt->execute([$requestedHours, $id]);
    
    echo json_encode(["success" => true, "message" => "工数変更を申請しました"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>