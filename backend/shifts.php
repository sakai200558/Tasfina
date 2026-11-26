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

    // --- 月別カレンダーデータ・集計の取得（承認済み・確定シフト対象） ---
    if ($action === 'get_month_data') {
        $year_month = $_GET['ym'] ?? date('Y-m');

        try {
            $stmt = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ?
                  AND work_date IS NOT NULL
                  AND app_type IS NULL
                  AND approval_status = '承認済み'
                  AND DATE_FORMAT(work_date, '%Y-%m') = ?
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
                WHERE user_id = ?
                  AND work_date IS NOT NULL
                  AND app_type IS NULL
                  AND approval_status = '承認済み'
                  AND DATE_FORMAT(work_date, '%Y-%m') = ?
                GROUP BY COALESCE(status, '未設定')
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
            $stmt_user = $pdo->prepare("
                SELECT user_id, display_name, role_code 
                FROM users 
                WHERE user_id = ?
            ");
            $stmt_user->execute([$user_id]);
            $user_info = $stmt_user->fetch(PDO::FETCH_ASSOC);

            $stmt_today = $pdo->prepare("
                SELECT * FROM shifts 
                WHERE user_id = ?
                  AND work_date IS NOT NULL
                  AND app_type IS NULL
                  AND approval_status = '承認済み'
                  AND DATE(work_date) = ?
                ORDER BY shift_id DESC
                LIMIT 1
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

    // --- 申請履歴一覧の取得（shifts テーブルの app_type が入っているレコード） ---
    if ($action === 'get_applications') {
        $req_user_id = $_GET['user_id'] ?? 1;
        $is_admin = ($_GET['is_admin'] ?? '0') === '1';

        try {
            if ($is_admin) {
                $stmt = $pdo->prepare("
                    SELECT
                        shift_id AS application_id,
                        user_id,
                        dept_id,
                        app_type,
                        status_type,
                        start_date,
                        end_date,
                        start_time,
                        end_time,
                        payload_json,
                        reason,
                        approval_status,
                        created_at AS applied_at,
                        upated_at
                    FROM shifts
                    WHERE app_type IS NOT NULL
                    ORDER BY FIELD(approval_status, '承認待ち', '承認済み'), created_at DESC, shift_id DESC
                ");
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare("
                    SELECT
                        shift_id AS application_id,
                        user_id,
                        dept_id,
                        app_type,
                        status_type,
                        start_date,
                        end_date,
                        start_time,
                        end_time,
                        payload_json,
                        reason,
                        approval_status,
                        created_at AS applied_at,
                        upated_at
                    FROM shifts
                    WHERE app_type IS NOT NULL AND user_id = ?
                    ORDER BY FIELD(approval_status, '承認待ち', '承認済み'), created_at DESC, shift_id DESC
                ");
                $stmt->execute([$req_user_id]);
            }
            $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'applications' => $applications]);
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

    // --- 希望シフト登録（1日単位：承認待ちとして登録） ---
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
            $payload = [[
                'work_date' => $work_date,
                'status' => $status,
                'start_time' => $start_time,
                'end_time' => $end_time
            ]];

            $stmt = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, app_type, status_type, start_date, end_date,
                    start_time, end_time, payload_json, status, approval_status, created_at
                ) VALUES (
                    ?, '希望シフト', ?, ?, ?,
                    ?, ?, ?, ?, '承認待ち', NOW()
                )
            ");
            $stmt->execute([
                $user_id,
                $status,
                $work_date,
                $work_date,
                $start_time,
                $end_time,
                json_encode($payload, JSON_UNESCAPED_UNICODE),
                $status
            ]);

            echo json_encode(['success' => true, 'message' => '希望シフトを申請しました（管理者の承認待ちです）。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 希望シフト一括登録（複数日対応：承認待ちとして登録） ---
    if ($action === 'submit_bulk_shifts') {
        $shifts = $input['shifts'] ?? [];
        $comment = $input['comment'] ?? '';
        if (!is_array($shifts) || count($shifts) === 0) {
            echo json_encode(['success' => false, 'error' => 'シフトデータが選択されていません。']);
            exit;
        }

        try {
            $dates = array_column($shifts, 'work_date');
            sort($dates);
            $start_date = $dates[0];
            $end_date = $dates[count($dates) - 1];
            $first_status = $shifts[0]['status'] ?? '希望シフト';

            $stmt = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, app_type, status_type, start_date, end_date,
                    payload_json, reason, status, approval_status, created_at
                ) VALUES (
                    ?, '希望シフト', ?, ?, ?,
                    ?, ?, ?, '承認待ち', NOW()
                )
            ");
            $stmt->execute([
                $user_id,
                $first_status,
                $start_date,
                $end_date,
                json_encode($shifts, JSON_UNESCAPED_UNICODE),
                $comment,
                $first_status
            ]);

            echo json_encode(['success' => true, 'message' => count($shifts) . '日分の希望シフトを申請しました（管理者の承認待ちです）。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 有休申請の登録（期間指定・複数日対応：承認待ちとして登録） ---
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

        $status_type = ($leave_type === 'half') ? '午前休' : '有給休暇';

        try {
            $stmt = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, app_type, status_type, start_date, end_date,
                    reason, status, approval_status, created_at
                ) VALUES (
                    ?, '有休申請', ?, ?, ?,
                    ?, ?, '承認待ち', NOW()
                )
            ");
            $stmt->execute([
                $user_id,
                $status_type,
                $start_date,
                $end_date,
                $reason,
                $status_type
            ]);

            echo json_encode(['success' => true, 'message' => '有休申請を送信しました（管理者の承認待ちです）。']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 申請の承認（shifts テーブルへ反映） ---
    if ($action === 'approve_application') {
        $application_id = intval($input['application_id'] ?? 0);
        if ($application_id <= 0) {
            echo json_encode(['success' => false, 'error' => '申請IDが不正です。']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT * FROM shifts WHERE shift_id = ? AND app_type IS NOT NULL FOR UPDATE");
            $stmt->execute([$application_id]);
            $app = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$app) {
                $pdo->rollBack();
                echo json_encode(['success' => false, 'error' => '対象の申請が見つかりません。']);
                exit;
            }

            $insertShiftStmt = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, dept_id, work_date, start_time, end_time,
                    status, approval_status, source_application_id, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, '承認済み', ?, NOW()
                )
            ");

            $deleteOldDayStmt = $pdo->prepare("
                DELETE FROM shifts
                WHERE user_id = ?
                  AND app_type IS NULL
                  AND work_date IS NOT NULL
                  AND DATE(work_date) = ?
            ");

            if ($app['app_type'] === '希望シフト' && !empty($app['payload_json'])) {
                $rows = json_decode($app['payload_json'], true) ?: [];
                foreach ($rows as $row) {
                    if (empty($row['work_date']) || empty($row['status'])) continue;
                    $deleteOldDayStmt->execute([$app['user_id'], $row['work_date']]);
                    $insertShiftStmt->execute([
                        $app['user_id'],
                        $app['dept_id'],
                        $row['work_date'] . ' 09:00:00',
                        $row['start_time'] ?? null,
                        $row['end_time'] ?? null,
                        $row['status'],
                        $application_id
                    ]);
                }
            } else {
                $current = new DateTime($app['start_date']);
                $end = new DateTime($app['end_date']);
                $isHalf = ($app['status_type'] === '午前休');
                $startTime = $isHalf ? '09:00:00' : null;
                $endTime = $isHalf ? '13:00:00' : null;

                while ($current <= $end) {
                    $dayStr = $current->format('Y-m-d');
                    $deleteOldDayStmt->execute([$app['user_id'], $dayStr]);
                    $insertShiftStmt->execute([
                        $app['user_id'],
                        $app['dept_id'],
                        $dayStr . ' 09:00:00',
                        $startTime,
                        $endTime,
                        $app['status_type'],
                        $application_id
                    ]);
                    $current->modify('+1 day');
                }
            }

            $updStmt = $pdo->prepare("
                UPDATE shifts
                SET approval_status = '承認済み', upated_at = NOW()
                WHERE shift_id = ?
            ");
            $updStmt->execute([$application_id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => '申請を承認し、シフトに反映しました。']);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // --- 申請の拒否（shifts テーブルの申請レコードを削除） ---
    if ($action === 'reject_application') {
        $application_id = intval($input['application_id'] ?? 0);
        if ($application_id <= 0) {
            echo json_encode(['success' => false, 'error' => '申請IDが不正です。']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM shifts WHERE shift_id = ? AND app_type IS NOT NULL");
            $stmt->execute([$application_id]);
            echo json_encode(['success' => true, 'message' => '申請を拒否し、履歴から削除しました。']);
        } catch (PDOException $e) {
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
                INSERT INTO shifts (user_id, work_date, status, approval_status, created_at) 
                VALUES (?, ?, ?, '承認済み', NOW())
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                approval_status = '承認済み',
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