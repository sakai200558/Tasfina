<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'ログインしていません。再ログインしてください。']);
    exit;
}

$session_user_id = intval($_SESSION['user_id']);
$method = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// GET リクエスト
// =========================================================================
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $user_id = $session_user_id;

    // 1. カレンダー用の月間シフト & 繁忙日 & 集計取得
    if ($action === 'get_month_data') {
        $ym = $_GET['ym'] ?? date('Y-m');

        $stmt = $pdo->prepare("
            SELECT shift_id, user_id, dept_id, app_type, status_type,
                   DATE(work_date) AS work_date, start_date, end_date,
                   start_time, end_time, reason,
                   COALESCE(status_type, status) AS status,
                   approval_status, busy_day_flag, bonus_pt
            FROM shifts
            WHERE user_id = ?
              AND DATE_FORMAT(work_date, '%Y-%m') = ?
              AND approval_status IN ('承認済み', '承認待ち')
            ORDER BY work_date ASC, FIELD(approval_status, '承認済み', '承認待ち'), shift_id ASC
        ");
        $stmt->execute([$user_id, $ym]);
        $shifts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $busy_days = [];
        try {
            $bStmt = $pdo->prepare("SELECT * FROM busy_day_settings WHERE DATE_FORMAT(target_date, '%Y-%m') = ?");
            $bStmt->execute([$ym]);
            foreach ($bStmt->fetchAll(PDO::FETCH_ASSOC) as $b) {
                $d = $b['target_date'] ?? $b['busy_date'] ?? $b['date'] ?? '';
                if ($d) $busy_days[] = ['date' => substr($d, 0, 10)];
            }
        } catch (Exception $e) {
            foreach ($shifts as $s) {
                if (!empty($s['busy_day_flag'])) {
                    $busy_days[] = ['date' => $s['work_date']];
                }
            }
        }

        $sumStmt = $pdo->prepare("
            SELECT status_type, COUNT(*) AS count
            FROM shifts
            WHERE user_id = ?
              AND DATE_FORMAT(work_date, '%Y-%m') = ?
              AND approval_status = '承認済み'
            GROUP BY status_type
        ");
        $sumStmt->execute([$user_id, $ym]);
        $summary = $sumStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'shifts' => $shifts,
            'busy_days' => $busy_days,
            'summary' => $summary
        ]);
        exit;
    }


    // 2. ダッシュボード情報（ログインユーザー情報 & 本日のシフト）
    if ($action === 'get_dashboard_info') {
        $today = $_GET['today'] ?? date('Y-m-d');

        $uStmt = $pdo->prepare("SELECT user_id, display_name, display_name AS name, role_code, group_id FROM users WHERE user_id = ?");
        $uStmt->execute([$user_id]);
        $user = $uStmt->fetch(PDO::FETCH_ASSOC);

        $sStmt = $pdo->prepare("
            SELECT shift_id, COALESCE(status_type, status) AS status, start_time, end_time
            FROM shifts
            WHERE user_id = ? AND DATE(work_date) = ? AND approval_status = '承認済み'
            ORDER BY shift_id DESC LIMIT 1
        ");
        $sStmt->execute([$user_id, $today]);
        $todays_shift = $sStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        echo json_encode([
            'success' => true,
            'user' => $user,
            'todays_shift' => $todays_shift
        ]);
        exit;
    }
    // 3. 申請状況・申請履歴取得
    if ($action === 'get_applications') {
        $is_admin = ($_GET['is_admin'] ?? '0') === '1';

        if ($is_admin) {
            $sql = "
                SELECT s.shift_id AS application_id, s.user_id, u.display_name AS user_name,
                       s.app_type, s.status_type, s.status, s.approval_status,
                       s.start_date, s.end_date, s.reason, s.created_at AS applied_at
                FROM shifts s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.app_type IS NOT NULL AND s.app_type != ''
                ORDER BY FIELD(s.approval_status, '承認待ち', '承認済み'), s.created_at DESC
            ";
            $stmt = $pdo->query($sql);
        } else {
            $sql = "
                SELECT s.shift_id AS application_id, s.user_id, u.display_name AS user_name,
                       s.app_type, s.status_type, s.status, s.approval_status,
                       s.start_date, s.end_date, s.reason, s.created_at AS applied_at
                FROM shifts s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.user_id = ? AND s.app_type IS NOT NULL AND s.app_type != ''
                ORDER BY s.created_at DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
        }

        echo json_encode([
            'success' => true,
            'applications' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    // 4. ルーレット選択肢（メンバー・部署・負担スコア取得）
    if ($action === 'get_roulette_options') {
        try {
            $uSql = "
                SELECT u.user_id, u.display_name, dm.dept_id,
                       COALESCE(w.total_score, w.score, 0) AS burden_score
                FROM users u
                LEFT JOIN department_members dm ON u.user_id = dm.user_id
                LEFT JOIN workload_scores w ON u.user_id = w.user_id
                GROUP BY u.user_id
                ORDER BY burden_score ASC, u.user_id ASC
            ";
            $users = $pdo->query($uSql)->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $users = $pdo->query("SELECT user_id, display_name, NULL AS dept_id, 0 AS burden_score FROM users ORDER BY user_id ASC")->fetchAll(PDO::FETCH_ASSOC);
        }

        $departments = $pdo->query("SELECT dept_id, dept_name FROM departments ORDER BY dept_id ASC")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'users' => $users,
            'departments' => $departments
        ]);
        exit;
    }
}

// =========================================================================
// POST リクエスト
// =========================================================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $user_id = $session_user_id;

    // ユーザーのdept_idをdepartment_membersから取得
    $userDeptId = null;
    try {
        $dStmt = $pdo->prepare("SELECT dept_id FROM department_members WHERE user_id = ? LIMIT 1");
        $dStmt->execute([$user_id]);
        $userDeptId = $dStmt->fetchColumn() ?: null;
    } catch (Exception $e) {
        $userDeptId = null;
    }

    // 1. 希望シフト一括提出
    if ($action === 'submit_bulk_shifts') {
        $items = $input['shifts'] ?? [];
        $comment = $input['comment'] ?? $input['reason'] ?? '';

        if (empty($items)) {
            echo json_encode(['success' => false, 'error' => '希望シフトが選択されていません。']);
            exit;
        }

        $ins = $pdo->prepare("
            INSERT INTO shifts (
                user_id, dept_id, app_type, status_type, work_date, start_date, end_date,
                start_time, end_time, reason, status, approval_status, created_at, updated_at
            )
            VALUES (?, ?, '希望シフト', ?, ?, ?, ?, ?, ?, ?, ?, '承認待ち', NOW(), NOW())
        ");

        foreach ($items as $item) {
            $d = $item['date'] ?? $item['work_date'] ?? '';
            $stName = $item['type'] ?? $item['status'] ?? '通常出勤';
            if (!$d) continue;

            $stTime = $item['start_time'] ?? (($stName === '通常出勤' || $stName === '在宅勤務') ? '09:00:00' : null);
            $edTime = $item['end_time'] ?? (($stName === '通常出勤' || $stName === '在宅勤務') ? '18:00:00' : null);

            $ins->execute([
                $user_id, $userDeptId, $stName, $d . ' 00:00:00', $d, $d,
                $stTime, $edTime, $comment, $stName
            ]);
        }

        echo json_encode(['success' => true, 'message' => count($items) . '日分の希望シフトを申請しました。']);
        exit;
    }
    // 2. 有休申請提出
    if ($action === 'submit_paid_leave') {
        $leaveType = $input['leave_type'] ?? 'full';
        $startDate = $input['start_date'] ?? '';
        $endDate = $input['end_date'] ?? $startDate;
        $reason = $input['reason'] ?? '';

        if (!$startDate || !$endDate || !$reason) {
            echo json_encode(['success' => false, 'error' => '必須項目を入力してください。']);
            exit;
        }

        $statusType = ($leaveType === 'half') ? '午前休' : '有給休暇';
        $stTime = ($leaveType === 'half') ? '09:00:00' : null;
        $edTime = ($leaveType === 'half') ? '13:00:00' : null;

        $ins = $pdo->prepare("
            INSERT INTO shifts (
                user_id, dept_id, app_type, status_type, work_date, start_date, end_date,
                start_time, end_time, reason, status, approval_status, created_at, updated_at
            )
            VALUES (?, ?, '有休申請', ?, ?, ?, ?, ?, ?, ?, ?, '承認待ち', NOW(), NOW())
        ");
        $ins->execute([
            $user_id, $userDeptId, $statusType, $startDate . ' 00:00:00', $startDate, $endDate,
            $stTime, $edTime, $reason, $statusType
        ]);

        echo json_encode(['success' => true, 'message' => '有休申請を送信しました。']);
        exit;
    }

    // 3. 申請の承認（管理者）
    if ($action === 'approve_application') {
        $appId = intval($input['application_id'] ?? 0);
        $stmt = $pdo->prepare("SELECT * FROM shifts WHERE shift_id = ?");
        $stmt->execute([$appId]);
        $app = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$app) {
            echo json_encode(['success' => false, 'error' => '申請データが見つかりません。']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            $del = $pdo->prepare("DELETE FROM shifts WHERE user_id = ? AND DATE(work_date) = DATE(?) AND approval_status = '承認済み' AND shift_id != ?");
            $del->execute([$app['user_id'], $app['work_date'], $appId]);

            $upd = $pdo->prepare("UPDATE shifts SET approval_status = '承認済み', updated_at = NOW() WHERE shift_id = ?");
            $upd->execute([$appId]);

            if (!empty($app['start_date']) && !empty($app['end_date']) && $app['start_date'] !== $app['end_date']) {
                $curr = strtotime('+1 day', strtotime($app['start_date']));
                $end = strtotime($app['end_date']);
                $ins = $pdo->prepare("
                    INSERT INTO shifts (
                        user_id, dept_id, status_type, work_date, start_date, end_date,
                        start_time, end_time, reason, status, approval_status, source_application_id, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '承認済み', ?, NOW(), NOW())
                ");
                while ($curr <= $end) {
                    $dStr = date('Y-m-d', $curr);
                    $pdo->prepare("DELETE FROM shifts WHERE user_id = ? AND DATE(work_date) = ? AND approval_status = '承認済み'")->execute([$app['user_id'], $dStr]);
                    $ins->execute([
                        $app['user_id'], $app['dept_id'], $app['status_type'], $dStr . ' 00:00:00',
                        $dStr, $dStr, $app['start_time'], $app['end_time'], $app['reason'], $app['status_type'], $appId
                    ]);
                    $curr = strtotime('+1 day', $curr);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => '申請を承認しました。']);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => '承認エラー: ' . $e->getMessage()]);
        }
        exit;
    }

    // 4. 申請の拒否（削除）
    if ($action === 'reject_application') {
        $appId = intval($input['application_id'] ?? 0);
        $del = $pdo->prepare("DELETE FROM shifts WHERE shift_id = ?");
        $del->execute([$appId]);
        echo json_encode(['success' => true, 'message' => '申請を拒否しました。']);
        exit;
    }

    // 5. 繁忙期設定の保存
    if ($action === 'save_busy_period') {
        $startDate = $input['start_date'] ?? '';
        $endDate = $input['end_date'] ?? $startDate;
        $bonusPt = floatval($input['bonus_pt'] ?? 2.0);

        $curr = strtotime($startDate);
        $end = strtotime($endDate);
        while ($curr <= $end) {
            $dStr = date('Y-m-d', $curr);
            $pdo->prepare("UPDATE shifts SET busy_day_flag = 1, bonus_pt = ? WHERE DATE(work_date) = ?")->execute([$bonusPt, $dStr]);
            $curr = strtotime('+1 day', $curr);
        }

        echo json_encode(['success' => true, 'message' => '繁忙期設定を保存しました。']);
        exit;
    }

    // 6. ルーレット実行
    if ($action === 'execute_roulette') {
        $targetDate = $input['target_date'] ?? '';
        $shiftType = $input['shift_type'] ?? '在宅勤務';
        $memberType = $input['target_member_type'] ?? 'all';
        $targetUserId = intval($input['target_user_id'] ?? 0);
        $targetDeptId = intval($input['target_dept_id'] ?? 0);
        $winnerCount = max(1, intval($input['winner_count'] ?? 1));

        if ($memberType === 'member' && $targetUserId) {
            $candidates = [$targetUserId];
        } elseif ($memberType === 'dept' && $targetDeptId) {
            $stmt = $pdo->prepare("SELECT user_id FROM department_members WHERE dept_id = ?");
            $stmt->execute([$targetDeptId]);
            $candidates = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } else {
            $candidates = $pdo->query("SELECT user_id FROM users")->fetchAll(PDO::FETCH_COLUMN);
        }

        if (empty($candidates)) {
            echo json_encode(['success' => false, 'error' => '対象となるメンバーが見つかりません。']);
            exit;
        }

        shuffle($candidates);
        $winners = array_slice($candidates, 0, $winnerCount);
        $winnerNames = [];

        foreach ($winners as $wId) {
            $uInfo = $pdo->prepare("SELECT display_name FROM users WHERE user_id = ?");
            $uInfo->execute([$wId]);
            $uName = $uInfo->fetchColumn();
            if ($uName) $winnerNames[] = $uName;

            $wDeptId = null;
            try {
                $wdStmt = $pdo->prepare("SELECT dept_id FROM department_members WHERE user_id = ? LIMIT 1");
                $wdStmt->execute([$wId]);
                $wDeptId = $wdStmt->fetchColumn() ?: null;
            } catch (Exception $e) {}

            $pdo->prepare("DELETE FROM shifts WHERE user_id = ? AND DATE(work_date) = ? AND approval_status = '承認済み'")->execute([$wId, $targetDate]);
            $ins = $pdo->prepare("
                INSERT INTO shifts (
                    user_id, dept_id, app_type, status_type, work_date, start_date, end_date,
                    start_time, end_time, reason, status, approval_status, created_at, updated_at
                )
                VALUES (?, ?, 'ルーレット割当', ?, ?, ?, ?, '09:00:00', '18:00:00', 'シフトルーレット確定', ?, '承認済み', NOW(), NOW())
            ");
            $ins->execute([$wId, $wDeptId, $shiftType, $targetDate . ' 00:00:00', $targetDate, $targetDate, $shiftType]);
        }

        echo json_encode([
            'success' => true,
            'message' => '当選者（' . implode('、', $winnerNames) . '）に' . $shiftType . 'を割り当てました。'
        ]);
        exit;
    }
}

echo json_encode(['success' => false, 'error' => '不正なリクエストです。']);
?>
