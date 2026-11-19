cat << 'EOF' > api_delete_task.php
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

try {
    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["status" => "success", "message" => "削除成功"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
EOF