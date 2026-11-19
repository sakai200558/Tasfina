
/* ========================================
   Tasfina マイページ専用JavaScript
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       ログイン中のユーザー情報取得
    ======================================== */

    loadMyPageUser();
    loadMyPageTasks();


    /* ========================================
       所属部門コードのコピー
    ======================================== */

    const copyButton =
        document.getElementById("copyDeptCode");

    const copyMessage =
        document.getElementById("copyMessage");

    let messageTimer;


    /* ========================================
       コピー結果メッセージ
    ======================================== */

    function showCopyMessage(message) {

        if (!copyMessage) {
            return;
        }

        copyMessage.textContent = message;

        copyMessage.classList.add("show");

        clearTimeout(messageTimer);

        messageTimer = setTimeout(() => {

            copyMessage.classList.remove("show");

        }, 2500);

    }


    /* ========================================
       所属部門コードのコピー処理
    ======================================== */

    if (copyButton) {

        copyButton.addEventListener("click", async () => {

            const deptCode =
                copyButton.dataset.code || "";

            if (!deptCode) {

                showCopyMessage(
                    "コピーできる所属部門コードがありません"
                );

                return;
            }

            try {

                await navigator.clipboard.writeText(
                    deptCode
                );

                showCopyMessage(
                    "所属部門コードをコピーしました"
                );

            } catch (error) {

                console.error(
                    "コピーに失敗しました:",
                    error
                );

                showCopyMessage(
                    "コピーに失敗しました"
                );

            }

        });

    }

    /*
       プロフィール編集モーダルの処理は
       profile-edit.js に任せます。

       ここではクリックイベントを
       重複登録しません。
    */

});


/* ========================================
   所属部門表示の更新
======================================== */

function updateMyPageDepartment(user) {

    const departmentElement =
        document.getElementById("mypageDepartment");

    const copyButton =
        document.getElementById("copyDeptCode");

    if (!departmentElement) {
        return;
    }

    const departmentName =
        String(user.department_name ?? "").trim();

    const departmentCode =
        String(user.department_code ?? "").trim();


    /* ========================================
       所属部門がある場合
    ======================================== */

    if (departmentName || departmentCode) {

        departmentElement.textContent =
            departmentName
                ? `所属部門：${departmentName}`
                : `所属部門コード：${departmentCode}`;

        if (copyButton) {

            copyButton.dataset.code =
                departmentCode;

            copyButton.hidden =
                !departmentCode;

        }

        return;
    }


    /* ========================================
       所属部門がない場合
    ======================================== */

    departmentElement.textContent =
        "所属部門：未所属";

    if (copyButton) {

        copyButton.dataset.code = "";

        copyButton.hidden = true;

    }

}


/* ========================================
   ログイン中のユーザー情報取得
======================================== */

async function loadMyPageUser() {

    const nameElement =
        document.getElementById("mypageUserName");

    const emailElement =
        document.getElementById("mypageUserEmail");

    const roleElement =
        document.getElementById("mypageUserRole");

    const departmentElement =
        document.getElementById("mypageDepartment");

    const copyButton =
        document.getElementById("copyDeptCode");

    if (!nameElement || !emailElement) {
        return;
    }

    try {

        /* =====================================
           PHPへリクエスト送信
        ===================================== */

        const response = await fetch(
            "../../backend/userprofile.php",
            {
                method: "GET",

                credentials: "same-origin",

                headers: {
                    "Accept": "application/json"
                }
            }
        );


        /* =====================================
           未ログインの場合
        ===================================== */

        if (response.status === 401) {

            window.location.href = "login.html";

            return;
        }


        /* =====================================
           HTTPエラー確認
        ===================================== */

        if (!response.ok) {

            throw new Error(
                `ユーザー情報の取得に失敗しました。HTTP ${response.status}`
            );

        }


        /* =====================================
           JSON取得
        ===================================== */

        const result = await response.json();

        if (
            result.success !== true ||
            !result.user
        ) {

            throw new Error(
                result.message ||
                "ユーザー情報を取得できませんでした。"
            );

        }

        const user = result.user;


        /* =====================================
           ユーザー名表示
        ===================================== */

        nameElement.textContent =
            user.name || "名前未設定";


        /* =====================================
           メールアドレス表示
        ===================================== */

        emailElement.textContent =
            user.email || "メールアドレス未設定";


        /* =====================================
           役職表示
        ===================================== */

        if (roleElement) {

            const roleNames = {
                "1000": "全社管理者",
                "2000": "部門管理者",
                "3000": "一般メンバー",
                "4000": "閲覧専用"
            };

            const roleCode =
                String(user.role_code ?? "");

            const roleName =
                roleNames[roleCode] || "権限未設定";

            const jobTitle =
                user.job_title;

            roleElement.textContent =
                jobTitle
                    ? `${jobTitle}／${roleName}`
                    : roleName;

        }


        /* =====================================
           所属部門表示
        ===================================== */

        updateMyPageDepartment(user);


        console.log(
            "ユーザー情報取得成功:",
            user
        );

    } catch (error) {

        console.error(
            "ユーザー情報取得エラー:",
            error
        );

        nameElement.textContent =
            "取得できませんでした";

        emailElement.textContent = "";

        if (roleElement) {

            roleElement.textContent = "";

        }

        if (departmentElement) {

            departmentElement.textContent =
                "所属部門：取得できませんでした";

        }

        if (copyButton) {

            copyButton.dataset.code = "";

            copyButton.hidden = true;

        }

    }

}

