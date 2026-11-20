<?php

session_start();

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// ログイン確認
if (empty($_SESSION['user_id']) || empty($_SESSION['group_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'ログインしてください']);
    exit;
}
$sessionUserId = (int)$_SESSION['user_id'];
$groupId       = (int)$_SESSION['group_id'];

$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '不正なJSONです']);
    exit;
}

$name             = trim($input['name'] ?? '');
$parentDepartment = $input['parentDepartment'] ?? null;
$description      = $input['description'] ?? '';
$color            = $input['color'] ?? '';
$icon             = $input['icon'] ?? '';
$manager          = $input['manager'] ?? null;
$members          = $input['members'] ?? [];

if ($name === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'name は必須です']);
    exit;
}
if (!is_array($members)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'members は配列で指定してください']);
    exit;
}

// 型を整える
$parentDeptId = ($parentDepartment === null || $parentDepartment === '') ? null : (int)$parentDepartment;
$leaderId     = ($manager === null || $manager === '') ? null : (int)$manager;
$memberIds    = array_values(array_unique(array_map('intval', $members)));

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB接続に失敗しました']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1行目: dept_id は AUTO_INCREMENT で採番
    $sqlFirst = "INSERT INTO departments
                    (group_id, dept_name, parent_dept_id, leader_id, user_id, created_at)
                 VALUES
                    (:group_id, :dept_name, :parent_dept_id, :leader_id, :user_id, NOW())";
    $stmtFirst = $pdo->prepare($sqlFirst);

    // メンバーが空なら user_id = NULL の1行だけ作成
    $firstUserId = $memberIds[0] ?? null;

    $stmtFirst->execute([
        ':group_id'       => $groupId,
        ':dept_name'      => $name,
        ':parent_dept_id' => $parentDeptId,
        ':leader_id'      => $leaderId,
        ':user_id'        => $firstUserId,
    ]);

    $deptId = (int)$pdo->lastInsertId();

    // 2行目以降: 同じ dept_id / group_id / leader_id で user_id だけ変える
    if (count($memberIds) > 1) {
        $sqlRest = "INSERT INTO departments
                        (dept_id, group_id, dept_name, parent_dept_id, leader_id, user_id, created_at)
                    VALUES
                        (:dept_id, :group_id, :dept_name, :parent_dept_id, :leader_id, :user_id, NOW())";
        $stmtRest = $pdo->prepare($sqlRest);

        foreach (array_slice($memberIds, 1) as $memberId) {
            $stmtRest->execute([
                ':dept_id'        => $deptId,
                ':group_id'       => $groupId,
                ':dept_name'      => $name,
                ':parent_dept_id' => $parentDeptId,
                ':leader_id'      => $leaderId,
                ':user_id'        => $memberId,
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'dept_id' => $deptId,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '登録に失敗しました']);
}