<?php
// ヘッダー設定（JSON出力・CORS許可が必要な場合は適宜追加）
header('Content-Type: application/json; charset=utf-8');

// データベース接続設定 (saisin3.sql の設定に基づく)
$host = "localhost";
$dbname = "Tasfina_db";
$username = "root"; // 環境に合わせて変更してください
$password = "password";     // 環境に合わせて変更してください
$charset = "utf8mb4";
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false, 
        'error' => 'データベース接続に失敗しました: ' . $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// 1. GETリクエストの処理（データ取得系）
// ==========================================
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $user_id = $_GET['user_id'] ?? 1; // セッション等から取得するユーザーID

    // --- 月別シフト・繁忙日データの取得 ---
    if ($action === 'get_month_data') {
        $year_month = $_GET['ym'] ?? date('Y-m'); // 例: '2026-10'[cite: 1]

        try {
            // 指定月のシフト一覧を取得 (shiftsテーブル)
            $stmt = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?
            ");
            $stmt->execute([$user_id, $year_month]);
            $shifts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 繁忙日設定を取得 (busy_day_settingsテーブル)[cite: 4]
            $stmt_busy = $pdo->prepare("
                SELECT * FROM busy_day_settings 
                WHERE DATE_FORMAT(date, '%Y-%m') = ? AND is_active = 1
            ");
            $stmt_busy->execute([$year_month]);
            $busy_days = $stmt_busy->fetchAll(PDO::FETCH_ASSOC);

            // 今月のシフト集計データの計算
            $stmt_summary = $pdo->prepare("
                SELECT status, COUNT(*) as count 
                FROM shifts 
                WHERE user_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?
                GROUP BY status
            ");
            $stmt_summary->execute([$user_id, $year_month]);
            $summary = $stmt_summary->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'shifts' => $shifts,
                'busy_days' => $busy_days,
                'summary' => $summary
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 本日のシフトおよび申請状況の取得 ---
    if ($action === 'get_dashboard_info') {
        $today = date('Y-m-d');

        try {
            // 本日のシフト
            $stmt_today = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ? AND work_date = ?
            ");
            $stmt_today->execute([$user_id, $today]);
            $todays_shift = $stmt_today->fetch(PDO::FETCH_ASSOC);

            // 申請状況一覧（notificationsやalerts、または専用の申請テーブルがあればそちらを結合）[cite: 4]
            // ここでは簡易的にalertsテーブル等を活用した例、またはモック構造
            echo json_encode([
                'success' => true,
                'todays_shift' => $todays_shift,
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}

// ==========================================
// 2. POSTリクエストの処理（登録・更新系）
// ==========================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $user_id = $input['user_id'] ?? 1;

    // --- 希望シフトの提出・登録 ---
    if ($action === 'submit_shift_request') {
        $work_date = $input['work_date'] ?? '';
        $start_time = $input['start_time'] ?? '09:00:00';
        $end_time = $input['end_time'] ?? '18:00:00';
        $status = 'pending'; // 申請中は「承認待ち」

        if (empty($work_date)) {
            echo json_encode(['success' => false, 'error' => '日付が指定されていません。']);
            exit;
        }

        try {
            // 既存のシフトデータがある場合は更新、なければ新規挿入
            $stmt = $pdo->prepare("
                INSERT INTO shifts (user_id, work_date, start_time, end_time, status, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                start_time = VALUES(start_time), 
                end_time = VALUES(end_time), 
                status = VALUES(status),
                upated_at = NOW()
            ");
            $stmt->execute([$user_id, $work_date, $start_time, $end_time, $status]);

            echo json_encode([
                'success' => true, 
                'message' => '希望シフトを提出しました。'
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 管理者用：繁忙期設定の追加・更新 ---
    if ($action === 'save_busy_setting') {
        $date = $input['date'] ?? '';
        $required_people = $input['required_people'] ?? 5;
        $bonus_pt = $input['bonus_pt'] ?? 2.0;

        try {
            $stmt = $pdo->prepare("
                INSERT INTO busy_day_settings (date, required_peple, bonus_pt, is_active) 
                VALUES (?, ?, ?, 1)
            ");
            $stmt->execute([$date, $required_people, $bonus_pt]);

            echo json_encode([
                'success' => true,
                'message' => '繁忙期設定を保存しました。'
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}

// 該当するアクションがない場合
echo json_encode(['success' => false, 'error' => '無効なリクエストです。']);
?>