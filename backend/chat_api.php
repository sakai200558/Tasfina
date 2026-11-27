<?php

/* ========================================
   Tasfina チャットAPI
======================================== */

session_start();

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

define("CHAT_UPLOAD_DIR", "/var/lib/tasfina/chat_uploads");
define("CHAT_MAX_FILE_SIZE", 10 * 1024 * 1024);

/* ========================================
   共通関数
======================================== */

function response($data, $status = 200)
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

function fail($message, $status = 400)
{
    response([
        "success" => false,
        "message" => $message
    ], $status);
}

function requireMember($pdo, $roomId, $userId)
{
    $stmt = $pdo->prepare("
        SELECT room_id
        FROM chat_members
        WHERE room_id = ?
          AND user_id = ?
    ");

    $stmt->execute([$roomId, $userId]);

    if (!$stmt->fetchColumn()) {
        fail("このチャットを利用する権限がありません。", 403);
    }
}

function getRoomId($data)
{
    $roomId = filter_var(
        $data["room_id"] ?? null,
        FILTER_VALIDATE_INT
    );

    if (!$roomId || $roomId < 1) {
        fail("チャットIDが正しくありません。");
    }

    return $roomId;
}

function getUserIds($data)
{
    $values = $data["user_ids"] ?? [];

    if (!is_array($values)) {
        fail("ユーザーの指定が正しくありません。");
    }

    $ids = [];

    foreach ($values as $value) {

        $id = filter_var(
            $value,
            FILTER_VALIDATE_INT
        );

        if (!$id || $id < 1) {
            fail("ユーザーIDが正しくありません。");
        }

        $ids[] = $id;
    }

    $ids = array_values(array_unique($ids));

    if (count($ids) > 100) {
        fail("一度に指定できるユーザーは100人までです。");
    }

    return $ids;
}

function validateUsers($pdo, $userIds)
{
    if (empty($userIds)) {
        fail("ユーザーを選択してください。");
    }

    $placeholders = implode(
        ",",
        array_fill(0, count($userIds), "?")
    );

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM users
        WHERE user_id IN ($placeholders)
    ");

    $stmt->execute($userIds);

    if ((int)$stmt->fetchColumn() !== count($userIds)) {
        fail("存在しないユーザーが含まれています。");
    }
}

/* ========================================
   ログイン確認
======================================== */

$userId = (int)($_SESSION["user_id"] ?? 0);

if ($userId <= 0) {
    fail("ログインしてください。", 401);
}

/* CSRF対策 */

if (empty($_SESSION["chat_csrf_token"])) {
    $_SESSION["chat_csrf_token"] =
        bin2hex(random_bytes(32));
}

$csrfToken = $_SESSION["chat_csrf_token"];

session_write_close();

$savedFilePath = null;

try {

    require_once __DIR__ . "/db.php";

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    /* ========================================
       ログインユーザーの取得
    ======================================== */

    $stmt = $pdo->prepare("
        SELECT
            user_id,
            display_name,
            role_code
        FROM users
        WHERE user_id = ?
    ");

    $stmt->execute([$userId]);

    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentUser) {
        fail("ユーザーが存在しません。", 401);
    }

    $canSend = (string)$currentUser["role_code"] !== "4000";

    /* ========================================
       リクエスト取得
    ======================================== */

    $method = $_SERVER["REQUEST_METHOD"];

    $data = $_GET;

    if ($method === "POST") {

        $contentType = $_SERVER["CONTENT_TYPE"] ?? "";

        if (strpos($contentType, "application/json") !== false) {

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (!is_array($data)) {
                fail("リクエスト形式が正しくありません。");
            }

        } else {

            $data = $_POST;
        }
    }

    $action = $data["action"] ?? "rooms";

    $readActions = [
        "users",
        "rooms",
        "messages",
        "members"
    ];

    $writeActions = [
        "create",
        "send",
        "add_members"
    ];

    if (in_array($action, $readActions, true)) {

        if ($method !== "GET") {
            fail("GETでアクセスしてください。", 405);
        }

    } elseif (in_array($action, $writeActions, true)) {

        if ($method !== "POST") {
            fail("POSTでアクセスしてください。", 405);
        }

        if (!$canSend) {
            fail("閲覧専用ユーザーは操作できません。", 403);
        }

        $requestToken = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";

        if (!hash_equals($csrfToken, $requestToken)) {
            fail("不正なリクエストです。", 403);
        }

    } else {

        fail("存在しない処理です。", 404);
    }

    /* ========================================
       1. 登録済みユーザー一覧
    ======================================== */

    if ($action === "users") {

        $stmt = $pdo->prepare("
            SELECT
                user_id AS id,
                COALESCE(
                    NULLIF(display_name, ''),
                    CONCAT('ユーザー', user_id)
                ) AS name,
                role_code,
                job_title
            FROM users
            WHERE user_id <> ?
            ORDER BY display_name, user_id
        ");

        $stmt->execute([$userId]);

        response([
            "success" => true,
            "current_user_id" => $userId,
            "current_user_name" => $currentUser["display_name"],
            "can_send" => $canSend,
            "csrf_token" => $csrfToken,
            "users" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    /* ========================================
       2. チャット一覧
    ======================================== */

    if ($action === "rooms") {

        $stmt = $pdo->prepare("
            SELECT
                r.id,
                r.type,
                r.description,
                r.created_by,
                r.created_at,

                CASE
                    WHEN r.type = 'direct' THEN
                        COALESCE(
                            (
                                SELECT NULLIF(u.display_name, '')
                                FROM chat_members cm
                                INNER JOIN users u
                                    ON u.user_id = cm.user_id
                                WHERE cm.room_id = r.id
                                  AND cm.user_id <> me.user_id
                                LIMIT 1
                            ),
                            '個人チャット'
                        )
                    ELSE r.name
                END AS name,

                (
                    SELECT COUNT(*)
                    FROM chat_members cm
                    WHERE cm.room_id = r.id
                ) AS member_count,

                lm.id AS last_message_id,
                lm.message AS last_message,
                lm.created_at AS last_message_at,
                lu.display_name AS last_sender_name,

                (
                    SELECT COUNT(*)
                    FROM chat_messages m
                    WHERE m.room_id = r.id
                      AND m.id > me.last_read_message_id
                      AND m.sender_id <> me.user_id
                ) AS unread_count

            FROM chat_rooms r

            INNER JOIN chat_members me
                ON me.room_id = r.id

            LEFT JOIN chat_messages lm
                ON lm.id = (
                    SELECT MAX(m.id)
                    FROM chat_messages m
                    WHERE m.room_id = r.id
                )

            LEFT JOIN users lu
                ON lu.user_id = lm.sender_id

            WHERE me.user_id = ?

            ORDER BY
                COALESCE(lm.created_at, r.created_at) DESC,
                r.id DESC
        ");

        $stmt->execute([$userId]);

        response([
            "success" => true,
            "current_user_id" => $userId,
            "can_send" => $canSend,
            "csrf_token" => $csrfToken,
            "rooms" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    /* ========================================
       3. チャット作成
    ======================================== */

    if ($action === "create") {

        $type = $data["type"] ?? "direct";

        $name = trim((string)($data["name"] ?? ""));

        $description = trim(
            (string)($data["description"] ?? "")
        );

        $userIds = getUserIds($data);

        $userIds = array_values(
            array_filter(
                $userIds,
                fn($id) => $id !== $userId
            )
        );

        validateUsers($pdo, $userIds);

        if (!in_array($type, ["direct", "group"], true)) {
            fail("チャット種別が正しくありません。");
        }

        if (mb_strlen($description) > 500) {
            fail("説明は500文字以内で入力してください。");
        }

        $directKey = null;

        if ($type === "direct") {

            if (count($userIds) !== 1) {
                fail("個人チャットは相手を1人選択してください。");
            }

            $otherId = $userIds[0];

            $directKey =
                min($userId, $otherId) . "_" .
                max($userId, $otherId);

            $name = null;
            $description = "個人チャット";

        } else {

            if ($name === "" || mb_strlen($name) > 100) {
                fail("チャット名は1～100文字で入力してください。");
            }
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO chat_rooms (
                name,
                type,
                description,
                created_by,
                direct_key
            )
            VALUES (?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id)
        ");

        $stmt->execute([
            $name,
            $type,
            $description,
            $userId,
            $directKey
        ]);

        $roomId = (int)$pdo->lastInsertId();

        $userIds[] = $userId;

        $stmt = $pdo->prepare("
            INSERT INTO chat_members (
                room_id,
                user_id
            )
            VALUES (?, ?)

            ON DUPLICATE KEY UPDATE
                joined_at = joined_at
        ");

        foreach ($userIds as $memberId) {

            $stmt->execute([
                $roomId,
                $memberId
            ]);
        }

        $pdo->commit();

        response([
            "success" => true,
            "room_id" => $roomId,
            "message" => "チャットを作成しました。"
        ]);
    }

    /* ========================================
       4. メッセージ取得
    ======================================== */

    if ($action === "messages") {

        $roomId = getRoomId($data);

        requireMember($pdo, $roomId, $userId);

        $afterId = max(
            0,
            (int)($data["after_id"] ?? 0)
        );

        if ($afterId > 0) {

            $stmt = $pdo->prepare("
                SELECT
                    m.id,
                    m.room_id,
                    m.sender_id,
                    m.message,
                    m.created_at,
                    u.display_name AS sender_name
                FROM chat_messages m
                INNER JOIN users u
                    ON u.user_id = m.sender_id
                WHERE m.room_id = ?
                  AND m.id > ?
                ORDER BY m.id ASC
                LIMIT 200
            ");

            $stmt->execute([$roomId, $afterId]);

        } else {

            $stmt = $pdo->prepare("
                SELECT
                    m.id,
                    m.room_id,
                    m.sender_id,
                    m.message,
                    m.created_at,
                    u.display_name AS sender_name
                FROM chat_messages m
                INNER JOIN users u
                    ON u.user_id = m.sender_id
                WHERE m.room_id = ?
                ORDER BY m.id DESC
                LIMIT 200
            ");

            $stmt->execute([$roomId]);
        }

        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($afterId === 0) {
            $messages = array_reverse($messages);
        }

        $attachmentStmt = $pdo->prepare("
            SELECT
                id,
                original_name,
                mime_type,
                file_size
            FROM chat_attachments
            WHERE message_id = ?
            ORDER BY id
        ");

        $lastId = 0;

        foreach ($messages as &$message) {

            $message["mine"] =
                (int)$message["sender_id"] === $userId;

            $attachmentStmt->execute([
                $message["id"]
            ]);

            $message["attachments"] =
                $attachmentStmt->fetchAll(PDO::FETCH_ASSOC);

            $lastId = max(
                $lastId,
                (int)$message["id"]
            );
        }

        unset($message);

        /* 未読情報を更新 */

        if ($lastId > 0) {

            $stmt = $pdo->prepare("
                UPDATE chat_members
                SET last_read_message_id =
                    GREATEST(last_read_message_id, ?)
                WHERE room_id = ?
                  AND user_id = ?
            ");

            $stmt->execute([
                $lastId,
                $roomId,
                $userId
            ]);
        }

        response([
            "success" => true,
            "room_id" => $roomId,
            "messages" => $messages
        ]);
    }

    /* ========================================
       5. メッセージ送信
    ======================================== */

    if ($action === "send") {

        $roomId = getRoomId($data);

        requireMember($pdo, $roomId, $userId);

        $message = trim(
            (string)($data["message"] ?? "")
        );

        if (mb_strlen($message) > 5000) {
            fail("メッセージは5000文字以内で入力してください。");
        }

        $file = $_FILES["file"] ?? null;

        $hasFile = $file !== null &&
            $file["error"] !== UPLOAD_ERR_NO_FILE;

        if ($message === "" && !$hasFile) {
            fail("メッセージまたはファイルを指定してください。");
        }

        $fileInfo = null;

        /* ========================================
           添付ファイル確認
        ======================================== */

        if ($hasFile) {

            if ($file["error"] !== UPLOAD_ERR_OK) {
                fail("ファイルのアップロードに失敗しました。");
            }

            if (
                $file["size"] <= 0 ||
                $file["size"] > CHAT_MAX_FILE_SIZE
            ) {
                fail("ファイルは10MB以内にしてください。");
            }

            $originalName = basename(
                str_replace("\\", "/", $file["name"])
            );

            $extension = strtolower(
                pathinfo(
                    $originalName,
                    PATHINFO_EXTENSION
                )
            );

            $allowedTypes = [

                "jpg" => ["image/jpeg"],
                "jpeg" => ["image/jpeg"],
                "png" => ["image/png"],
                "gif" => ["image/gif"],
                "webp" => ["image/webp"],

                "pdf" => ["application/pdf"],

                "txt" => ["text/plain"],

                "csv" => [
                    "text/plain",
                    "text/csv",
                    "application/csv"
                ],

                "docx" => [
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ],

                "xlsx" => [
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ],

                "pptx" => [
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                ],

                "zip" => ["application/zip"]
            ];

            if (!isset($allowedTypes[$extension])) {
                fail("このファイル形式には対応していません。");
            }

            $finfo = new finfo(FILEINFO_MIME_TYPE);

            $mimeType = $finfo->file(
                $file["tmp_name"]
            );

            if (
                !in_array(
                    $mimeType,
                    $allowedTypes[$extension],
                    true
                )
            ) {
                fail("ファイルの形式が正しくありません。");
            }

            if (
                $originalName === "" ||
                mb_strlen($originalName) > 255
            ) {
                fail("ファイル名が正しくありません。");
            }

            if (
                !is_dir(CHAT_UPLOAD_DIR) ||
                !is_writable(CHAT_UPLOAD_DIR)
            ) {
                fail("ファイル保存先を利用できません。", 500);
            }

            $storedName =
                bin2hex(random_bytes(24)) .
                "." .
                $extension;

            $destination =
                CHAT_UPLOAD_DIR .
                "/" .
                $storedName;

            if (
                !move_uploaded_file(
                    $file["tmp_name"],
                    $destination
                )
            ) {
                fail("ファイルの保存に失敗しました。", 500);
            }

            $savedFilePath = $destination;

            $fileInfo = [
                "original_name" => $originalName,
                "stored_name" => $storedName,
                "mime_type" => $mimeType,
                "file_size" => $file["size"]
            ];
        }

        /* ========================================
           データベースへ保存
        ======================================== */

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (
                room_id,
                sender_id,
                message
            )
            VALUES (?, ?, ?)
        ");

        $stmt->execute([
            $roomId,
            $userId,
            $message
        ]);

        $messageId = (int)$pdo->lastInsertId();

        if ($fileInfo !== null) {

            $stmt = $pdo->prepare("
                INSERT INTO chat_attachments (
                    message_id,
                    original_name,
                    stored_name,
                    mime_type,
                    file_size
                )
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $messageId,
                $fileInfo["original_name"],
                $fileInfo["stored_name"],
                $fileInfo["mime_type"],
                $fileInfo["file_size"]
            ]);
        }

        $stmt = $pdo->prepare("
            UPDATE chat_rooms
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");

        $stmt->execute([$roomId]);

        $pdo->commit();

        $savedFilePath = null;

        response([
            "success" => true,
            "message_id" => $messageId,
            "message" => "メッセージを送信しました。"
        ]);
    }

    /* ========================================
       6. チャットメンバー取得
    ======================================== */

    if ($action === "members") {

        $roomId = getRoomId($data);

        requireMember($pdo, $roomId, $userId);

        $stmt = $pdo->prepare("
            SELECT
                u.user_id AS id,
                u.display_name AS name,
                u.role_code,
                u.job_title,
                cm.joined_at
            FROM chat_members cm
            INNER JOIN users u
                ON u.user_id = cm.user_id
            WHERE cm.room_id = ?
            ORDER BY cm.joined_at, u.user_id
        ");

        $stmt->execute([$roomId]);

        response([
            "success" => true,
            "members" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    /* ========================================
       7. グループメンバー追加
    ======================================== */

    if ($action === "add_members") {

        $roomId = getRoomId($data);

        requireMember($pdo, $roomId, $userId);

        $stmt = $pdo->prepare("
            SELECT type, created_by
            FROM chat_rooms
            WHERE id = ?
        ");

        $stmt->execute([$roomId]);

        $room = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$room || $room["type"] !== "group") {
            fail("グループチャットのみ追加できます。");
        }

        if ((int)$room["created_by"] !== $userId) {
            fail("チャット作成者のみメンバーを追加できます。", 403);
        }

        $userIds = getUserIds($data);

        validateUsers($pdo, $userIds);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO chat_members (
                room_id,
                user_id
            )
            VALUES (?, ?)

            ON DUPLICATE KEY UPDATE
                joined_at = joined_at
        ");

        foreach ($userIds as $memberId) {

            $stmt->execute([
                $roomId,
                $memberId
            ]);
        }

        $pdo->commit();

        response([
            "success" => true,
            "message" => "メンバーを追加しました。"
        ]);
    }

} catch (Throwable $e) {

    if (
        isset($pdo) &&
        $pdo instanceof PDO &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    if (
        $savedFilePath !== null &&
        is_file($savedFilePath)
    ) {
        unlink($savedFilePath);
    }

    error_log(
        "Tasfina Chat API: " .
        $e->getMessage()
    );

    fail(
        "チャット処理中にエラーが発生しました。",
        500
    );
}