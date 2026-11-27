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

    // --- シフトルーレット用 メンバー・部署・負担スコア取得 ---
    if ($action === 'get_roulette_options') {
        try {
            $stmtUsers = $pdo->query("
                SELECT
                    u.user_id,
                    COALESCE(NULLIF(TRIM(u.display_name), ''), CONCAT('ユーザーID:', u.user_id)) AS display_name,
                    COALESCE(SUM(ws.total_score), 0) AS burden_score
                FROM users u
                LEFT JOIN workload_scores ws ON u.user_id = ws.user_id
                GROUP BY u.user_id, u.display_name
                ORDER BY u.user_id ASC
            ");
            $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

            $stmtDepts = $pdo->query("
                SELECT
                    d.dept_id,
                    COALESCE(NULLIF(TRIM(d.dept_name), ''), CONCAT('部署ID:', d.dept_id)) AS dept_name
                FROM departments d
                ORDER BY d.dept_id ASC
            ");
            $departments = $stmtDepts->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'users' => $users,
                'departments' => $departments
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
        $target_member_type = $input['target_member_type'] ?? 'all';
        $target_user_id = $input['target_user_id'] ?? null;
        $target_dept_id = $input['target_dept_id'] ?? null;
        $winner_count = max(1, intval($input['winner_count'] ?? 1));
        $conditions = $input['conditions'] ?? [];

        $prefer_shift = !empty($conditions['prefer_shift']);
        $exclude_leave = !empty($conditions['exclude_leave']);
        $consider_busy = !empty($conditions['consider_busy']);
        $max_consecutive = !empty($conditions['max_consecutive']);
        $use_burden_score = !empty($conditions['use_burden_score']);

        if (empty($target_date)) {
            echo json_encode(['success' => false, 'error' => '対象日が指定されていません。']);
            exit;
        }

        try {
            // 1. 対象メンバー一覧を取得（最新DBスキーマ対応）
            if ($target_member_type === 'member' && !empty($target_user_id)) {
                $stmtUsers = $pdo->prepare("SELECT user_id, group_id FROM users WHERE user_id = ?");
                $stmtUsers->execute([intval($target_user_id)]);
                $candidates = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
            } elseif ($target_member_type === 'dept' && !empty($target_dept_id)) {
                $stmtUsers = $pdo->prepare("
                    SELECT DISTINCT dm.user_id, d.group_id
                    FROM department_members dm
                    LEFT JOIN departments d ON dm.dept_id = d.dept_id
                    WHERE dm.dept_id = ?
                ");
                $stmtUsers->execute([intval($target_dept_id)]);
                $candidates = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $stmtUsers = $pdo->query("SELECT user_id, group_id FROM users");
                $candidates = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
            }

            if (empty($candidates)) {
                $candidates = [['user_id' => intval($user_id), 'group_id' => null]];
            }

            // 繁忙期ボーナスポイント取得
            $bonusPt = 0.0;
            if ($consider_busy) {
                $stmtBusy = $pdo->prepare("SELECT bonus_pt FROM busy_day_settings WHERE date = ? AND is_active = 1 LIMIT 1");
                $stmtBusy->execute([$target_date]);
                $busyRow = $stmtBusy->fetch(PDO::FETCH_ASSOC);
                if ($busyRow && isset($busyRow['bonus_pt'])) {
                    $bonusPt = floatval($busyRow['bonus_pt']);
                }
            }

            $weightedPool = [];
            $targetDt = new DateTime($target_date);
            $checkStart = (clone $targetDt)->modify('-5 days')->format('Y-m-d');
            $checkEnd = (clone $targetDt)->modify('+5 days')->format('Y-m-d');

            foreach ($candidates as $cand) {
                $uid = intval($cand['user_id']);

                // 条件: 有休申請を除外する
                if ($exclude_leave) {
                    $stmtLeave = $pdo->prepare("
                        SELECT COUNT(*) FROM shifts
                        WHERE user_id = ?
                          AND status_type IN ('有給休暇', '午前休')
                          AND approval_status != '却下'
                          AND start_date <= ? AND end_date >= ?
                    ");
                    $stmtLeave->execute([$uid, $target_date, $target_date]);
                    if (intval($stmtLeave->fetchColumn()) > 0) {
                        continue;
                    }
                }

                // 条件: 連続勤務日数の上限（5日まで）を考慮
                if ($max_consecutive) {
                    $stmtConsec = $pdo->prepare("
                        SELECT COUNT(*) FROM shifts
                        WHERE user_id = ?
                          AND app_type IS NULL
                          AND approval_status = '承認済み'
                          AND status NOT IN ('休日', '有給休暇')
                          AND work_date IS NOT NULL
                          AND DATE(work_date) BETWEEN ? AND ?
                    ");
                    $stmtConsec->execute([$uid, $checkStart, $checkEnd]);
                    if (intval($stmtConsec->fetchColumn()) >= 5) {
                        continue;
                    }
                }

                // 重み算出（workload_scores の total_score が低いほど当選しやすい）
                $weight = 10.0;
                if ($use_burden_score) {
                    $stmtBurden = $pdo->prepare("
                        SELECT COALESCE(SUM(total_score), 0)
                        FROM workload_scores
                        WHERE user_id = ?
                    ");
                    $stmtBurden->execute([$uid]);
                    $burdenScore = floatval($stmtBurden->fetchColumn());
                    $weight = max(1.0, 500.0 - $burdenScore);
                }

                // 条件: 希望シフトを優先する
                if ($prefer_shift) {
                    $stmtPref = $pdo->prepare("
                        SELECT COUNT(*) FROM shifts
                        WHERE user_id = ?
                          AND app_type = '希望シフト'
                          AND status_type = ?
                          AND start_date <= ? AND end_date >= ?
                    ");
                    $stmtPref->execute([$uid, $shift_type, $target_date, $target_date]);
                    if (intval($stmtPref->fetchColumn()) > 0) {
                        $weight *= 2.0;
                    }
                }

                // 繁忙期加算ポイント反映
                if ($consider_busy && $bonusPt > 0) {
                    $weight += $bonusPt;
                }

                $weightedPool[] = [
                    'user_id' => $uid,
                    'group_id' => $cand['group_id'] ?? null,
                    'weight' => $weight
                ];
            }

            if (empty($weightedPool)) {
                echo json_encode(['success' => false, 'error' => '条件を満たす対象メンバーが見つかりませんでした。']);
                exit;
            }

            // 2. 重み付き抽選で当選者を選出
            $winners = [];
            $actualCount = min($winner_count, count($weightedPool));
            for ($i = 0; $i < $actualCount; $i++) {
                $totalWeight = array_sum(array_column($weightedPool, 'weight'));
                $rand = mt_rand() / mt_getrandmax() * $totalWeight;
                $acc = 0.0;
                $pickedIndex = count($weightedPool) - 1;

                foreach ($weightedPool as $idx => $item) {
                    $acc += $item['weight'];
                    if ($rand <= $acc) {
                        $pickedIndex = $idx;
                        break;
                    }
                }

                $winners[] = $weightedPool[$pickedIndex];
                array_splice($weightedPool, $pickedIndex, 1);
            }

            // 3. shifts テーブルへ反映（承認済み・確定シフトとして登録）
            $pdo->beginTransaction();
            $delStmt = $pdo->prepare("
                DELETE FROM shifts
                WHERE user_id = ?
                  AND app_type IS NULL
                  AND work_date IS NOT NULL
                  AND DATE(work_date) = ?
            ");
            $insStmt = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, group_id, work_date, start_time, end_time,
                    status, approval_status, bonus_pt, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, '承認済み', ?, NOW()
                )
            ");

            $startTime = '09:00:00';
            $endTime = ($shift_type === '午前休') ? '13:00:00' : '18:00:00';
            $winnerIds = [];

            foreach ($winners as $w) {
                $delStmt->execute([$w['user_id'], $target_date]);
                $insStmt->execute([
                    $w['user_id'],
                    $w['group_id'] ?? null,
                    $target_date . ' 09:00:00',
                    $startTime,
                    $endTime,
                    $shift_type,
                    $consider_busy ? $bonusPt : null
                ]);
                $winnerIds[] = $w['user_id'];
            }
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => "対象ユーザーID（" . implode(', ', $winnerIds) . "）に「{$shift_type}」を割り当てました。",
                'winners' => $winnerIds
            ]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'error' => '無効なリクエストです。']);
}