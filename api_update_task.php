cat << 'EOF' > api_update_task.php
<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "POSTのみ許可されています"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$id = $input["id"] ?? null;
if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "IDがありません"]);
    exit;
}

$status = $input["status"] ?? "completed";

try {
    $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    echo json_encode(["status" => "success", "message" => "更新成功"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
EOF