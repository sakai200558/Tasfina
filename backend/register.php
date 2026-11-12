
<?php

header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$dbname = 'Tasfina_db';
$username = 'root';
$password = 'password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

$pdo = null;

try {

    // JSON取得
    $query = json_decode(file_get_contents("php://input"), true);

    if (!is_array($query)) {
        throw new Exception("不正なJSONです");
    }

    $useremail = trim($query["email"] ?? "");
    $rawPassword = $query["password"] ?? "";
    $username2 = trim($query["username"] ?? "");
    $group_id = $query["deptCode"] ?? null;
    $specialCode = $query["specialCode"] ?? "";

    if ($useremail === "" || $username2 === "" || $rawPassword === "") {
        throw new Exception("必須項目が入力されていません");
    }

    // パスワードを安全にハッシュ化
    $userpassword = password_hash($rawPassword, PASSWORD_DEFAULT);

    // グループIDの形式確認
    if (!empty($group_id)) {
        $group_id = filter_var($group_id, FILTER_VALIDATE_INT);

        if ($group_id === false || $group_id <= 0) {
            throw new Exception("企業IDが不正です");
        }
    } else {
        $group_id = null;
    }

    $date = date("Y-m-d H:i:s");

    $pdo = new PDO($dsn, $username, $password, $options);

    $pdo->beginTransaction();

    // ユーザー名重複確認
    $sql = "SELECT user_id FROM users
            WHERE display_name = :display_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':display_name' => $username2
    ]);

    if ($stmt->fetch()) {
        throw new Exception("そのユーザー名はもう使われています。");
    }

    // メールアドレス重複確認
    $sql = "SELECT user_id FROM users
            WHERE email = :email";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':email' => $useremail
    ]);

    if ($stmt->fetch()) {
        throw new Exception("そのメールアドレスは既に使用されています。");
    }

    /*
     * 1. ユーザー登録
     */

    $sql = "INSERT INTO users
            (display_name, email, password_hash, role_code,
             level_factor, created_at)
            VALUES
            (:display_name, :email, :password_hash, :role_code,
             :level_factor, :created_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':display_name' => $username2,
        ':email' => $useremail,
        ':password_hash' => $userpassword,
        ':role_code' => $specialCode,
        ':level_factor' => 0,
        ':created_at' => $date
    ]);

    $new_user_id = (int)$pdo->lastInsertId();

    /*
     * 2. グループの確認・作成
     */

    if ($group_id !== null) {

        // 既存グループに参加
        $sql = "SELECT group_id, group_name
                FROM member
                WHERE group_id = :group_id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':group_id' => $group_id
        ]);

        $member = $stmt->fetch();

        if (!$member) {
            throw new Exception("企業IDが無効です");
        }

        $new_group_id = (int)$member['group_id'];
        $group_name = $member['group_name'];

    } else {

        // 新規グループ作成
        $group_name = $username2 . "のグループ";

        $sql = "INSERT INTO member
                (group_name, owner_id, created_at)
                VALUES
                (:group_name, :owner_id, :created_at)";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':group_name' => $group_name,
            ':owner_id' => $new_user_id,
            ':created_at' => $date
        ]);

        // memberで発行されたグループIDを取得
        $new_group_id = (int)$pdo->lastInsertId();

    }

    /*
     * 3. usersにgroup_idを設定
     */

    $sql = "UPDATE users
            SET group_id = :group_id
            WHERE user_id = :user_id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id,
        ':user_id' => $new_user_id
    ]);

    /*
     * 4. user_groups登録
     */

    $sql = "INSERT INTO user_groups
            (group_id, user_id, group_name, created_at)
            VALUES
            (:group_id, :user_id, :group_name, :created_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id,
        ':user_id' => $new_user_id,
        ':group_name' => $group_name,
        ':created_at' => $date
    ]);

    /*
     * 5. workload_scores登録
     */

    $sql = "INSERT INTO workload_scores
            (user_id, group_id, task_pt, shift_pt,
             busy_day_pt, total_score)
            VALUES
            (:user_id, :group_id, :task_pt, :shift_pt,
             :busy_day_pt, :total_score)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':group_id' => $new_group_id,
        ':task_pt' => 0,
        ':shift_pt' => 0,
        ':busy_day_pt' => 0,
        ':total_score' => 0
    ]);

    /*
     * 6. departments登録
     *
     * 現在の元コードと同様、ユーザー登録ごとに
     * departmentsのレコードを1件作成する。
     */

    $sql = "INSERT INTO departments
            (group_id)
            VALUES
            (:group_id)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':group_id' => $new_group_id
    ]);

    $new_dept_id = (int)$pdo->lastInsertId();

    /*
     * 7. department_members登録
     */

    $sql = "INSERT INTO department_members
            (user_id, dept_id, joined_at)
            VALUES
            (:user_id, :dept_id, :joined_at)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':dept_id' => $new_dept_id,
        ':joined_at' => $date
    ]);

    /*
     * 8. shifts登録
     */

    $sql = "INSERT INTO shifts
            (user_id, created_at, updated_at, group_id)
            VALUES
            (:user_id, :created_at, :updated_at, :group_id)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':user_id' => $new_user_id,
        ':created_at' => $date,
        ':updated_at' => $date,
        ':group_id' => $new_group_id
    ]);

    // 全処理成功
    $pdo->commit();

    echo json_encode([
        "comment" => "成功しました。",
        "success" => true,
        "user_id" => $new_user_id,
        "group_id" => $new_group_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->getMessage());

    echo json_encode([
        "comment" => $e->getMessage(),
        "success" => false
    ], JSON_UNESCAPED_UNICODE);

}

?>
