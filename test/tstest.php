<?php
// データベース接続情報
$host = 'localhost';
$dbname = 'Tasfina_db'; // 実際のデータベース名に変更してください
$username = 'root';     // 実際のユーザー名に変更してください
$password = 'password';     // 実際のパスワードに変更してください
$charset = 'utf8mb4';
 
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
 
try {
    // 1. データベース接続
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "<h2>データベース接続に成功しました！</h2>";
 
    // 2. 必要に応じてテーブル作成や初期設定をここに記述できます
    // 例: usersテーブルが存在するか確認するクエリなど
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll();
 
    echo "<h3>現在のデータベース内のテーブル一覧:</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        // 配列の最初の値（テーブル名）を取得
        $tableName = reset($table);
        echo "<li>" . htmlspecialchars($tableName, ENT_QUOTES, 'UTF-8') . "</li>";
    }
    echo "</ul>";
 
} catch (\PDOException $e) {
    echo "<h2>データベース接続または処理に失敗しました。</h2>";
    echo "エラー内容: " . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
}
?>