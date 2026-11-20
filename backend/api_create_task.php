<?php
session_start(); // ★ セッションからログインユーザーIDを取得する場合に追加
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

// 現在のログインユーザーIDを取得
$login_user_id = $_SESSION["user_id"] ?? ($input["created_by"] ?? ($input["user_id"] ?? null));
// 画面から「承認者（approver）」が送られてきた場合はそちらを、無ければログインユーザー自身を承認者（created_by）にする
$created_by = !empty($input["approver"]) ? (int)$input["approver"] : $login_user_id;



$title = $input["title"] ?? "";
$due_date = $input["due_date"] ?? "";
$status = $input["status"] ?? "assigned"; // デフォルトを 'assigned'（未着手）に設定
$description = $input["description"] ?? null;
$difficulty_level = isset($input["difficulty_level"]) ? (float)$input["difficulty_level"] : 1.0;
$discomfort_level = isset($input["discomfort_level"]) ? (float)$input["discomfort_level"] : 1.0; 
$estimated_hours = isset($input["estimated_hours"]) ? (float)$input["estimated_hours"] : 1.0;
$organization_id = $input["organization_id"] ?? 1;
$department_id = $input["department_id"] ?? 1;

// ★ 担当者ID（user_id）を受け取る
$assigned_user_id = isset($input["assignee"]) ? (int)$input["assignee"] : null;

// タスクポイントの計算（演算子を正しく修正）
$is_busy_day = filter_var($input["is_busy_day"] ?? false, FILTER_VALIDATE_BOOLEAN);

// 例として掛け算や足し算の演算子を補正しています（必要に応じて調整してください）
$base_pts = ($estimated_hours * 10) + ($difficulty_level * 5) + ($discomfort_level * 8);
$calculated_burden_pts = $is_busy_day ? ($base_pts * 1.3) : $base_pts;
// 小数点以下を四捨五入して整数（int）にする場合
$calculated_burden_pts = (int)round($calculated_burden_pts);

if (empty($title) || empty($due_date)) {
    echo json_encode(["status" => "error", "message" => "タイトルと期限は必須です"]);
    exit;
}

if (empty($assigned_user_id)) {
    echo json_encode(["status" => "error", "message" => "担当者を選択してください"]);
    exit;
}

// ★ ここから追加：自分自身を担当者にする場合は、自分以外の承認者を必須にする
if ((int)$assigned_user_id === (int)$login_user_id && (empty($created_by) || (int)$created_by === (int)$login_user_id)) {
    echo json_encode(["status" => "error", "message" => "自分のタスクを作成する場合は、自分以外の承認者を選択してください"]);
    exit;
}
// ★ ここまで追加

try {
    // ★ assigned_user_id を含めて INSERT する
   $sql = "INSERT INTO tasks (organization_id, department_id, assigned_user_id, created_by, title, description, difficulty_level, discomfort_level, estimated_hours, calculated_burden_pts, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $organization_id,
        $department_id,
        $assigned_user_id,
        $created_by,
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