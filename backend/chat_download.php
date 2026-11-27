<?php

/* ========================================
   Tasfina 添付ファイル取得
======================================== */

session_start();

define(
    "CHAT_UPLOAD_DIR",
    "/var/lib/tasfina/chat_uploads"
);

function downloadError($message, $status)
{
    http_response_code($status);

    header(
        "Content-Type: text/plain; charset=utf-8"
    );

    echo $message;

    exit;
}

/* ログイン確認 */

$userId = (int)($_SESSION["user_id"] ?? 0);

session_write_close();

if ($userId <= 0) {
    downloadError("ログインしてください。", 401);
}

$attachmentId = filter_var(
    $_GET["id"] ?? null,
    FILTER_VALIDATE_INT
);

if (!$attachmentId || $attachmentId < 1) {
    downloadError("ファイルIDが正しくありません。", 400);
}

try {

    require_once __DIR__ . "/db.php";

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    /* ========================================
       チャット参加者か確認
    ======================================== */

    $stmt = $pdo->prepare("
        SELECT
            a.id,
            a.original_name,
            a.stored_name,
            a.mime_type,
            a.file_size
        FROM chat_attachments a

        INNER JOIN chat_messages m
            ON m.id = a.message_id

        INNER JOIN chat_members cm
            ON cm.room_id = m.room_id

        INNER JOIN users u
            ON u.user_id = cm.user_id

        WHERE a.id = ?
          AND cm.user_id = ?

        LIMIT 1
    ");

    $stmt->execute([
        $attachmentId,
        $userId
    ]);

    $file = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$file) {
        downloadError(
            "ファイルが存在しないか、閲覧権限がありません。",
            404
        );
    }

    /* ========================================
       ファイルの存在確認
    ======================================== */

    $basePath = realpath(CHAT_UPLOAD_DIR);

    $filePath = realpath(
        CHAT_UPLOAD_DIR .
        "/" .
        basename($file["stored_name"])
    );

    if (
        $basePath === false ||
        $filePath === false ||
        strpos(
            $filePath,
            $basePath . DIRECTORY_SEPARATOR
        ) !== 0 ||
        !is_file($filePath) ||
        !is_readable($filePath)
    ) {
        downloadError(
            "保存されたファイルが見つかりません。",
            404
        );
    }

    /* ========================================
       画像表示・ダウンロード
    ======================================== */

    $imageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    $inline = isset($_GET["inline"]) &&
        $_GET["inline"] === "1" &&
        in_array(
            $file["mime_type"],
            $imageTypes,
            true
        );

    $disposition = $inline
        ? "inline"
        : "attachment";

    $contentType = $inline
        ? $file["mime_type"]
        : "application/octet-stream";

    header("Content-Type: " . $contentType);

    header("X-Content-Type-Options: nosniff");

    header("Cache-Control: private, no-store");

    header(
        "Content-Length: " .
        filesize($filePath)
    );

    header(
        "Content-Disposition: " .
        $disposition .
        "; filename=\"attachment\"; filename*=UTF-8''" .
        rawurlencode($file["original_name"])
    );

    readfile($filePath);

    exit;

} catch (Throwable $e) {

    error_log(
        "Tasfina Chat Download: " .
        $e->getMessage()
    );

    downloadError(
        "ファイル取得中にエラーが発生しました。",
        500
    );
}