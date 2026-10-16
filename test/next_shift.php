<?php
$host="127.0.0.1";
$db="Tasfina_db";
$user="root";
$pass="password";
$charset="utf8mb4";
$dsn="mysql:host=$host;dbname=$db;charset=$charset";
$options=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC];
try{
$pdo=new PDO($dsn,$user,$pass,$options);
$current_userId=1;
$stmt=$pdo->prepare("SELECT * FROM shifts WHERE user_id = :user_id AND status = 'approved' AND work_date >= CURDATE() ORDER BY work_date ASC, start_time ASC LIMIT 1");
$stmt->execute(["user_id"=>$current_userId]);
$next_shift=$stmt->fetch();
if($next_shift){
$date=date("n月j日",strtotime($next_shift["work_date"]));
$start=date("H:i",strtotime($next_shift["start_time"]));
echo "次回予定: {$date} {$start}〜";
}else{
echo "今後のシフト予定はありません。";
}
}catch(\Exception $e){
echo "エラー: ".$e->getMessage();
}
?>