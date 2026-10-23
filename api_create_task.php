<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "許可されていないメソッドです"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$title = $input["title"] ?? "";
$due_date = $input["due_date"] ?? "";
$status = $input["status"] ?? "pending";
$description = $input["description"] ?? null;
$difficulty_level = isset($input["difficulty_level"]) ? (float)$input["difficulty_level"] : 1.0;
$discomfort_level = isset($input["discomfort_level"]) ? (float)$input["discomfort_level"] : 1.0; 
$estimated_hours = isset($input["estimated_hours"]) ? (float)$input["estimated_hours"] : 1.0;
$organization_id = $input["organization_id"] ?? 1;
$department_id = $input["department_id"] ?? 1;

//タスクポイントの計算
$is_busy_day = filter_var($input["is_busy_day"] ?? false, FILTER_VALIDATE_BOOLEAN);

$base_pts = ($estimated_hours * 10) + ($difficulty_level * 5) + ($discomfort_level * 8);
$calculated_burden_pts = $is_busy_day ? ($base_pts * 1.3) : $base_pts;

if (empty($title) || empty($due_date)) {
    echo json_encode(["status" => "error", "message" => "タイトルと期限は必須です"]);
    exit;
}

try {
    $sql = "INSERT INTO tasks (organization_id, department_id, title, description, difficulty_level, discomfort_level, estimated_hours, calculated_burden_pts, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $organization_id,
        $department_id,
        $title,
        $description,
        $difficulty_level,
        $discomfort_level,
        $estimated_hours,
        $calculated_burden_pts,
        $status,
        $due_date
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "タスクが正常に登録され、負担ポイントが自動計算されました",
        "id" => $pdo->lastInsertId(),
        "calculated_burden_pts" => $calculated_burden_pts
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "登録失敗: " . $e->getMessage()]);
}
?>