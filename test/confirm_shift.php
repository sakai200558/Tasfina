<?php
header("Content-Type: application/json; charset=utf-8");
$host="127.0.0.1";
$db="Tasfina_db";
$user="root";
$pass="password";
$charset="utf8mb4";
$dsn="mysql:host=$host;dbname=$db;charset=$charset";
$options=[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC];
try{
$pdo=new PDO($dsn,$user,$pass,$options);
$input=json_decode(file_get_contents("php://input"),true);
$shiftIds=$input["shift_ids"]??[];
if(empty($shiftIds)){
echo json_encode(["status"=>"error","message"=>"確定するシフトが選択されていません。"],JSON_UNESCAPED_UNICODE);
exit;
}
$pdo->beginTransaction();
$stmt=$pdo->prepare("UPDATE shifts SET status = 'approved' WHERE shift_id = :id");
foreach($shiftIds as $shiftId){
$stmt->execute(["id"=>$shiftId]);
}
$pdo->commit();
echo json_encode(["status"=>"success","message"=>"シフトを正常に確定しました！"],JSON_UNESCAPED_UNICODE);
}catch(\Exception $e){
if(isset($pdo)&&$pdo->inTransaction()){$pdo->rollBack();}
http_response_code(500);
echo json_encode(["status"=>"error","message"=>$e->getMessage()],JSON_UNESCAPED_UNICODE);
}
?>