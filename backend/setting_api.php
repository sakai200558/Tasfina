<?php

session_start();

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

/* ========================================
   共通処理：JSONレスポンス
======================================== */

function sendResponse($status, $data)
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

/* ========================================
   共通処理：入力チェック
======================================== */

function validate($condition, $message)
{
    if (!$condition) {
        sendResponse(400, [
            "success" => false,
            "message" => $message
        ]);
    }
}

function validNumber($value, $min, $max)
{
    return
        (is_int($value) || is_float($value)) &&
        is_finite((float)$value) &&
        $value >= $min &&
        $value <= $max;
}

function validText($value, $max, $required = true)
{
    return
        is_string($value) &&
        (!$required || trim($value) !== "") &&
        mb_strlen($value, "UTF-8") <= $max;
}

/* ========================================
   初期データ：シフト種別
======================================== */

function defaultShiftTypes()
{
    return [
        [
            "id" => 1,
            "name" => "通常出勤",
            "color" => "#409eff",
            "start" => "09:00",
            "end" => "18:00",
            "breakMinutes" => 60,
            "score" => 1.0,
            "description" => "通常の勤務"
        ],
        [
            "id" => 2,
            "name" => "在宅勤務",
            "color" => "#50c99c",
            "start" => "09:00",
            "end" => "18:00",
            "breakMinutes" => 60,
            "score" => 0.8,
            "description" => "在宅での勤務"
        ],
        [
            "id" => 3,
            "name" => "午前休",
            "color" => "#ffca62",
            "start" => "13:00",
            "end" => "18:00",
            "breakMinutes" => 0,
            "score" => 0.5,
            "description" => "午前休暇・午後勤務"
        ],
        [
            "id" => 4,
            "name" => "午後休",
            "color" => "#ffd49b",
            "start" => "09:00",
            "end" => "13:00",
            "breakMinutes" => 0,
            "score" => 0.5,
            "description" => "午後休暇・午前勤務"
        ],
        [
            "id" => 5,
            "name" => "有給休暇",
            "color" => "#ff8394",
            "start" => "",
            "end" => "",
            "breakMinutes" => 0,
            "score" => 0.0,
            "description" => "有給休暇取得"
        ],
        [
            "id" => 6,
            "name" => "休日",
            "color" => "#cbd2de",
            "start" => "",
            "end" => "",
            "breakMinutes" => 0,
            "score" => 0.0,
            "description" => "所定休日"
        ]
    ];
}

/* ========================================
   初期データ：業務タイプ
======================================== */

function defaultWorkTypes()
{
    return [
        [
            "id" => 1,
            "name" => "通常業務",
            "multiplier" => 1.0,
            "enabled" => true
        ],
        [
            "id" => 2,
            "name" => "専門業務",
            "multiplier" => 1.2,
            "enabled" => true
        ],
        [
            "id" => 3,
            "name" => "高負荷業務",
            "multiplier" => 1.3,
            "enabled" => true
        ],
        [
            "id" => 4,
            "name" => "緊急対応",
            "multiplier" => 1.5,
            "enabled" => true
        ]
    ];
}

/* ========================================
   初期データ：設定全体
======================================== */

function defaultSettings()
{
    return [
        "shiftTypes" => defaultShiftTypes(),

        "rules" => [
            "maxConsecutiveDays" => 5,
            "maxMonthlyDays" => 20,
            "requestPriority" => "high"
        ],

        "scoreSettings" => [
            "aggregationPeriod" => "4",
            "resetTiming" => "monthly",

            "conditions" => [
                "consecutive" => 0.2,
                "night" => 1.0,
                "early" => 0.5,
                "weeklyOver" => 1.0
            ]
        ],

        "workTypes" => defaultWorkTypes()
    ];
}

/* ========================================
   共通処理：JSON変換
======================================== */

function encodeData($data)
{
    return json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_THROW_ON_ERROR
    );
}

/* ========================================
   設定データ取得
======================================== */

