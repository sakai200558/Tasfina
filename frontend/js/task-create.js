<<<<<<< HEAD
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
=======

/* ========================================
   新規タスク作成モーダル
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const openButton = document.getElementById(
        "openTaskCreateModal"
    );

    const container = document.getElementById(
        "taskCreateModalContainer"
    );

    if (!openButton || !container) {
        return;
    }

    let modalLoaded = false;

    /* ========================================
       モーダルHTML読み込み
    ======================================== */

    async function loadTaskCreateModal() {

        if (modalLoaded) {
            return true;
        }

        try {

            const response = await fetch(
                "../modals/task-create.html"
            );

            if (!response.ok) {
                throw new Error(
                    `モーダル読み込み失敗: ${response.status}`
                );
            }

            const html = await response.text();

            container.innerHTML = html;

            initializeTaskCreateForm();

            modalLoaded = true;

            return true;

        } catch (error) {

            console.error(error);

            alert(
                "新規タスク作成画面を読み込めませんでした。"
            );

            return false;
        }
    }

    /* ========================================
       モーダルを開く
    ======================================== */

    openButton.addEventListener("click", async () => {

        const loaded = await loadTaskCreateModal();

        if (!loaded) {
            return;
        }

        const modalElement = document.getElementById(
            "taskCreateModal"
        );

        const modal = bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

        modal.show();
    });

    /* ========================================
       フォーム初期化
    ======================================== */

    function initializeTaskCreateForm() {

        const form = document.getElementById(
            "taskCreateForm"
        );

        const titleInput = document.getElementById(
            "taskTitle"
        );

        const titleError = document.getElementById(
            "titleError"
        );

        const formMessage = document.getElementById(
            "formMessage"
        );

        form.addEventListener("submit", event => {

            event.preventDefault();

            titleError.textContent = "";
            formMessage.textContent = "";

            const title = titleInput.value.trim();

            const assignee = document.getElementById(
                "assignee"
            ).value;

            const priority = document.getElementById(
                "priority"
            ).value;

            const description = document.getElementById(
                "taskDescription"
            ).value.trim();

            const startDate = document.getElementById(
                "startDate"
            ).value;

            const dueDate = document.getElementById(
                "dueDate"
            ).value;

            /* 入力チェック */

            if (!title) {

                titleError.textContent =
                    "タスク名を入力してください。";

                titleInput.focus();

                return;
            }

            if (!assignee || !startDate || !dueDate) {

                formMessage.textContent =
                    "必須項目をすべて入力してください。";

                return;
            }

            if (dueDate < startDate) {

                formMessage.textContent =
                    "期限は開始日以降に設定してください。";

                return;
            }

            /* 送信データ */

            const taskData = {
                title,
                description,
                assignee,
                priority,
                startDate,
                dueDate
            };

            console.log(
                "新規タスク作成（デモ）",
                taskData
            );

            /* モーダルを閉じる */

            const modalElement = document.getElementById(
                "taskCreateModal"
            );

            const modal = bootstrap.Modal.getInstance(
                modalElement
            );

            modal.hide();

            form.reset();

            alert(
                "入力内容を確認しました（デモ）。"
            );
        });
    }

});
>>>>>>> 055901f (設定)
