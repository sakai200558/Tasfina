<?php
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'tasfina_user';
$password = 'tasfina_pass';

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

   // --- 本日のシフト情報およびユーザー権限の取得 ---
    if ($action === 'get_dashboard_info') {
        $today = $_GET['today'] ?? date('Y-m-d');

        try {
            // ユーザー権限（role_code）を取得
            $stmt_user = $pdo->prepare("
                SELECT user_id, display_name, role_code 
                FROM users 
                WHERE user_id = ?
            ");
            $stmt_user->execute([$user_id]);
            $user_info = $stmt_user->fetch(PDO::FETCH_ASSOC);

            // 本日のシフト
            $stmt_today = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ? AND DATE(work_date) = ?
            ");
            $stmt_today->execute([$user_id, $today]);
            $todays_shift = $stmt_today->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'user' => $user_info,
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

    // --- 希望シフト登録（1日単位） ---
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

    // --- 希望シフト一括登録（複数日対応） ---
    if ($action === 'submit_bulk_shifts') {
        $shifts = $input['shifts'] ?? [];
        if (!is_array($shifts) || count($shifts) === 0) {
            echo json_encode(['success' => false, 'error' => 'シフトデータが選択されていません。']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO shifts (user_id, work_date, start_time, end_time, status, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                start_time = VALUES(start_time), 
                end_time = VALUES(end_time), 
                status = VALUES(status),
                upated_at = NOW()
            ");

            $count = 0;
            foreach ($shifts as $row) {
                if (empty($row['work_date']) || empty($row['status'])) continue;
                $stmt->execute([
                    $user_id,
                    $row['work_date'] . ' 09:00:00',
                    $row['start_time'] ?? null,
                    $row['end_time'] ?? null,
                    $row['status']
                ]);
                $count++;
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "{$count}日分の希望シフトを登録しました。"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 繁忙日設定登録（1日単位） ---
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

    // --- 繁忙期設定一括登録（期間指定・複数日対応） ---
    if ($action === 'save_busy_period') {
        $start_date = $input['start_date'] ?? '';
        $end_date = $input['end_date'] ?? '';
        $required_people = $input['required_people'] ?? 5;
        $bonus_pt = $input['bonus_pt'] ?? 2.0;

        if (empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'error' => '開始日と終了日を指定してください。']);
            exit;
        }

        $start = new DateTime($start_date);
        $end = new DateTime($end_date);
        if ($end < $start) {
            echo json_encode(['success' => false, 'error' => '終了日は開始日以降を指定してください。']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO busy_day_settings (date, required_peple, bonus_pt, is_active) 
                VALUES (?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE 
                required_peple = VALUES(required_peple),
                bonus_pt = VALUES(bonus_pt),
                is_active = 1
            ");

            $current = clone $start;
            $daysCount = 0;
            while ($current <= $end) {
                $stmt->execute([$current->format('Y-m-d'), $required_people, $bonus_pt]);
                $daysCount++;
                $current->modify('+1 day');
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "{$daysCount}日分の繁忙期設定を保存しました。"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 有休申請の登録（期間指定・複数日対応） ---
    if ($action === 'submit_paid_leave') {
        $start_date = $input['start_date'] ?? '';
        $end_date = $input['end_date'] ?? '';
        $reason = $input['reason'] ?? '';
        $leave_type = $input['leave_type'] ?? 'full';

        if (empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'error' => '日付が正しく選択されていません。']);
            exit;
        }

        $start = new DateTime($start_date);
        $end = new DateTime($end_date);
        if ($end < $start) {
            echo json_encode(['success' => false, 'error' => '終了日は開始日以降を指定してください。']);
            exit;
        }

        $status = ($leave_type === 'half') ? '午前休' : '有給休暇';

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO shifts (user_id, work_date, status, created_at) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                upated_at = NOW()
            ");

            $current = clone $start;
            $registered = 0;
            while ($current <= $end) {
                $stmt->execute([$user_id, $current->format('Y-m-d') . ' 09:00:00', $status]);
                $registered++;
                $current->modify('+1 day');
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "{$registered}日分の有休申請を受け付けました。"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- シフトルーレットの実行・割り当て処理 ---
    if ($action === 'execute_roulette') {
        $target_date = $input['target_date'] ?? '';
        $shift_type = $input['shift_type'] ?? '在宅勤務';

        if (empty($target_date)) {
            echo json_encode(['success' => false, 'error' => '対象日が指定されていません。']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO shifts (user_id, work_date, status, created_at) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                upated_at = NOW()
            ");
            $stmt->execute([$user_id, $target_date, $shift_type]);

            echo json_encode(['success' => true, 'message' => 'シフトルーレットによりメンバーが選出・割り当てられました。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'error' => '無効なリクエストです。']);
?>