function getSettings($pdo, $groupId)
{
    $stmt = $pdo->prepare("
        SELECT *
        FROM settings
        WHERE group_id = :group_id
        LIMIT 1
    ");

    $stmt->execute([
        ":group_id" => $groupId
    ]);

    $row = $stmt->fetch();

    // 未登録の場合は初期値を返す
    if (!$row) {
        return defaultSettings();
    }

    return [
        "shiftTypes" => json_decode(
            $row["shift_types"],
            true,
            512,
            JSON_THROW_ON_ERROR
        ),

        "rules" => [
            "maxConsecutiveDays" =>
                (int)$row["max_consecutive_days"],

            "maxMonthlyDays" =>
                (int)$row["max_monthly_days"],

            "requestPriority" =>
                $row["request_priority"]
        ],

        "scoreSettings" => [
            "aggregationPeriod" =>
                (string)$row["aggregation_period"],

            "resetTiming" =>
                $row["reset_timing"],

            "conditions" => [
                "consecutive" =>
                    (float)$row["consecutive_score"],

                "night" =>
                    (float)$row["night_score"],

                "early" =>
                    (float)$row["early_score"],

                "weeklyOver" =>
                    (float)$row["weekly_over_score"]
            ]
        ],

        "workTypes" => json_decode(
            $row["work_types"],
            true,
            512,
            JSON_THROW_ON_ERROR
        )
    ];
}

/* ========================================
   初回保存時：設定データ作成
======================================== */

function initializeSettings($pdo, $groupId)
{
    $stmt = $pdo->prepare("
        INSERT INTO settings (
            group_id,
            shift_types,
            work_types
        )
        VALUES (
            :group_id,
            :shift_types,
            :work_types
        )
        ON DUPLICATE KEY UPDATE
            id = id
    ");

    $stmt->execute([
        ":group_id" => $groupId,

        ":shift_types" =>
            encodeData(defaultShiftTypes()),

        ":work_types" =>
            encodeData(defaultWorkTypes())
    ]);
}

/* ========================================
   シフト種別：入力チェック
======================================== */

function validateShiftTypes($items)
{
    validate(
        is_array($items) &&
        array_values($items) === $items &&
        count($items) <= 100,
        "シフト種別のデータが不正です。"
    );

    $ids = [];
    $names = [];

    foreach ($items as $item) {

        validate(
            is_array($item),
            "シフト種別の形式が不正です。"
        );

        $id = $item["id"] ?? null;
        $name = $item["name"] ?? null;
        $color = $item["color"] ?? null;
        $start = $item["start"] ?? null;
        $end = $item["end"] ?? null;
        $break = $item["breakMinutes"] ?? null;
        $score = $item["score"] ?? null;
        $description = $item["description"] ?? null;

        validate(
            is_int($id) &&
            $id > 0 &&
            !isset($ids[$id]),
            "シフト種別IDが不正です。"
        );

        validate(
            validText($name, 50),
            "シフト種別名は1～50文字で入力してください。"
        );

        validate(
            !isset($names[trim($name)]),
            "シフト種別名が重複しています。"
        );

        validate(
            is_string($color) &&
            preg_match('/^#[0-9a-fA-F]{6}$/D', $color),
            "表示色が不正です。"
        );

        validate(
            is_string($start) &&
            is_string($end),
            "勤務時間が不正です。"
        );

        $timePattern = '/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/D';

        validate(
            ($start === "" && $end === "") ||
            (
                preg_match($timePattern, $start) &&
                preg_match($timePattern, $end) &&
                $start !== $end
            ),
            "開始時刻と終了時刻を確認してください。"
        );

        validate(
            in_array(
                $break,
                [0, 30, 45, 60, 90],
                true
            ),
            "休憩時間が不正です。"
        );

        if ($start === "") {

            validate(
                $break === 0,
                "勤務時間がない場合は休憩時間を設定できません。"
            );

        } else {

            $startParts = explode(":", $start);
            $endParts = explode(":", $end);

            $startMinutes =
                (int)$startParts[0] * 60 +
                (int)$startParts[1];

            $endMinutes =
                (int)$endParts[0] * 60 +
                (int)$endParts[1];

            $workingMinutes =
                ($endMinutes - $startMinutes + 1440) % 1440;

            validate(
                $break < $workingMinutes,
                "休憩時間は勤務時間より短くしてください。"
            );
        }

        validate(
            validNumber($score, 0, 10),
            "負担スコアは0～10で入力してください。"
        );

        validate(
            validText($description, 300, false),
            "説明は300文字以内で入力してください。"
        );

        $ids[$id] = true;
        $names[trim($name)] = true;
    }
}

/* ========================================
   自動調整ルール：入力チェック
======================================== */

function validateRules($data)
{
    $consecutive = $data["maxConsecutiveDays"] ?? null;
    $monthly = $data["maxMonthlyDays"] ?? null;
    $priority = $data["requestPriority"] ?? null;

    validate(
        is_int($consecutive) &&
        $consecutive >= 1 &&
        $consecutive <= 31,
        "連続勤務の上限は1～31日で入力してください。"
    );

    validate(
        is_int($monthly) &&
        $monthly >= 1 &&
        $monthly <= 31,
        "月間勤務の上限は1～31日で入力してください。"
    );

    validate(
        $consecutive <= $monthly,
        "連続勤務上限は月間勤務上限以下にしてください。"
    );

    validate(
        in_array(
            $priority,
            ["high", "medium", "low"],
            true
        ),
        "希望シフトの優先度が不正です。"
    );
}

/* ========================================
   負担スコア：入力チェック
======================================== */

function validateScores($data)
{
    validate(
        in_array(
            $data["aggregationPeriod"] ?? null,
            ["1", "2", "4", "8"],
            true
        ),
        "集計期間が不正です。"
    );

    validate(
        in_array(
            $data["resetTiming"] ?? null,
            ["weekly", "monthly", "quarterly", "none"],
            true
        ),
        "リセット時期が不正です。"
    );

    $conditions = $data["conditions"] ?? null;

    validate(
        is_array($conditions),
        "追加スコアのデータが不正です。"
    );

    $keys = [
        "consecutive",
        "night",
        "early",
        "weeklyOver"
    ];

    foreach ($keys as $key) {

        validate(
            validNumber(
                $conditions[$key] ?? null,
                0,
                100
            ),
            "追加スコアは0～100で入力してください。"
        );
    }
}

/* ========================================
   業務タイプ：入力チェック
======================================== */

function validateWorkTypes($items)
{
    validate(
        is_array($items) &&
        array_values($items) === $items &&
        count($items) >= 1 &&
        count($items) <= 100,
        "業務タイプは1～100件登録してください。"
    );

    $ids = [];
    $names = [];
    $hasEnabled = false;

    foreach ($items as $item) {

        validate(
            is_array($item),
            "業務タイプの形式が不正です。"
        );

        $id = $item["id"] ?? null;
        $name = $item["name"] ?? null;
        $multiplier = $item["multiplier"] ?? null;
        $enabled = $item["enabled"] ?? null;

        validate(
            is_int($id) &&
            $id > 0 &&
            !isset($ids[$id]),
            "業務タイプIDが不正です。"
        );

        validate(
            validText($name, 50),
            "業務タイプ名は1～50文字で入力してください。"
        );

        $normalizedName = mb_strtolower(
            trim($name),
            "UTF-8"
        );

        validate(
            !isset($names[$normalizedName]),
            "業務タイプ名が重複しています。"
        );

        validate(
            validNumber($multiplier, 0.1, 10),
            "業務倍率は0.1～10で入力してください。"
        );

        validate(
            is_bool($enabled),
            "有効・無効の設定が不正です。"
        );

        $ids[$id] = true;
        $names[$normalizedName] = true;

        if ($enabled) {
            $hasEnabled = true;
        }
    }

    validate(
        $hasEnabled,
        "業務タイプを1件以上有効にしてください。"
    );
}

/* ========================================
   リクエストメソッド確認
======================================== */

$method = $_SERVER["REQUEST_METHOD"];

if (!in_array($method, ["GET", "POST"], true)) {

    header("Allow: GET, POST");

    sendResponse(405, [
        "success" => false,
        "message" => "GETまたはPOSTでアクセスしてください。"
    ]);
}

/* ========================================
   ログイン確認
======================================== */

if (!isset($_SESSION["user_id"])) {

    sendResponse(401, [
        "success" => false,
        "message" => "ログインが必要です。"
    ]);
}

$userId = (int)$_SESSION["user_id"];

$groupId = filter_var(
    $_SESSION["group_id"] ?? null,
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 1
        ]
    ]
);

