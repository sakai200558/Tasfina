const initialTasks = [
 {id:1,title:'タスク管理画面のUI設計',description:'タスク一覧画面のデザインを確定する',owner:'田中 龍之介',priority:'高',status:'進行中',due:'2026-10-17',progress:70,icon:'✦'},
 {id:2,title:'データベース設計書の作成',description:'テーブル定義とリレーションを整理する',owner:'佐藤 花子',priority:'高',status:'確認待ち',due:'2026-10-18',progress:90,icon:'▤'},
 {id:3,title:'ログイン機能の実装',description:'ログイン画面と入力チェックを実装する',owner:'鈴木 太郎',priority:'高',status:'進行中',due:'2026-10-19',progress:55,icon:'⌘'},
 {id:4,title:'週次ミーティング資料',description:'今週の進捗をまとめる',owner:'山田 美咲',priority:'中',status:'未着手',due:'2026-10-20',progress:0,icon:'▧'},
 {id:5,title:'API仕様書のレビュー',description:'APIの入出力仕様を確認する',owner:'田中 龍之介',priority:'中',status:'確認待ち',due:'2026-10-21',progress:85,icon:'⌘'},
 {id:6,title:'ユーザー登録機能',description:'新規登録フローを作成する',owner:'佐藤 花子',priority:'高',status:'進行中',due:'2026-10-22',progress:45,icon:'♙'},
 {id:7,title:'テストケースの作成',description:'主要機能のテスト項目を整理する',owner:'鈴木 太郎',priority:'中',status:'未着手',due:'2026-10-23',progress:0,icon:'✓'},
 {id:8,title:'画面遷移図の更新',description:'変更後の画面遷移を反映する',owner:'山田 美咲',priority:'低',status:'完了',due:'2026-10-12',progress:100,icon:'⌘'},
 {id:9,title:'通知機能の確認',description:'通知表示と既読処理を検証する',owner:'田中 龍之介',priority:'中',status:'進行中',due:'2026-10-24',progress:60,icon:'♧'},
 {id:10,title:'CSS共通化',description:'全ページ共通のスタイルを整理する',owner:'佐藤 花子',priority:'低',status:'完了',due:'2026-10-11',progress:100,icon:'✧'},
 {id:11,title:'操作マニュアル作成',description:'基本操作の手順書を作成する',owner:'鈴木 太郎',priority:'低',status:'完了',due:'2026-10-10',progress:100,icon:'▧'},
 {id:12,title:'プロジェクト初期設定',description:'開発環境とリポジトリを準備する',owner:'山田 美咲',priority:'中',status:'完了',due:'2026-10-09',progress:100,icon:'⚙'}
];
let tasks = [...initialTasks];
const $ = id => document.getElementById(id);
const ownerInitial = name => name.charAt(0);
const ownerColors = {'田中 龍之介':'#e6e3ff','佐藤 花子':'#ffe9df','鈴木 太郎':'#e0f4ed','山田 美咲':'#e1efff'};
const statusClass = {'未着手':'todo','進行中':'progress','確認待ち':'review','完了':'done'};
const priorityClass = {'高':'high','中':'medium','低':'low'};
const dateLabel = value => { const d = new Date(value+'T00:00:00'); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; };
function escapeHTML(value){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderTasks(){
 const query = $('searchInput').value.trim().toLowerCase();
 const status = $('statusFilter').value, priority = $('priorityFilter').value;
 const visible = tasks.filter(t => (!query || (t.title+' '+t.owner+' '+t.description).toLowerCase().includes(query)) && (!status || t.status===status) && (!priority || t.priority===priority));
 $('taskRows').innerHTML = visible.map(t => `<tr>
 <td><input type="checkbox" class="row-check" data-id="${t.id}" aria-label="${escapeHTML(t.title)}を選択"></td>
 <td><div class="task-name"><span class="task-symbol">${t.icon}</span><span><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.description)}</small></span></div></td>
 <td><div class="person"><span class="avatar" style="background:${ownerColors[t.owner]||'#e4e1ff'}">${ownerInitial(t.owner)}</span>${escapeHTML(t.owner)}</div></td>
 <td><span class="priority ${priorityClass[t.priority]}">${t.priority}優先</span></td>
 <td><span class="status ${statusClass[t.status]}">${t.status}</span></td>
 <td><span class="due ${t.due<'2026-10-16'&&t.status!=='完了'?'overdue':''}">${dateLabel(t.due)}</span></td>
 <td class="progress-cell"><div class="progress-meta"><span>進捗</span><span>${t.progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${t.progress}%"></div></div></td>
 <td><button class="row-menu" data-menu="${t.id}" aria-label="タスク操作">⋯</button></td></tr>`).join('');
 $('emptyState').hidden = visible.length>0;
 $('resultCount').textContent = `${tasks.length}件中 ${visible.length}件を表示`;
 $('totalCount').textContent=tasks.length;
 $('progressCount').textContent=tasks.filter(t=>t.status==='進行中').length;
 $('doneCount').textContent=tasks.filter(t=>t.status==='完了').length;
 $('dueCount').textContent=tasks.filter(t=>t.status!=='完了' && t.due>='2026-10-16' && t.due<='2026-10-19').length;
 $('selectAll').checked=false;
}
['searchInput','statusFilter','priorityFilter'].forEach(id=>$(id).addEventListener(id==='searchInput'?'input':'change',renderTasks));
$('resetFilters').addEventListener('click',()=>{$('searchInput').value='';$('statusFilter').value='';$('priorityFilter').value='';renderTasks();});
const modal=$('taskModal');
function openModal(){modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('input[name=title]').focus();}
function closeModal(){modal.hidden=true;document.body.style.overflow='';$('taskForm').reset();}
$('openCreate').addEventListener('click',openModal);$('closeModal').addEventListener('click',closeModal);$('cancelCreate').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal();});
$('taskForm').addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(e.currentTarget);
 tasks.unshift({id:Math.max(0,...tasks.map(t=>t.id))+1,title:data.get('title').trim(),description:data.get('description').trim()||'説明はありません',owner:data.get('owner'),priority:data.get('priority'),status:data.get('status'),due:data.get('due'),progress:data.get('status')==='完了'?100:data.get('status')==='進行中'?25:0,icon:'✦'});
 closeModal();$('searchInput').value='';$('statusFilter').value='';$('priorityFilter').value='';renderTasks();
});
$('taskRows').addEventListener('click',e=>{
 const button=e.target.closest('[data-menu]');if(!button)return;
 const task=tasks.find(t=>t.id===Number(button.dataset.menu));if(!task)return;
 const choice=prompt(`「${task.title}」のステータスを変更します。\n1: 未着手\n2: 進行中\n3: 確認待ち\n4: 完了\n番号を入力してください`,String(['未着手','進行中','確認待ち','完了'].indexOf(task.status)+1));
 const map={'1':'未着手','2':'進行中','3':'確認待ち','4':'完了'};if(map[choice]){task.status=map[choice];task.progress=task.status==='完了'?100:task.status==='未着手'?0:task.progress;renderTasks();}
});
$('selectAll').addEventListener('change',e=>document.querySelectorAll('.row-check').forEach(c=>c.checked=e.target.checked));
$('exportBtn').addEventListener('click',()=>{
 const rows=[['タスク名','説明','担当者','優先度','ステータス','期限','進捗'],...tasks.map(t=>[t.title,t.description,t.owner,t.priority,t.status,t.due,t.progress+'%'])];
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tasfina-tasks.csv';a.click();URL.revokeObjectURL(url);
});
$('notificationBtn').addEventListener('click',()=>alert('新しい通知はありません。'));
$('userMenu').addEventListener('click',()=>alert('ログインユーザー：田中 龍之介'));
renderTasks();