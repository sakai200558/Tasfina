document.addEventListener('DOMContentLoaded', () => {
 const form=document.getElementById('taskCreateForm'); if(!form)return;
 const start=document.getElementById('startDate'), due=document.getElementById('dueDate');
 const today=new Date(); const localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
 start.min=localToday; due.min=localToday;
 start.addEventListener('change',()=>{due.min=start.value||localToday;if(due.value&&due.value<start.value)due.value=start.value;});
 form.addEventListener('submit',e=>{
  e.preventDefault();
  const title=document.getElementById('taskTitle'), assignee=document.getElementById('assignee'), error=document.getElementById('titleError'), message=document.getElementById('formMessage');
  [title,assignee,start,due].forEach(el=>el.classList.remove('is-invalid'));error.textContent='';message.textContent='';
  let valid=true;
  if(!title.value.trim()){title.classList.add('is-invalid');error.textContent='タスク名を入力してください。';valid=false;}
  [assignee,start,due].forEach(el=>{if(!el.value){el.classList.add('is-invalid');valid=false;}});
  if(start.value&&due.value&&due.value<start.value){due.classList.add('is-invalid');message.style.color='#d84c4c';message.textContent='期限は開始日以降の日付を指定してください。';valid=false;}
  if(!valid){if(!message.textContent)message.textContent='必須項目を確認してください。';message.style.color='#d84c4c';return;}
  message.style.color='#2b9a70';message.textContent='入力内容を確認しました。保存処理はPHP・MySQL接続後に有効になります。';
 });
});
