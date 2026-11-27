<?php
session_start(); // ★ この1行を追加
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
    // ★ JSON と FormData（ファイル添付あり）の両方を受け取る
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $input = $_POST;
    }

    $taskId = $input['id'] ?? null;
    $status = $input['status'] ?? null;
    $rejectReason = trim($input['reject_reason'] ?? '');
    $completeReport = trim($input['report'] ?? '');

    // バリデーション（IDとステータスが指定されているか）
    if (!$taskId || !$status) {
        echo json_encode([
            "status" => "error",
            "message" => "必須パラメータ（id または status）が不足しています。"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

   // ★ 承認または差し戻しの場合は依頼者本人かチェックする
    if ($status === 'completed' || $status === 'approve_hours' || $status === 'reject_hours' || $status === 'reject_complete') {
        $currentUserId = $_SESSION['user_id'] ?? null;
        $checkStmt = $pdo->prepare("SELECT created_by FROM tasks WHERE id = :id");
        $checkStmt->execute([':id' => $taskId]);
        $targetTask = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetTask || (int)$targetTask['created_by'] !== (int)$currentUserId) {
            echo json_encode([
                "status" => "error",
                "message" => "このタスクの依頼者本人のみ承認・差し戻しできます。"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }elseif ($status === 'pending') {
        // ★ ここから追加：完了申請（pending）は担当者本人のみ実行可能にする
        $currentUserId = $_SESSION['user_id'] ?? null;
        $checkStmt = $pdo->prepare("SELECT assigned_user_id FROM tasks WHERE id = :id");
        $checkStmt->execute([':id' => $taskId]);
        $targetTask = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$targetTask || (int)$targetTask['assigned_user_id'] !== (int)$currentUserId) {
            echo json_encode([
                "status" => "error",
                "message" => "このタスクの担当者本人のみ完了申請できます。"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    // ★ ここまで追加
    // ★ ここまで追加
    // tasks テーブルのステータスを更新するSQL
    $sql = "UPDATE tasks SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':status' => $status,
        ':id'     => $taskId
    ]);

    // 更新された行があるか確認
    if ($stmt->rowCount() > 0) {

                // ★ ここから追加：完了申請（pending）のとき完了報告とファイルを保存（DBは触らない）
        if ($status === 'pending') {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $filePath = null;
            $fileName = null;

            if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
                $originalName = basename($_FILES['evidence']['name']);
                $ext = pathinfo($originalName, PATHINFO_EXTENSION);
                $safeName = 'task_' . $taskId . '_' . time() . ($ext ? '.' . $ext : '');
                $destPath = $uploadDir . $safeName;

                if (move_uploaded_file($_FILES['evidence']['tmp_name'], $destPath)) {
                    $filePath = '../../backend/uploads/' . $safeName;
                    $fileName = $originalName;
                }
            }

            $jsonFile = __DIR__ . '/reports.json';
            $reports = file_exists($jsonFile) ? json_decode(file_get_contents($jsonFile), true) : [];
            if (!is_array($reports)) $reports = [];

            $reports[(string)$taskId] = [
                'report' => $completeReport,
                'file_path' => $filePath,
                'file_name' => $fileName,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            file_put_contents($jsonFile, json_encode($reports, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }
        // ★ ここまで追加

        // 承認（completed）されたときだけポイントを担当者に付与する
        if ($status === 'completed') {
            $taskStmt = $pdo->prepare("SELECT assigned_user_id, calculated_burden_pts FROM tasks WHERE id = :id");
            $taskStmt->execute([':id' => $taskId]);
            $taskInfo = $taskStmt->fetch(PDO::FETCH_ASSOC);

            if ($taskInfo && $taskInfo['assigned_user_id']) {
                $assignedUserId = $taskInfo['assigned_user_id'];
                $pts = (float)$taskInfo['calculated_burden_pts'];

                $checkScore = $pdo->prepare("SELECT score_id FROM workload_scores WHERE user_id = :user_id LIMIT 1");
                $checkScore->execute([':user_id' => $assignedUserId]);
                $scoreRow = $checkScore->fetch(PDO::FETCH_ASSOC);

                if ($scoreRow) {
                    $updateScore = $pdo->prepare("UPDATE workload_scores SET task_pt = COALESCE(task_pt, 0) + :pts1, total_score = COALESCE(total_score, 0) + :pts2, calculated_at = NOW() WHERE score_id = :score_id");
                    $updateScore->execute([
                        ':pts1' => $pts,
                        ':pts2' => $pts,
                        ':score_id' => $scoreRow['score_id']
                    ]);
                } else {
                    $insertScore = $pdo->prepare("INSERT INTO workload_scores (user_id, task_pt, total_score, calculated_at) VALUES (:user_id, :pts1, :pts2, NOW())");
                    $insertScore->execute([
                        ':user_id' => $assignedUserId,
                        ':pts1' => $pts,
                        ':pts2' => $pts
                    ]);
                }
            }
        }elseif ($status === 'approve_hours') {
            // ★ 工数変更の承認：申請されていた希望工数・難易度・不快度を取得してポイントを再計算
            $taskStmt = $pdo->prepare("SELECT difficulty_level, discomfort_level, requested_hours FROM tasks WHERE id = :id");
            $taskStmt->execute([':id' => $taskId]);
            $taskInfo = $taskStmt->fetch(PDO::FETCH_ASSOC);

            if ($taskInfo && $taskInfo['requested_hours'] > 0) {
                $newHours = (float)$taskInfo['requested_hours'];
                $diff = (float)($taskInfo['difficulty_level'] ?? 1.0);
                $disc = (float)($taskInfo['discomfort_level'] ?? 1.0);

                // タスク作成時・変更時と同じ計算式で新しいポイントを算出
                $newPoints = (int)round(($newHours * 10) + ($diff * 5) + ($disc * 8));

                // 本番の工数・ポイントを上書きし、申請データをクリアしてステータスを 'in_progress'（進行中）に戻す
                $applySql = "UPDATE tasks 
                             SET estimated_hours = :hours,
                                 calculated_burden_pts = :pts,
                                 requested_hours = NULL,
                                 hours_change_reason = NULL,
                                 status = 'in_progress'
                             WHERE id = :id";
                $applyStmt = $pdo->prepare($applySql);
                $applyStmt->execute([
                    ':hours' => $newHours,
                    ':pts'   => $newPoints,
                    ':id'    => $taskId
                ]);
            }
        } elseif ($status === 'reject_hours' || $status === 'reject_complete') {
            $savedReason = $rejectReason !== '' ? "【差し戻し】" . $rejectReason : null;

            $rejectSql = "UPDATE tasks 
                          SET requested_hours = NULL,
                              hours_change_reason = :reason,
                              status = 'in_progress'
                          WHERE id = :id";
            $rejectStmt = $pdo->prepare($rejectSql);
            $rejectStmt->execute([
                ':reason' => $savedReason,
                ':id'     => $taskId
            ]);
        }

          $msg = "ステータスを更新しました。";
        if ($status === 'completed') $msg = "タスクを承認し、ポイントを付与しました。";
        if ($status === 'approve_hours') $msg = "工数変更を承認し、新しい工数とポイントを反映しました。";
        if ($status === 'pending') $msg = "完了申請を送信しました（承認待ち）。";
         if ($status === 'reject_hours' || $status === 'reject_complete') $msg = "申請を差し戻しました。";

        echo json_encode([
            "status" => "success",
            "message" => $msg
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
