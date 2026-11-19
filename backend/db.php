<?php

$host = 'localhost';
$dbname = 'Tasfina_db'; // データベース名
$username = 'root';    // ユーザー名
$password = '';        // ★ローカル環境の場合は基本空欄 '' にするで！
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// ここで接続エラーが起きた場合は、自動的に例外が飛んで呼び出し元で処理される
$pdo = new PDO($dsn, $username, $password, $options);

?>