/* ========================================
   マイページ 担当タスク取得
======================================== */

async function loadMyPageTasks() {

    const taskCountElement =
        document.getElementById("mypageTaskCount");

    const pendingCountElement =
        document.getElementById("mypagePendingCount");

    const recentTasksElement =
        document.getElementById("mypageRecentTasks");

    if (
        !taskCountElement ||
        !pendingCountElement ||
        !recentTasksElement
    ) {
        return;
    }

    try {

        /* =====================================
           PHPからタスク取得
        ===================================== */

        const response = await fetch(
            "../../backend/mypage_tasks.php",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        /* =====================================
           未ログイン
        ===================================== */

        if (response.status === 401) {

            window.location.href = "login.html";

            return;
        }

        if (!response.ok) {

            throw new Error(
                `HTTPエラー: ${response.status}`
            );
        }

        const result = await response.json();

        if (
            result.success !== true ||
            !Array.isArray(result.tasks)
        ) {

            throw new Error(
                result.message ||
                "タスクを取得できませんでした。"
            );
        }

        /* =====================================
           担当タスク件数
        ===================================== */

        taskCountElement.textContent =
            `${result.assigned_count}件`;

        /* =====================================
           承認待ち件数
        ===================================== */

        pendingCountElement.textContent =
            `${result.pending_count}件`;

        /* =====================================
           最近のタスク表示
        ===================================== */

        renderMyPageTasks(
            result.tasks,
            recentTasksElement
        );

        console.log(
            "マイページタスク取得成功:",
            result
        );

    } catch (error) {

        console.error(
            "マイページタスク取得エラー:",
            error
        );

        taskCountElement.textContent = "取得失敗";

        pendingCountElement.textContent = "取得失敗";

        recentTasksElement.textContent =
            "タスク情報を取得できませんでした。";
    }
}


/* ========================================
   ステータス日本語変換
======================================== */

function translateMyPageTaskStatus(status) {

    const statusNames = {

        "assigned": "未着手",

        "in_progress": "進行中",

        "pending": "承認待ち",

        "completed": "完了",

        "done": "完了",

        "closed": "完了"

    };

    return statusNames[status] || status || "未着手";
}


/* ========================================
   最近のタスク描画
======================================== */

function renderMyPageTasks(tasks, container) {

    container.innerHTML = "";

    /* =====================================
       未完了タスクを表示
    ===================================== */

    const activeTasks = tasks.filter(task => {

        return ![
            "completed",
            "done",
            "closed",
            "完了"
        ].includes(task.status);

    });

    /* =====================================
       タスクがない場合
    ===================================== */

    if (activeTasks.length === 0) {

        const empty = document.createElement("div");

        empty.className = "recent-task-item";

        empty.textContent =
            "現在担当している未完了タスクはありません。";

        container.appendChild(empty);

        return;
    }

    /* =====================================
       最大5件表示
    ===================================== */

    activeTasks.slice(0, 5).forEach(task => {

        const item = document.createElement("div");

        item.className = "recent-task-item";

        /* タスク名 */

        const name = document.createElement("span");

        name.className = "task-name";

        name.textContent =
            task.title || "タスク名未設定";

        /* ステータス */

        const status = document.createElement("span");

        status.className = "task-status";

        status.textContent =
            translateMyPageTaskStatus(task.status);

        /* HTMLへ追加 */

        item.appendChild(name);

        item.appendChild(status);

        container.appendChild(item);

    });
}
