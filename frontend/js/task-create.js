/* ========================================
   新規タスク作成モーダル（インライン対応版）
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const openButton = document.getElementById("openTaskCreateModal");
    if (!openButton) {
        return;
    }

    // 1. ページ読み込み時に担当者一覧をセレクトボックスに読み込む
    loadAssignees();

// 2. モーダルを開くボタンのイベント
    openButton.addEventListener("click", async () => {
        const modalElement = document.getElementById("taskCreateModal");
        if (!modalElement) return;

        await loadAssignees();

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    });

    // 3. フォームの送信処理を初期化
    const form = document.getElementById("taskCreateForm");
    if (form) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const titleInput = document.getElementById("taskTitle");
            const titleError = document.getElementById("titleError");
            const formMessage = document.getElementById("formMessage");

            if (titleError) titleError.textContent = "";
            if (formMessage) formMessage.textContent = "";

            const title = titleInput ? titleInput.value.trim() : "";
            const assignee = document.getElementById("assignee").value;
            const priority = document.getElementById("priority").value;
            const description = document.getElementById("taskDescription") ? document.getElementById("taskDescription").value.trim() : "";
            const startDate = document.getElementById("startDate").value;
            const dueDate = document.getElementById("dueDate").value;

            // ★ ここに難易度と不快度を取得する処理を追加！
            const difficultyLevel = document.getElementById("difficultyLevel").value;
            const discomfortLevel = document.getElementById("discomfortLevel").value;

            /* 入力チェック */
            if (!title) {
                if (titleError) titleError.textContent = "タスク名を入力してください。";
                if (titleInput) titleInput.focus();
                return;
            }

            if (!assignee || !startDate || !dueDate) {
                if (formMessage) formMessage.textContent = "必須項目をすべて入力してください。";
                return;
            }

            if (dueDate < startDate) {
                if (formMessage) formMessage.textContent = "期限は開始日以降に設定してください。";
                return;
            }

            /* 送信データ（PHPの api_create_task.php に合わせる） */
            const taskData = {
                title,
                description,
                assignee, // 担当者の user_id
                difficulty_level: parseFloat(difficultyLevel), // ★ セレクトボックスの値を使用
                discomfort_level: parseFloat(discomfortLevel), // ★ 不快度を追加
                estimated_hours: 4.0,
                due_date: dueDate
            };

            try {
                const response = await fetch("../../backend/api_create_task.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(taskData)
                });

                const result = await response.json();

                if (result.status === "success") {
                    if (formMessage) {
                        formMessage.style.color = "#2b9a70";
                        formMessage.textContent = "タスクが正常に登録されました！";
                    }

                    /* モーダルを閉じる */
                    const modalElement = document.getElementById("taskCreateModal");
                    const modal = bootstrap.Modal.getInstance(modalElement);

                    setTimeout(() => {
                        if (modal) modal.hide();
                        form.reset();
                        location.reload(); // 一覧を更新するためにリロード
                    }, 1000);

                } else {
                    if (formMessage) {
                        formMessage.style.color = "#d84c4c";
                        formMessage.textContent = "エラー: " + result.message;
                    }
                }

            } catch (error) {
                console.error("通信エラー:", error);
                if (formMessage) {
                    formMessage.style.color = "#d84c4c";
                    formMessage.textContent = "サーバーとの通信に失敗しました。";
                }
            }
        });
    }

    /* ========================================
       担当者セレクトボックスにメンバー一覧を読み込む
    ======================================== */
   async function loadAssignees() {
        try {
            const response = await fetch("../../backend/api_users.php");
            if (!response.ok) {
                throw new Error("ユーザー一覧の取得に失敗しました");
            }
            const data = await response.json();
            const users = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : []);

            const assigneeSelect = document.getElementById("assignee");
            if (!assigneeSelect) return;

            assigneeSelect.innerHTML = '<option value="">担当者を選択してください</option>';

            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id; // user_id
                option.textContent = user.name; // display_name
                assigneeSelect.appendChild(option);
            });
        } catch (error) {
            console.error("メンバー読み込みエラー:", error);
        }
    }
});