if ($groupId === false) {

    sendResponse(403, [
        "success" => false,
        "message" => "所属グループがありません。"
    ]);
}

/* ========================================
   メイン処理
======================================== */

try {

    /* ========================================
       データベース接続
    ======================================== */

    require_once __DIR__ . "/db.php";

    /* ========================================
       ユーザー情報・所属確認
    ======================================== */

    $stmt = $pdo->prepare("
        SELECT
            u.user_id,
            u.role_code
        FROM users AS u
        INNER JOIN user_groups AS ug
            ON u.user_id = ug.user_id
        WHERE u.user_id = :user_id
          AND ug.group_id = :group_id
        LIMIT 1
    ");

    $stmt->execute([
        ":user_id" => $userId,
        ":group_id" => $groupId
    ]);

    $user = $stmt->fetch();

    if (!$user) {

        sendResponse(403, [
            "success" => false,
            "message" => "このグループの設定にアクセスできません。"
        ]);
    }

    /* ========================================
       権限確認
    ======================================== */

    $roleCode = (string)$user["role_code"];

    if (!in_array(
        $roleCode,
        ["1000", "2000", "3000", "4000"],
        true
    )) {

        sendResponse(403, [
            "success" => false,
            "message" => "設定画面を利用する権限がありません。"
        ]);
    }

    $canEdit = in_array(
        $roleCode,
        ["1000", "2000"],
        true
    );

    /* ========================================
       CSRF対策
    ======================================== */

    if (empty($_SESSION["settings_csrf_token"])) {

        $_SESSION["settings_csrf_token"] =
            bin2hex(random_bytes(32));
    }

    $csrfToken = $_SESSION["settings_csrf_token"];

    /* ========================================
       GET：設定取得
    ======================================== */

    if ($method === "GET") {

        $settings = getSettings(
            $pdo,
            $groupId
        );

        sendResponse(200, [
            "success" => true,
            "group_id" => $groupId,
            "role_code" => $roleCode,
            "can_edit" => $canEdit,
            "csrf_token" => $csrfToken,
            "settings" => $settings
        ]);
    }

    /* ========================================
       POST：編集権限確認
    ======================================== */

    if (!$canEdit) {

        sendResponse(403, [
            "success" => false,
            "message" => "設定を変更する権限がありません。"
        ]);
    }

    /* ========================================
       POST：CSRFトークン確認
    ======================================== */

    $requestToken =
        $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";

    if (!hash_equals($csrfToken, $requestToken)) {

        sendResponse(403, [
            "success" => false,
            "message" => "リクエストが不正です。画面を再読み込みしてください。"
        ]);
    }

    /* ========================================
       POST：JSON取得
    ======================================== */

    $query = json_decode(
        file_get_contents("php://input"),
        true
    );

    validate(
        is_array($query),
        "送信データが不正です。"
    );

    $action = $query["action"] ?? "";
    $data = $query["data"] ?? null;

    validate(
        is_array($data),
        "設定データが不正です。"
    );

    /* ========================================
       保存対象の判定
    ======================================== */

    switch ($action) {

        /* ========================================
           シフト種別の保存
        ======================================== */

        case "save_shift_types":

            validateShiftTypes($data);

            $sql = "
                UPDATE settings
                SET shift_types = :shift_types
                WHERE group_id = :group_id
            ";

            $params = [
                ":shift_types" => encodeData($data),
                ":group_id" => $groupId
            ];

            $message =
                "シフト種別の設定を保存しました。";

            break;

        /* ========================================
           自動調整ルールの保存
        ======================================== */

        case "save_rules":

            validateRules($data);

            $sql = "
                UPDATE settings
                SET
                    max_consecutive_days =
                        :max_consecutive_days,

                    max_monthly_days =
                        :max_monthly_days,

                    request_priority =
                        :request_priority

                WHERE group_id = :group_id
            ";

            $params = [
                ":max_consecutive_days" =>
                    $data["maxConsecutiveDays"],

                ":max_monthly_days" =>
                    $data["maxMonthlyDays"],

                ":request_priority" =>
                    $data["requestPriority"],

                ":group_id" =>
                    $groupId
            ];

            $message =
                "自動調整ルールを保存しました。";

            break;

        /* ========================================
           負担スコア設定の保存
        ======================================== */

        case "save_scores":

            validateScores($data);

            $conditions = $data["conditions"];

            $sql = "
                UPDATE settings
                SET
                    aggregation_period =
                        :aggregation_period,

                    reset_timing =
                        :reset_timing,

                    consecutive_score =
                        :consecutive_score,

                    night_score =
                        :night_score,

                    early_score =
                        :early_score,

                    weekly_over_score =
                        :weekly_over_score

                WHERE group_id = :group_id
            ";

            $params = [
                ":aggregation_period" =>
                    (int)$data["aggregationPeriod"],

                ":reset_timing" =>
                    $data["resetTiming"],

                ":consecutive_score" =>
                    $conditions["consecutive"],

                ":night_score" =>
                    $conditions["night"],

                ":early_score" =>
                    $conditions["early"],

                ":weekly_over_score" =>
                    $conditions["weeklyOver"],

                ":group_id" =>
                    $groupId
            ];

            $message =
                "負担スコア設定を保存しました。";

            break;

        /* ========================================
           業務タイプ・倍率の保存
        ======================================== */

        case "save_work_types":

            validateWorkTypes($data);

            $sql = "
                UPDATE settings
                SET work_types = :work_types
                WHERE group_id = :group_id
            ";

            $params = [
                ":work_types" => encodeData($data),
                ":group_id" => $groupId
            ];

            $message =
                "業務タイプ・倍率設定を保存しました。";

            break;

        /* ========================================
           負担スコア設定のリセット
        ======================================== */

        case "reset_scores":

            $sql = "
                UPDATE settings
                SET
                    aggregation_period = 4,
                    reset_timing = 'monthly',
                    consecutive_score = 0.20,
                    night_score = 1.00,
                    early_score = 0.50,
                    weekly_over_score = 1.00
                WHERE group_id = :group_id
            ";

            $params = [
                ":group_id" => $groupId
            ];

            $message =
                "負担スコア設定を初期値に戻しました。";

            break;

        /* ========================================
           不正な操作
        ======================================== */

        default:

            sendResponse(400, [
                "success" => false,
                "message" => "指定された操作が不正です。"
            ]);
    }

    /* ========================================
       トランザクション開始
    ======================================== */

    $pdo->beginTransaction();

    /* ========================================
       未登録の場合は初期データを作成
    ======================================== */

    initializeSettings(
        $pdo,
        $groupId
    );

    /* ========================================
       設定更新
    ======================================== */

    $stmt = $pdo->prepare($sql);

    $stmt->execute($params);

    /* ========================================
       更新後の設定取得
    ======================================== */

    $settings = getSettings(
        $pdo,
        $groupId
    );

    /* ========================================
       保存確定
    ======================================== */

    $pdo->commit();

    /* ========================================
       保存成功
    ======================================== */

    sendResponse(200, [
        "success" => true,
        "message" => $message,
        "group_id" => $groupId,
        "can_edit" => $canEdit,
        "settings" => $settings
    ]);

} catch (Throwable $e) {

    /* ========================================
       保存失敗時：ロールバック
    ======================================== */

    if (
        isset($pdo) &&
        $pdo instanceof PDO &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    error_log(
        "設定APIエラー: " . $e->getMessage()
    );

    sendResponse(500, [
        "success" => false,
        "message" => "設定の取得または保存に失敗しました。"
    ]);
}