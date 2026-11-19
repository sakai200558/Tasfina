<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

// POSTリクエスト以外は拒否
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "許可されていないメソッドです"]);
    exit;
}

// JSONまたはPOSTデータの取得
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$task_id = $input["task_id"] ?? null;
$user_id = $input["user_id"] ?? null;

// バリデーション（タスクIDと担当者IDが必須）
if (empty($task_id) || empty($user_id)) {
    echo json_encode(["status" => "error", "message" => "タスクIDと担当者IDは必須です"]);
    exit;
}

try {
    // タスクに担当者を割り当て、ステータスを assigned に更新
    $sql = "UPDATE tasks SET assigned_user_id = ?, status = 'assigned' WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $task_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => "success",
            "message" => "タスクが正常に割り当てられました",
            "task_id" => (int)$task_id,
            "assigned_user_id" => (int)$user_id
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "指定されたタスクが見つからないか、変更はありませんでした"
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "割り当て失敗: " . $e->getMessage()]);
}
?>