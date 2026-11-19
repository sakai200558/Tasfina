
<?php

session_start();

header("Content-Type: application/json; charset=utf-8");

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

try {

    if (!isset($_SESSION["user_id"])) {
        throw new Exception("ログインしてください");
    }

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    // 期間取得
    $before = $_POST["before"] ?? "";
    $after = $_POST["after"] ?? "";

    // 日付形式チェック
    $startDate = DateTime::createFromFormat('!Y-m-d', $before);
    $endDate = DateTime::createFromFormat('!Y-m-d', $after);

    if (
        !$startDate ||
        !$endDate ||
        $startDate->format('Y-m-d') !== $before ||
        $endDate->format('Y-m-d') !== $after ||
        $startDate > $endDate
    ) {
        throw new Exception("期間の指定が不正です");
    }

    // タスク取得
    $sql = "
        SELECT *
        FROM tasks
        WHERE due_date BETWEEN :before AND :after
        ORDER BY due_date ASC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':before' => $before,
        ':after' => $after
    ]);

    $rows = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "tasks" => $rows
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    error_log($e->getMessage());

    echo json_encode([
        "success" => false,
        "comment" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

}

?>
