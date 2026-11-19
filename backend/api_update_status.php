<?php
// ヘッダーの設定（JSONを返す・CORS許可）
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSメソッド（プリフライト）の場合はここで終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    // POSTで送られてきたJSONデータを受け取る
    $input = json_decode(file_get_contents('php://input'), true);

    $taskId = $input['id'] ?? null;
    $status = $input['status'] ?? null;

    // バリデーション（IDとステータスが指定されているか）
    if (!$taskId || !$status) {
        echo json_encode([
            "status" => "error",
            "message" => "必須パラメータ（id または status）が不足しています。"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // tasks テーブルのステータスを更新するSQL
    $sql = "UPDATE tasks SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':id'     => $taskId
    ]);

    // 更新された行があるか確認
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "status" => "success",
            "message" => "タスクのステータスを更新しました。"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "該当するタスクが見つからないか、ステータスが変更されていません。"
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "データベースエラー: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>