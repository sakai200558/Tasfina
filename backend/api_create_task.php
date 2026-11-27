<?php
session_start();
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

$login_user_id = $_SESSION["user_id"] ?? ($input["created_by"] ?? ($input["user_id"] ?? null));
$approver_id = !empty($input["approver"]) ? (int)$input["approver"] : null;

$title = $input["title"] ?? "";
$due_date = $input["due_date"] ?? "";
$status = $input["status"] ?? "assigned";
$description = $input["description"] ?? null;
$difficulty_level = isset($input["difficulty_level"]) ? (float)$input["difficulty_level"] : 1.0;
$discomfort_level = isset($input["discomfort_level"]) ? (float)$input["discomfort_level"] : 1.0;
$estimated_hours = isset($input["estimated_hours"]) ? (float)$input["estimated_hours"] : 1.0;
$organization_id = $input["organization_id"] ?? 1;
$department_id = $input["department_id"] ?? 1;

// 複数担当者（assignees配列）と単体担当者（assignee）の両方を受け取れるようにする
$assignee_ids = [];
if (!empty($input["assignees"]) && is_array($input["assignees"])) {
    $assignee_ids = array_values(array_unique(array_filter(array_map("intval", $input["assignees"]))));
} elseif (!empty($input["assignee"])) {
    $assignee_ids = [(int)$input["assignee"]];
}

// タスクポイントの計算
$is_busy_day = filter_var($input["is_busy_day"] ?? false, FILTER_VALIDATE_BOOLEAN);
$base_pts = ($estimated_hours * 10) + ($difficulty_level * 5) + ($discomfort_level * 8);
$calculated_burden_pts = $is_busy_day ? ($base_pts * 1.3) : $base_pts;
$calculated_burden_pts = (int)round($calculated_burden_pts);

if (empty($title) || empty($due_date)) {
    echo json_encode(["status" => "error", "message" => "タイトルと期限は必須です"]);
    exit;
}

if (empty($assignee_ids)) {
    echo json_encode(["status" => "error", "message" => "担当者を1人以上選択してください"]);
    exit;
}

// 担当者の中に自分自身が含まれる場合は、自分以外の承認者を必須にする
$includes_self = in_array((int)$login_user_id, $assignee_ids, true);
if ($includes_self && (empty($approver_id) || $approver_id === (int)$login_user_id)) {
    echo json_encode(["status" => "error", "message" => "自分のタスクを作成する場合は、自分以外の承認者を選択してください"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $sql = "INSERT INTO tasks (organization_id, department_id, assigned_user_id, created_by, title, description, difficulty_level, discomfort_level, estimated_hours, calculated_burden_pts, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    $inserted_ids = [];
    foreach ($assignee_ids as $uid) {
        // 自分自身のタスク分は選択された承認者、他メンバーへの依頼分はログインユーザー自身を承認者にする
        $task_creator_id = ((int)$uid === (int)$login_user_id) ? $approver_id : (int)$login_user_id;

        $stmt->execute([
            $organization_id,
            $department_id,
            (int)$uid,
            $task_creator_id,
            $title,
            $description,
            $difficulty_level,
            $discomfort_level,
            $estimated_hours,
            $calculated_burden_pts,
            $status,
            $due_date
        ]);
        $inserted_ids[] = $pdo->lastInsertId();
    }

    $pdo->commit();

    $count = count($inserted_ids);
    $msg = $count > 1
        ? "{$count}名の担当者にタスクを一括登録し、負担ポイントが自動計算されました"
        : "タスクが正常に登録され、負担ポイントが自動計算されました";

    echo json_encode([
        "status" => "success",
        "message" => $msg,
        "id" => $inserted_ids[0] ?? null,
        "ids" => $inserted_ids,
        "calculated_burden_pts" => $calculated_burden_pts
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "登録失敗: " . $e->getMessage()]);
}
?>
