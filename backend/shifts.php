<?php
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// GET リクエスト処理
// ==========================================
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $user_id = $_GET['user_id'] ?? 1;

    // --- 月別カレンダーデータ・集計の取得 ---
    if ($action === 'get_month_data') {
        $year_month = $_GET['ym'] ?? date('Y-m');

        try {
            $stmt = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?
            ");
            $stmt->execute([$user_id, $year_month]);
            $shifts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt_busy = $pdo->prepare("
                SELECT * FROM busy_day_settings 
                WHERE DATE_FORMAT(date, '%Y-%m') = ? AND is_active = 1
            ");
            $stmt_busy->execute([$year_month]);
            $busy_days = $stmt_busy->fetchAll(PDO::FETCH_ASSOC);

            $stmt_summary = $pdo->prepare("
                SELECT 
                    COALESCE(status, '未設定') as status_type, 
                    COUNT(*) as count 
                FROM shifts 
                WHERE user_id = ? AND DATE_FORMAT(work_date, '%Y-%m') = ?
                GROUP BY status_type
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

    // --- 本日のシフト情報の取得 ---
    if ($action === 'get_dashboard_info') {
        $today = $_GET['today'] ?? date('Y-m-d');

        try {
            $stmt_today = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ? AND DATE(work_date) = ?
            ");
            $stmt_today->execute([$user_id, $today]);
            $todays_shift = $stmt_today->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'todays_shift' => $todays_shift
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}

// ==========================================
// POST リクエスト処理
// ==========================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $user_id = $input['user_id'] ?? 1;

    // --- 希望シフト登録 ---
    if ($action === 'submit_shift_request') {
        $work_date = $input['work_date'] ?? '';
        $start_time = $input['start_time'] ?? '09:00:00';
        $end_time = $input['end_time'] ?? '18:00:00';
        $status = $input['status'] ?? '通常出勤';

        if (empty($work_date)) {
            echo json_encode(['success' => false, 'error' => '日付が選択されていません。']);
            exit;
        }

        try {
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

            echo json_encode(['success' => true, 'message' => '希望シフトを登録しました。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 繁忙日設定登録 ---
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

            echo json_encode(['success' => true, 'message' => '繁忙期設定を保存しました。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}

// --- 有休申請の登録 ---
    if ($action === 'submit_paid_leave') {
        $start_date = $input['start_date'] ?? '';
        $end_date = $input['end_date'] ?? '';
        $reason = $input['reason'] ?? '';
        $leave_type = $input['leave_type'] ?? 'full';

        if (empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'error' => '日付が正しく選択されていません。']);
            exit;
        }

        try {
            // 例として shifts テーブルに有休ステータスとして登録する処理
            $stmt = $pdo->prepare("
                INSERT INTO shifts (user_id, work_date, status, created_at) 
                VALUES (?, ?, '有給休暇', NOW())
                ON DUPLICATE KEY UPDATE 
                status = '有給休暇',
                upated_at = NOW()
            ");
            $stmt->execute([$user_id, $start_date]);

            echo json_encode(['success' => true, 'message' => '有休申請を受け付けました。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

echo json_encode(['success' => false, 'error' => '無効なリクエストです。']);
?>